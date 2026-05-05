# Guia de Automação - Dashboard de Chamados

## Visão Geral

O sistema de automação usa **Playwright (Python)** para acessar os sites do Dropdesk e Apollo via browser automation, extrair os dados de chamados e enviá-los para a API do dashboard.

## Pré-requisitos

```bash
# Python 3.10+
pip3 install playwright requests

# Instalar browsers do Playwright
PLAYWRIGHT_BROWSERS_PATH=$HOME/.playwright-browsers python3 -m playwright install chromium
```

## Execução Manual

### Extrair de todos os sistemas
```bash
cd <PROJECT_DIR>
python3 scripts/scraper.py --sistema TODOS --api-url http://localhost:3000
```

### Extrair apenas do Dropdesk
```bash
python3 scripts/scraper.py --sistema DROPDESK --api-url http://localhost:3000
```

### Extrair apenas do Apollo
```bash
python3 scripts/scraper.py --sistema APOLLO --api-url http://localhost:3000
```

## Via API (Dashboard)

Você também pode disparar a extração via API:

```bash
curl -X POST http://localhost:3000/api/sync-tickets \
  -H 'Content-Type: application/json' \
  -d '{"sistema": "TODOS"}'
```

Ou pela interface web em **Importar Dados > Extração Automática**.

## Agendamento Automático (Cron Job)

Para executar a cada 10 minutos:

```bash
crontab -e

# Adicionar:
*/10 * * * * cd <PROJECT_DIR> && PLAYWRIGHT_BROWSERS_PATH=$HOME/.playwright-browsers python3 scripts/scraper.py --sistema TODOS --api-url <APP_URL> >> /tmp/scraper_cron.log 2>&1
```

## Estrutura dos Dados

Cada chamado extraído é enviado como JSON:

```json
{
  "externalId": "DROPDESK-12345",
  "sistema": "DROPDESK",
  "titulo": "Título do chamado",
  "descricao": "Descrição extraída",
  "status": "ABERTO",
  "setor": "Suporte",
  "prioridade": "Normal",
  "cliente": "Nome do cliente",
  "atendente": "Nome do atendente"
}
```

## Troubleshooting

### Screenshots de Debug
O script salva screenshots em `/tmp/` durante a execução.

### Problemas Comuns

1. **Login falhou**: Verifique as credenciais no arquivo `scripts/scraper.py`
2. **Timeout**: O site pode estar lento ou offline
3. **Elementos não encontrados**: A estrutura HTML do site pode ter mudado
4. **Playwright não instalado**: Execute `pip3 install playwright && python3 -m playwright install chromium`
