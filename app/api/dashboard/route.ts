export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import {
  fetchDropdeskCounts,
  fetchApolloTickets,
  calcApolloCountsFromTickets,
  calcApolloAttendants,
  fetchDropdeskTickets,
  DROPDESK_STATUS,
  getApolloToken,
} from '@/lib/external-apis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getTodayStr(): string {
  const now = new Date();
  // Ajustar para fuso horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60;
  const localTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams?.get('date');
    const todayStr = dateParam || getTodayStr();

    // Pegar chave de acesso (LIC_...) do header
    const authHeader = request.headers.get('Authorization');
    const chaveAcesso = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!chaveAcesso) {
      return NextResponse.json({ error: 'Nenhuma chave de acesso fornecida.' }, { status: 401 });
    }

    // Buscar a licença no banco
    const licenca = await prisma.licenca.findUnique({
      where: { chaveAcesso }
    });

    if (!licenca) {
      return NextResponse.json({ error: 'Chave de acesso inválida.' }, { status: 401 });
    }

    if (!licenca.ativo) {
      return NextResponse.json({ error: 'Licença inativa ou bloqueada.' }, { status: 401 });
    }

    if (new Date() > new Date(licenca.dataDeExpiracao)) {
      return NextResponse.json({ error: 'Licença expirada.' }, { status: 401 });
    }

    if (!licenca.apolloLogin || !licenca.apolloSenha) {
      return NextResponse.json({ error: 'Nenhum login Apollo configurado para esta empresa no painel Admin.' }, { status: 400 });
    }

    // Gerar token fresquinho usando as credenciais do banco
    const tokenFresco = await getApolloToken(licenca.apolloLogin, licenca.apolloSenha);

    // Buscar dados do Apollo usando o token real da empresa gerado na hora
    const apTickets = await fetchApolloTickets(todayStr, tokenFresco);
    const apCounts = calcApolloCountsFromTickets(apTickets);

    // Timeline de 15 em 15 minutos (Apollo) - Identificação de picos
    function buildApolloTimeline() {
      const timeline: Array<{ hora: string; abertos: number; finalizados: number }> = [];

      const now = new Date();
      // Ajustar para fuso horário de Brasília (UTC-3)
      const brasiliaOffset = -3 * 60;
      const localTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
      
      const isToday = todayStr === getTodayStr();
      const currentHour = localTime.getHours();
      const currentMinute = localTime.getMinutes();

      for (let h = 7; h <= 20; h++) {
        for (let m = 0; m <= 45; m += 15) {
          // Parar exatamente às 20:00
          if (h === 20 && m > 0) break;

          const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          
          let openedInSlot = 0;
          let finishedInSlot = 0;

          for (const t of apTickets) {
            // Horário de abertura
            const createdDate = new Date(t.DATAHORA);
            const cHour = (createdDate.getUTCHours() - 3 + 24) % 24;
            const cMin = createdDate.getUTCMinutes();
            
            if (cHour === h && cMin >= m && cMin < m + 15) {
              openedInSlot++;
            }

            // Horário de fechamento
            if (t.DATAHORA_FINALIZADO) {
              const finishedDate = new Date(t.DATAHORA_FINALIZADO);
              const fHour = (finishedDate.getUTCHours() - 3 + 24) % 24;
              const fMin = finishedDate.getUTCMinutes();
              if (fHour === h && fMin >= m && fMin < m + 15) {
                finishedInSlot++;
              }
            }
          }

          const isFuture = isToday && (h > currentHour || (h === currentHour && m > currentMinute));

          timeline.push({ 
            hora: horaStr, 
            abertos: isFuture ? 0 : openedInSlot, 
            finalizados: isFuture ? 0 : finishedInSlot
          });
        }
      }
      return timeline;
    }

    // Recentes do Apollo
    const recentesApollo = apTickets.slice(0, 30).map(t => ({
      id: String(t.CODCHAMADO),
      protocolo: t.ID_WHATSAPP || t.CODCHAMADO,
      status: t.STATUS === 'ANDAMENTO' ? 'Andamento' : t.STATUS === 'FINALIZADO' ? 'Finalizado' : t.STATUS,
      criadoEm: t.DATAHORA,
      finalizadoEm: t.DATAHORA_FINALIZADO,
      cliente: t.parceiro?.FANTASIA || 'N/A',
      sistema: 'APOLLO',
      tecnico: t.tecnico?.NOME || 'N/A',
    }));

    // Calcular atendentes e tempos médios
    const atendentesMap: Record<string, { andamento: number; finalizado: number; tempoTotal: number; countFinalizados: number }> = {};
    let totalTempoFinalizado = 0;
    let totalCountFinalizados = 0;

    for (const t of apTickets) {
      const nome = t.tecnico?.NOME || 'Sem técnico';
      if (!atendentesMap[nome]) {
        atendentesMap[nome] = { andamento: 0, finalizado: 0, tempoTotal: 0, countFinalizados: 0 };
      }

      if (t.STATUS === 'ANDAMENTO') {
        atendentesMap[nome].andamento++;
      } else if (t.STATUS === 'FINALIZADO') {
        atendentesMap[nome].finalizado++;
        
        if (t.DATAHORA && t.DATAHORA_FINALIZADO) {
          const inicio = new Date(t.DATAHORA).getTime();
          const fim = new Date(t.DATAHORA_FINALIZADO).getTime();
          const duracaoMin = Math.max(0, Math.floor((fim - inicio) / 60000));
          
          atendentesMap[nome].tempoTotal += duracaoMin;
          atendentesMap[nome].countFinalizados++;
          totalTempoFinalizado += duracaoMin;
          totalCountFinalizados++;
        }
      }
    }

    const apAtendentes = Object.entries(atendentesMap).map(([nome, stats]) => ({
      nome,
      andamento: stats.andamento,
      finalizado: stats.finalizado,
      total: stats.andamento + stats.finalizado,
      tempoMedio: stats.countFinalizados > 0 ? Math.round(stats.tempoTotal / stats.countFinalizados) : 0,
    })).sort((a, b) => b.total - a.total);

    const tempoMedioGeral = totalCountFinalizados > 0 ? Math.round(totalTempoFinalizado / totalCountFinalizados) : 0;

    const response = NextResponse.json({
      apollo: {
        andamento: apCounts.andamento,
        finalizado: apCounts.finalizado,
        totalDia: apCounts.total,
        tempoMedioGeral,
        atendentes: apAtendentes,
        timeline: buildApolloTimeline(),
        recentes: recentesApollo,
      },
      dataConsulta: todayStr,
      atualizadoEm: new Date().toISOString(),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do dashboard', details: error?.message || '' },
      { status: 500 }
    );
  }
}
