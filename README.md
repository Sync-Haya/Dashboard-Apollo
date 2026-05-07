# Apollo Dashboard — Monitoramento de Chamados (NOC)

Este é um dashboard premium desenvolvido para o monitoramento em tempo real de chamados técnicos integrados à API do **Apollo WhatsApp**. O projeto foi otimizado para exibição em centrais de monitoramento (TVs/NOC) e oferece métricas avançadas de produtividade, SLA e agora conta com uma arquitetura **Multi-Tenant (SaaS)** para gestão de clientes.

![Dashboard Preview](public/og-image.png)

## 🚀 Funcionalidades Principais

- **Visualização em Tempo Real**: Atualização automática dos dados.
- **Otimização para TV (NOC)**: Layout responsivo adaptado para telas grandes com gráficos em largura total.
- **Modo de Apresentação Segura**: O projeto inicia com dados fictícios para demonstrações.
- **Gestão de Licenças e Múltiplos Clientes (Novo)**: 
  - Banco de dados em nuvem (Vercel Postgres via Prisma).
  - Painel Administrativo protegido com tela de CRUD para gerenciar clientes.
  - Geração de Chaves de Acesso (Ex: `LIC_XYZ`) exclusivas para cada cliente.
- **Autenticação Automática e Sem Cache (Novo)**: 
  - O cliente acessa apenas usando sua Chave de Acesso.
  - O Back-end resgata o Login e Senha reais do Apollo salvos em banco e gera o JWT Token em tempo real, resolvendo problemas de expiração de 24h.
  - Alertas dinâmicos de vencimento (pop-ups interativos) e bloqueios automáticos com avisos amigáveis para clientes inadimplentes.
- **Gestão de SLA e Produtividade**:
  - Contadores de minutos decorridos e gráficos de fluxo (abertos vs finalizados).

## 🛠 Tecnologias Utilizadas

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Estilização**: Tailwind CSS (Tema Dark Premium / Glassmorphism)
- **Gráficos e UI**: Recharts, Radix UI, Lucide React

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+ 
- NPM ou Yarn
- URL de um banco de dados PostgreSQL (ex: Vercel Postgres)

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/Sync-Haya/Dashboard-Apollo.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto contendo apenas:
   ```env
   DATABASE_URL="sua_url_do_postgres_aqui"
   ```
4. Sincronize o banco de dados:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### Execução
```bash
npm run dev
```
- **Dashboard Cliente**: `http://localhost:3000`
- **Painel Admin**: `http://localhost:3000/licenca` (Senha padrão de desenvolvimento: `123456`)

## 🔒 Segurança e Arquitetura

- **Dados Sensíveis Ocultos**: Nenhuma credencial (login, senha ou tokens JWT do Apollo) fica exposta no código-fonte, cache ou no navegador do cliente. As credenciais ficam salvas em segurança no Banco de Dados.
- **Tokens Descartáveis**: Para maior segurança, o servidor consulta o Apollo e gera um JWT dinâmico no momento do fetch, descartando-o logo em seguida, inviabilizando roubo de sessão.

---
Desenvolvido por **Antigravity AI** para **Apollo Suporte**.
