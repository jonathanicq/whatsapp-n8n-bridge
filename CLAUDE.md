# CLAUDE.md — lightWaha (WhatsApp REST API Bridge v2)

Serviço Node 20 + TypeScript, leve, que expõe WhatsApp como REST API (Baileys por baixo — ver POC.md/PROJECT_CONFIG.md). **v2.0.0, Phases 1–2 completas, production-ready.** Sucessor do whatsapp-n8n-bridge v1 (que vive na branch `master` deste MESMO repo GitHub; o lightWaha vive na branch `main`).

## Layout

- `src/server.ts` (~21KB) — quase todo o serviço: Express, sessão WhatsApp, endpoints.
- `src/messageQueue.ts` — fila de mensagens.
- `tests/unit` + `tests/integration` (jest); contrato API em `swagger.yaml`.

## Comandos

```bash
npm run dev        # ts-node
npm test           # jest
npm run build && npm start
docker compose up -d
```

## Regras & gotchas

- ⚠️ **Repo partilhado**: `origin` = jonathanicq/whatsapp-n8n-bridge. `main` = lightWaha (v2); `master` = bridge v1 legacy. Nunca fazer merge entre elas; push sempre com branch explícita (`git push origin main`).
- Extração de número do remetente (JID→phone) foi fonte de vários bugs — ver commits 306f32e/4168b71 antes de mexer nessa lógica.
- `package-lock.json` é obrigatório no repo (builds Docker determinísticos — 453fac2).
- Deploy: DEPLOY.md + deploy.sh (host interno 192.168.0.116); só a pedido.
