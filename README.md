# ControlMax

Painel SaaS multi-tenant de controle financeiro, rotas, caixas e cobrança — monorepo **frontend** (React 19 + Vite 6) + **backend** (Express + Gemini).

## Documentação

Índice: [`docs/README.md`](docs/README.md)  
Arquitetura canônica: [`docs/arquitetura/ARQUITETURA-SSOT.md`](docs/arquitetura/ARQUITETURA-SSOT.md)  
Guia para agentes: [`AGENTS.md`](AGENTS.md)

## Rodar localmente

```bash
npm install

# Backend (porta 3000) — configure .env a partir de .env.example
npm run dev:backend

# Frontend (Vite)
npm run dev:frontend
```

## Variáveis de ambiente (produção)

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | API Gemini (assistente de voz) |
| `FRONTEND_ORIGIN` | Origin do SPA (CORS) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON da service account (string) **ou** |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho do JSON da service account |
| `VITE_*` | Credenciais Firebase no frontend (ver `.env.example`) |

Pelo menos uma credencial Admin do Firebase é obrigatória para BFF e caixas em produção.
