/**
 * Módulo de integração com APIs externas
 * Dropdesk (GraphQL via Firebase Auth) e Apollo (REST API)
 */

// ============ DROPDESK ============

const DROPDESK_GQL_URL = 'https://gql-prod.dropdesk.app.br/v1/graphql';
const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

// Status UUIDs do Dropdesk (mapeados do sistema real)
export const DROPDESK_STATUS = {
  ABERTO: '76017dc3-0550-4ec8-8fe7-1594d7692c90',
  ATENDENDO: '6690e82a-e684-4476-94e9-cbf341ac0905',
  // Todos os tipos de "fechado"
  FECHADO: 'f2afe499-252b-4d85-8f83-70bd9ba000e1',
  AGUARDANDO_AVALIACAO: '5c32736e-6e50-4bb6-8ce7-337f72e6d832',
  FECHADO_CLIENTE: '39950d83-5041-4152-9753-ff266eb623d5',
  FECHADO_ASSISTENTE_VIRTUAL: '60db8eeb-67c8-4b67-bab8-e616f02ce704',
  FECHADO_ASSISTENTE_INATIVIDADE: '1b79b716-f491-4754-b2e6-f3ca1a44a5f5',
  CANCELADO: '28fa40f5-317a-4694-a536-2f602cdd5161',
} as const;

// IDs de todos os status que representam "fechado/resolvido"
const ALL_CLOSED_STATUSES = [
  DROPDESK_STATUS.FECHADO,
  DROPDESK_STATUS.AGUARDANDO_AVALIACAO,
  DROPDESK_STATUS.FECHADO_CLIENTE,
  DROPDESK_STATUS.FECHADO_ASSISTENTE_VIRTUAL,
  DROPDESK_STATUS.FECHADO_ASSISTENTE_INATIVIDADE,
];

// Setor Suporte do Dropdesk
const DROPDESK_SETOR_SUPORTE = 'cc24b619-c81a-fd30-bb9c-6481f6a6c195';

let cachedFirebaseToken: { token: string; expiresAt: number } | null = null;

export async function getFirebaseToken(): Promise<string> {
  // Reutilizar token se ainda for válido (com margem de 5 min)
  if (cachedFirebaseToken && cachedFirebaseToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedFirebaseToken.token;
  }

  const apiKey = process.env.DROPDESK_FIREBASE_KEY;
  const email = process.env.DROPDESK_EMAIL;
  const password = process.env.DROPDESK_PASSWORD;

  if (!apiKey || !email || !password) {
    throw new Error('Credenciais Dropdesk não configuradas');
  }

  const resp = await fetch(`${FIREBASE_AUTH_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    cache: 'no-store',
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Firebase auth falhou: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();
  cachedFirebaseToken = {
    token: data.idToken,
    expiresAt: Date.now() + (parseInt(data.expiresIn) || 3600) * 1000,
  };

  return data.idToken;
}

async function dropdesGraphQL(query: string, variables?: any): Promise<any> {
  const token = await getFirebaseToken();
  const resp = await fetch(DROPDESK_GQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const result = await resp.json();
  if (result.errors) {
    console.error('Dropdesk GraphQL errors:', result.errors);
    throw new Error(`GraphQL error: ${result.errors[0]?.message}`);
  }
  return result.data;
}

export interface DropdeskTicket {
  id: string;
  number: number;
  status: string;
  statusName: string;
  createdAt: string;
  dateClosed: string | null;
  origin: string;
  sectorName: string;
  users: Record<string, boolean>;
}

export interface DropdeskCounts {
  abertos: number;
  atendendo: number;
  fechados: number;
  totalDia: number;
}

export async function fetchDropdeskCounts(todayISO: string): Promise<DropdeskCounts> {
  const sf = `sector: {name: {_eq: "Suporte"}}`;
  
  // Abertos: em espera agora (sem filtro de data)
  // Atendendo: sendo atendidos agora (sem filtro de data)
  // Fechados: TODOS os tipos de fechamento com dateClosed hoje
  // Total: todos criados hoje (como no relatorio)
  const query = `{
    abertos: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.ABERTO}"},
      ${sf}
    }) { aggregate { count } }
    
    atendendo: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.ATENDENDO}"},
      ${sf}
    }) { aggregate { count } }
    
    fechados_atendente: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.FECHADO}"},
      dateClosed: {_gte: "${todayISO}"},
      ${sf}
    }) { aggregate { count } }
    
    fechados_aguardando: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.AGUARDANDO_AVALIACAO}"},
      ${sf}
    }) { aggregate { count } }
    
    fechados_cliente: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.FECHADO_CLIENTE}"},
      dateClosed: {_gte: "${todayISO}"},
      ${sf}
    }) { aggregate { count } }
    
    fechados_bot: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.FECHADO_ASSISTENTE_VIRTUAL}"},
      dateClosed: {_gte: "${todayISO}"},
      ${sf}
    }) { aggregate { count } }
    
    fechados_inatividade: tickets_aggregate(where: {
      status: {_eq: "${DROPDESK_STATUS.FECHADO_ASSISTENTE_INATIVIDADE}"},
      dateClosed: {_gte: "${todayISO}"},
      ${sf}
    }) { aggregate { count } }
    
    total_criados_hoje: tickets_aggregate(where: {
      createdAt: {_gte: "${todayISO}"},
      ${sf}
    }) { aggregate { count } }
  }`;

  const data = await dropdesGraphQL(query);
  const abertos = data.abertos?.aggregate?.count || 0;
  const atendendo = data.atendendo?.aggregate?.count || 0;
  const fechados = (data.fechados_atendente?.aggregate?.count || 0)
    + (data.fechados_aguardando?.aggregate?.count || 0)
    + (data.fechados_cliente?.aggregate?.count || 0)
    + (data.fechados_bot?.aggregate?.count || 0)
    + (data.fechados_inatividade?.aggregate?.count || 0);
  const totalDia = data.total_criados_hoje?.aggregate?.count || 0;

  return {
    abertos,
    atendendo,
    fechados,
    totalDia,
  };
}

export async function fetchDropdeskTickets(todayISO: string): Promise<DropdeskTicket[]> {
  const tomorrowISO = new Date(new Date(todayISO).getTime() + 86400000).toISOString().split('T')[0] + 'T00:00:00Z';
  
  const query = `{
    tickets(where: {
      _and: [
        {_or: [
          {createdAt: {_gte: \"${todayISO}\"}},
          {dateClosed: {_gte: \"${todayISO}\"}},
          {status: {_eq: \"${DROPDESK_STATUS.ATENDENDO}\"}}
        ]},
        {sector: {name: {_eq: \"Suporte\"}}}
      ]
    }, order_by: {createdAt: desc}, limit: 200) {
      id
      number
      status
      statusObject { description }
      createdAt
      dateClosed
      origin
      users
      sector { name }
    }
  }`;

  const data = await dropdesGraphQL(query);
  return (data.tickets || []).map((t: any) => ({
    id: t.id,
    number: Math.floor(t.number),
    status: t.status,
    statusName: t.statusObject?.description || 'Desconhecido',
    createdAt: t.createdAt,
    dateClosed: t.dateClosed,
    origin: t.origin,
    sectorName: t.sector?.name || 'N/A',
    users: t.users || {},
  }));
}

export async function fetchDropdeskAttendants(): Promise<Array<{ id: string; name: string; role: string }>> {
  // Buscar usuarios que sao atendentes (role = attendant)
  const query = `{
    __type(name: \"users\") { fields { name } }
  }`;
  // Cant directly query users, so we use a workaround
  // We know the attendant names from the user's context
  return [
    { id: '1', name: 'Samara Ordones', role: 'attendant' },
    { id: '2', name: 'Melissa Rodrigues', role: 'attendant' },
    { id: '3', name: 'Luhan Henrique', role: 'attendant' },
    { id: '4', name: 'Amanda Portilho', role: 'attendant' },
    { id: '5', name: 'Leonardo', role: 'attendant' },
    { id: '6', name: 'Phellype', role: 'attendant' },
  ];
}

// ============ APOLLO ============

const APOLLO_API_URL = 'http://apollosg.ddns.com.br:9304';

let cachedApolloToken: { token: string; expiresAt: number } | null = null;

export async function getApolloToken(): Promise<string> {
  // Priorizar token fixo fornecido pelo usuário via .env
  const fixedToken = process.env.APOLLO_JWT_TOKEN;
  if (fixedToken) {
    return fixedToken;
  }

  if (cachedApolloToken && cachedApolloToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedApolloToken.token;
  }

  const login = process.env.APOLLO_LOGIN;
  const senha = process.env.APOLLO_PASSWORD;

  if (!login || !senha) {
    throw new Error('Credenciais Apollo nao configuradas');
  }

  const resp = await fetch(`${APOLLO_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, senha }),
    cache: 'no-store',
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Apollo login falhou: ${err.error || resp.statusText}`);
  }

  const data = await resp.json();
  cachedApolloToken = {
    token: data.token,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
  };

  return data.token;
}

export interface ApolloTicket {
  CODCHAMADO: number;
  STATUS: string;
  DATAHORA: string;
  DATAHORA_FINALIZADO: string | null;
  tecnico: { NOME: string } | null;
  parceiro: { FANTASIA: string } | null;
  ID_WHATSAPP: number | null;
  ORIGEM: string;
}

export async function fetchApolloTickets(todayStr: string, customToken?: string | null): Promise<ApolloTicket[]> {
  const token = customToken || await getApolloToken();
  const dataIni = `${todayStr} 00:00:00`;
  const dataFim = `${todayStr} 23:59:59`;

  const url = `${APOLLO_API_URL}/api/chamados?limit=200&offset=0&comProtocolo=true&chamadoDev=false&dataIni=${encodeURIComponent(dataIni)}&dataFim=${encodeURIComponent(dataFim)}&sortField=id&sortDir=desc`;

  const resp = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!resp.ok) {
    throw new Error(`Apollo API falhou: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.items || [];
}

export interface ApolloCounts {
  andamento: number;
  finalizado: number;
  total: number;
}

export function calcApolloCountsFromTickets(tickets: ApolloTicket[]): ApolloCounts {
  let andamento = 0;
  let finalizado = 0;
  for (const t of tickets) {
    if (t.STATUS === 'ANDAMENTO') andamento++;
    else if (t.STATUS === 'FINALIZADO') finalizado++;
  }
  return { andamento, finalizado, total: andamento + finalizado };
}

export function calcApolloAttendants(tickets: ApolloTicket[]): Array<{ nome: string; andamento: number; finalizado: number; total: number }> {
  const map: Record<string, { andamento: number; finalizado: number }> = {};
  for (const t of tickets) {
    const nome = t.tecnico?.NOME || 'Sem tecnico';
    if (!map[nome]) map[nome] = { andamento: 0, finalizado: 0 };
    if (t.STATUS === 'ANDAMENTO') map[nome].andamento++;
    else if (t.STATUS === 'FINALIZADO') map[nome].finalizado++;
  }
  return Object.entries(map).map(([nome, counts]) => ({
    nome,
    ...counts,
    total: counts.andamento + counts.finalizado,
  })).sort((a, b) => b.total - a.total);
}