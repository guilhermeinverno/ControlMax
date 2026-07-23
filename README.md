<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/33f8fa6b-5557-48dc-aeb6-271cd5c38c6d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Checklist de Variáveis de Ambiente em Produção

Para implantar o **ControlMax** em ambiente de produção (como Cloud Run, Vercel ou VPS), certifique-se de configurar as seguintes variáveis de ambiente obrigatórias:

| Variável | Descrição | Valor Exemplo / Formato |
|---|---|---|
| `GEMINI_API_KEY` | Chave de API do Gemini para alimentar o Assistente de Voz Max. | `AIzaSy...` |
| `FRONTEND_ORIGIN` | URL do frontend que consome o backend (proteção estrita contra CORS). | `https://controlmax.dev` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **(Opção 1)** JSON completo da conta de serviço do Firebase Admin formatado como string. | `{"type": "service_account", ...}` |
| `GOOGLE_APPLICATION_CREDENTIALS` | **(Opção 2)** Caminho absoluto no disco para o arquivo de credenciais JSON da conta de serviço. | `/app/secrets/service-account.json` |

*Nota: Pelo menos uma das credenciais do Firebase Admin SDK (`FIREBASE_SERVICE_ACCOUNT_KEY` ou `GOOGLE_APPLICATION_CREDENTIALS`) deve estar configurada e válida para que o assistente e os caixas funcionem em produção.*
