# CLAUDE.md — whatsapp-n8n-bridge (v1 — legacy)

Bridge WhatsApp→HTTP para n8n: Express + TypeScript + MySQL + Redis + WAHA. **Deployado e a correr** no Docker host 192.168.0.116 (`~/whatsapp-n8n-bridge`), Phase 5 completa.

> ⚠️ **Repo GitHub partilhado**: branch `master` = este projeto (v1); branch `main` = **lightWaha** (v2, sucessor, em `/opt/aiDeveloper/projects/lightWaha`). Nunca fazer merge entre as duas; push sempre explícito: `git push origin master`. Trabalho novo deve ir para o lightWaha.

## Arquitetura

- `src/`: providers (abstração WhatsApp — Baileys abandonado, WAHA ativo), controllers/routes, services (queue com Redis sorted sets + retries exponenciais 1s→30s), models, middleware.
- Schema MySQL: `whatsapp_messages` + `whatsapp_message_attempts` (`init-db.sql`, `migrations/`).
- `n8n-nodes-whatsapp-bridge/` — custom node n8n para consumir esta API.

## Endpoints principais

`GET /health` · `GET /whatsapp/qr|status` · `POST /whatsapp/send|logout` · `POST /queue/send` · `GET /queue/status/:id` · `GET /queue/pending` · `DELETE /queue/:id`

## Comandos

```bash
npm run dev && npm test        # jest; husky + lint-staged ativos
docker compose up -d           # bridge + waha + mysql + redis
# WAHA interno na porta 3001; bridge na 3000; API key no compose
```

## Gotchas

- Bug conhecido em investigação: corrupção do sender (JID→phone) — debug logging no commit 1a9d23d; conversor em `utils/`.
- Baileys foi abandonado por instabilidade — não voltar a ele; provider pattern permite trocar.
- Worker da fila faz polling de 5s — parar com graceful shutdown antes de matar o container.
