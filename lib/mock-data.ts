export const mockDashboardData = {
  apollo: {
    andamento: 12,
    finalizado: 45,
    totalDia: 57,
    tempoMedioGeral: 18,
    atendentes: [
      { nome: "Ricardo Oliveira", andamento: 3, finalizado: 15, total: 18, tempoMedio: 12 },
      { nome: "Ana Paula Silva", andamento: 2, finalizado: 12, total: 14, tempoMedio: 22 },
      { nome: "Marcos Vinícius", andamento: 4, finalizado: 10, total: 14, tempoMedio: 15 },
      { nome: "Juliana Santos", andamento: 2, finalizado: 5, total: 7, tempoMedio: 25 },
      { nome: "Leonardo Costa", andamento: 1, finalizado: 3, total: 4, tempoMedio: 30 }
    ],
    timeline: [
      { hora: "07:00", abertos: 2, finalizados: 0 },
      { hora: "08:00", abertos: 5, finalizados: 2 },
      { hora: "09:00", abertos: 8, finalizados: 4 },
      { hora: "10:00", abertos: 12, finalizados: 6 },
      { hora: "11:00", abertos: 15, finalizados: 8 },
      { hora: "12:00", abertos: 10, finalizados: 12 },
      { hora: "13:00", abertos: 14, finalizados: 5 },
      { hora: "14:00", abertos: 18, finalizados: 10 },
      { hora: "15:00", abertos: 22, finalizados: 15 },
      { hora: "16:00", abertos: 15, finalizados: 20 },
      { hora: "17:00", abertos: 10, finalizados: 25 },
      { hora: "18:00", abertos: 5, finalizados: 10 },
      { hora: "19:00", abertos: 3, finalizados: 5 },
      { hora: "20:00", abertos: 1, finalizados: 2 }
    ],
    recentes: [
      { id: "1001", protocolo: "20260501", status: "Andamento", criadoEm: new Date(Date.now() - 15 * 60000).toISOString(), cliente: "Empresa de Transportes Logística", tecnico: "Ricardo Oliveira", sistema: "APOLLO" },
      { id: "1002", protocolo: "20260502", status: "Finalizado", criadoEm: new Date(Date.now() - 120 * 60000).toISOString(), finalizadoEm: new Date(Date.now() - 90 * 60000).toISOString(), cliente: "Supermercados Ideal", tecnico: "Ana Paula Silva", sistema: "APOLLO" },
      { id: "1003", protocolo: "20260503", status: "Andamento", criadoEm: new Date(Date.now() - 45 * 60000).toISOString(), cliente: "Posto de Combustíveis Rápido", tecnico: "Marcos Vinícius", sistema: "APOLLO" },
      { id: "1004", protocolo: "20260504", status: "Andamento", criadoEm: new Date(Date.now() - 5 * 60000).toISOString(), cliente: "Clínica Médica Bem Estar", tecnico: "Ricardo Oliveira", sistema: "APOLLO" },
      { id: "1005", protocolo: "20260505", status: "Finalizado", criadoEm: new Date(Date.now() - 60 * 60000).toISOString(), finalizadoEm: new Date(Date.now() - 40 * 60000).toISOString(), cliente: "Indústria Metalúrgica Forte", tecnico: "Juliana Santos", sistema: "APOLLO" }
    ]
  },
  dataConsulta: new Date().toISOString().split('T')[0],
  atualizadoEm: new Date().toISOString()
};
