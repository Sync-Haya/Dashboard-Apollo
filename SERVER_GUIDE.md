# Guia de Gerenciamento do Servidor Local - Chamados Apollo

Este guia explica como gerenciar o servidor local para o projeto Chamados Apollo.

## Scripts Disponíveis

Você pode executar estes comandos no terminal na pasta do projeto:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Cria a versão de produção do projeto |
| `npm run start` | Inicia o servidor com a versão de produção (após o build) |
| `npx prisma generate` | Gera o cliente Prisma (necessário após mudanças no `schema.prisma`) |
| `npx prisma studio` | Abre uma interface visual para gerenciar os dados do banco de dados |

## Como Gerenciar Dados

### 1. Visualizar Banco de Dados
Para ver e editar os dados diretamente (Tickets, Atendentes, etc.), execute:
```powershell
npx prisma studio
```
Isso abrirá uma página no seu navegador (geralmente em `http://localhost:5555`).

### 2. Sincronização de Dados
O projeto possui scripts de seed que podem ser usados para sincronizar ou popular o banco:
```powershell
npx prisma db seed
```

## Estrutura do Projeto

- `/app`: Páginas e APIs do Next.js.
- `/components`: Componentes da interface.
- `/prisma`: Configuração do banco de dados e schema.
- `/scripts`: Scripts de manutenção e sincronização.

---
*Configurado por Antigravity*
