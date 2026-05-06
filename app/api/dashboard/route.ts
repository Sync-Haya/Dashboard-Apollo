export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import {
  fetchDropdeskCounts,
  fetchApolloTickets,
  calcApolloCountsFromTickets,
  calcApolloAttendants,
  fetchDropdeskTickets,
  DROPDESK_STATUS,
} from '@/lib/external-apis';

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

    // Pegar token do header se existir
    const authHeader = request.headers.get('Authorization');
    const customToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Buscar dados do Apollo
    const apTickets = await fetchApolloTickets(todayStr, customToken);
    const apCounts = calcApolloCountsFromTickets(apTickets);

    // Timeline por hora (Apollo) - Lógica de Fluxo (Abertos agora vs Finalizados no dia)
    function buildApolloTimeline() {
      const timeline: Array<{ hora: string; abertos: number; finalizados: number }> = [];
      let cumulativeOpened = 0;
      let cumulativeFinished = 0;

      const now = new Date();
      // Ajustar para fuso horário de Brasília (UTC-3)
      const brasiliaOffset = -3 * 60;
      const localTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
      
      // Se a data da consulta não for hoje, mostramos todas as horas. 
      // Se for hoje, zeramos as horas futuras.
      const isToday = todayStr === getTodayStr();
      const currentHour = localTime.getHours();

      for (let h = 7; h <= 20; h++) {
        const horaStr = `${h.toString().padStart(2, '0')}:00`;
        
        let openedInHour = 0;
        let finishedInHour = 0;

        for (const t of apTickets) {
          const createdDate = new Date(t.DATAHORA);
          const createdHour = (createdDate.getUTCHours() - 3 + 24) % 24;
          
          if (createdHour === h) {
            openedInHour++;
          }

          if (t.DATAHORA_FINALIZADO) {
            const finishedDate = new Date(t.DATAHORA_FINALIZADO);
            const finishedHour = (finishedDate.getUTCHours() - 3 + 24) % 24;
            if (finishedHour === h) {
              finishedInHour++;
            }
          }
        }

        cumulativeOpened += openedInHour;
        cumulativeFinished += finishedInHour;

        const isFuture = isToday && h > currentHour;

        // Abertos Agora = Total que abriu até agora - Total que fechou até agora
        const abertosAgora = isFuture ? 0 : Math.max(0, cumulativeOpened - cumulativeFinished);
        const finalizadosReal = isFuture ? 0 : finishedInHour;

        timeline.push({ 
          hora: horaStr, 
          abertos: abertosAgora, 
          finalizados: finalizadosReal
        });
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
