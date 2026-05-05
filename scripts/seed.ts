import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ATENDENTES_DROPDESK = ['Ana Silva', 'Carlos Souza', 'Mariana Costa', 'Pedro Santos', 'Julia Oliveira'];
const ATENDENTES_APOLLO = ['Roberto Lima', 'Fernanda Alves', 'Lucas Mendes', 'Patricia Rocha'];
const CLIENTES = ['Empresa ABC', 'Tech Solutions', 'Global Corp', 'StartUp Inovação', 'Comercial Norte', 'Indústria Sul', 'Serviços Premium', 'LogTech', 'DataFlow', 'NetPro'];
const TITULOS = [
  'Sistema não abre', 'Erro ao emitir nota fiscal', 'Lentidão no módulo financeiro',
  'Problema com impressora', 'Não consigo acessar o sistema', 'Erro no relatório',
  'Backup não funcionando', 'Tela travando ao salvar', 'Integração com banco falhou',
  'Problema no cadastro de produtos', 'Erro ao gerar boleto', 'Sistema caiu',
  'Preciso de acesso ao módulo', 'Atualização causou erro', 'Dados não sincronizam',
  'Problema com e-mail automático', 'Erro 500 no servidor', 'Módulo de estoque travou',
  'Não consigo exportar planilha', 'Problema na nota de serviço'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Seeding database...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create chamados for the last 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() - dayOffset);

    const chamadosPerDay = randomInt(15, 35);

    for (let i = 0; i < chamadosPerDay; i++) {
      const sistema = Math.random() > 0.5 ? 'DROPDESK' : 'APOLLO';
      const atendentes = sistema === 'DROPDESK' ? ATENDENTES_DROPDESK : ATENDENTES_APOLLO;
      const hour = randomInt(8, 18);
      const minute = randomInt(0, 59);
      const criadoEm = new Date(baseDate);
      criadoEm.setHours(hour, minute, randomInt(0, 59));

      const statusRoll = Math.random();
      let status: string;
      let fechadoEm: Date | null = null;
      let atendente: string | null = null;
      let tempoResposta: number | null = null;

      if (dayOffset === 0) {
        // Today: more open/atendendo
        if (statusRoll < 0.3) {
          status = 'ABERTO';
        } else if (statusRoll < 0.6) {
          status = 'ATENDENDO';
          atendente = randomItem(atendentes);
          tempoResposta = randomInt(5, 60);
        } else {
          status = 'FECHADO';
          atendente = randomItem(atendentes);
          tempoResposta = randomInt(10, 180);
          fechadoEm = new Date(criadoEm);
          fechadoEm.setMinutes(fechadoEm.getMinutes() + tempoResposta);
        }
      } else {
        // Past days: mostly closed
        if (statusRoll < 0.05) {
          status = 'ABERTO';
        } else if (statusRoll < 0.1) {
          status = 'ATENDENDO';
          atendente = randomItem(atendentes);
          tempoResposta = randomInt(5, 60);
        } else {
          status = 'FECHADO';
          atendente = randomItem(atendentes);
          tempoResposta = randomInt(10, 180);
          fechadoEm = new Date(criadoEm);
          fechadoEm.setMinutes(fechadoEm.getMinutes() + tempoResposta);
        }
      }

      const uniqueId = `seed-${sistema}-d${dayOffset}-${i}`;

      await prisma.chamado.upsert({
        where: { id: uniqueId },
        update: {},
        create: {
          id: uniqueId,
          externalId: `${sistema.substring(0, 3)}-${randomInt(1000, 9999)}`,
          sistema,
          titulo: randomItem(TITULOS),
          descricao: 'Chamado de demonstração para visualização do dashboard.',
          status,
          setor: 'Suporte',
          prioridade: randomItem(['Baixa', 'Normal', 'Alta', 'Urgente']),
          cliente: randomItem(CLIENTES),
          atendente,
          criadoEm,
          fechadoEm,
          tempoResposta,
        },
      });
    }
  }

  // Create snapshots for today (hourly)
  for (let hour = 8; hour <= 18; hour++) {
    for (const sistema of ['DROPDESK', 'APOLLO']) {
      const ts = new Date(today);
      ts.setHours(hour, 0, 0, 0);
      const snapId = `snap-${sistema}-${hour}`;

      await prisma.snapshot.upsert({
        where: { id: snapId },
        update: {},
        create: {
          id: snapId,
          timestamp: ts,
          sistema,
          abertos: randomInt(3, 12),
          atendendo: randomInt(2, 8),
          fechados: randomInt(hour - 8, (hour - 8) * 4 + 5),
          totalDia: randomInt(hour * 2, hour * 3),
        },
      });
    }
  }

  // Create atendentes
  for (const nome of ATENDENTES_DROPDESK) {
    await prisma.atendente.upsert({
      where: { nome },
      update: {},
      create: {
        nome,
        sistema: 'DROPDESK',
        chamadosAbertos: randomInt(1, 5),
        chamadosAtendendo: randomInt(1, 4),
        chamadosFechados: randomInt(8, 25),
        tempoMedioMin: randomInt(15, 90),
      },
    });
  }

  for (const nome of ATENDENTES_APOLLO) {
    await prisma.atendente.upsert({
      where: { nome },
      update: {},
      create: {
        nome,
        sistema: 'APOLLO',
        chamadosAbertos: randomInt(1, 5),
        chamadosAtendendo: randomInt(1, 4),
        chamadosFechados: randomInt(8, 25),
        tempoMedioMin: randomInt(15, 90),
      },
    });
  }

  // Sync logs
  for (let i = 0; i < 5; i++) {
    const logTs = new Date();
    logTs.setMinutes(logTs.getMinutes() - i * 10);
    const logId = `log-${i}`;

    await prisma.syncLog.upsert({
      where: { id: logId },
      update: {},
      create: {
        id: logId,
        timestamp: logTs,
        sistema: i % 2 === 0 ? 'DROPDESK' : 'APOLLO',
        sucesso: true,
        mensagem: 'Sincronização concluída com sucesso.',
        registros: randomInt(5, 20),
      },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
