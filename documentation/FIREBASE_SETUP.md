# Configuração do Firebase para o ControlMax (gringoeletronica@gmail.com)

Este guia orienta passo a passo como obter as chaves do Firebase Console e configurá-las no ambiente local ou de produção (Vercel) para a conta `gringoeletronica@gmail.com`.

---

## Passo 1: Acessar o Console do Firebase

1. Abra o navegador e acesse o [Firebase Console](https://console.firebase.google.com/).
2. Faça login usando a conta Google `gringoeletronica@gmail.com`.

---

## Passo 2: Criar ou Selecionar um Projeto

1. Clique em **"Adicionar projeto"** (ou escolha um existente).
2. Dê um nome ao seu projeto (por exemplo, `ControlMax`).
3. (Opcional) Escolha se deseja habilitar o Google Analytics para o projeto e clique em **"Continuar"** até que o projeto seja criado.

---

## Passo 3: Ativar o Cloud Firestore

1. No menu lateral esquerdo do Console, clique em **Compilação** (Build) e depois em **Firestore Database**.
2. Clique no botão **"Criar banco de dados"**.
3. Escolha uma localização geográfica para o seu banco de dados (ex: `us-east1` ou `southamerica-east1` para o Brasil) e avance.
4. Selecione a opção **"Iniciar no modo de teste"** para fins iniciais (depois você poderá publicar suas regras do `firestore.rules` usando as ferramentas de deploy). Clique em **Ativar**.

---

## Passo 4: Ativar o Firebase Authentication

1. No menu lateral esquerdo, clique em **Compilação** (Build) e depois em **Authentication**.
2. Clique em **"Começar"** (Get Started).
3. Na aba **Método de login** (Sign-in method), selecione **E-mail/senha** (Email/Password), ative a primeira chave de habilitação e clique em **Salvar**.
4. Se desejar, ative também o provedor do **Google** para permitir o login facilitado.

---

## Passo 5: Registrar um Aplicativo Web para Obter as Chaves

1. Vá para a página inicial do painel do seu projeto (clique em **Visão geral do projeto** no topo do menu lateral).
2. No centro da tela de boas-vindas, clique no ícone de **Web (`</>`)** para adicionar um aplicativo ao seu projeto.
3. Insira o apelido do aplicativo (ex: `ControlMax Web App`).
4. Clique em **Registrar app**.
5. O Firebase exibirá um bloco de código contendo o objeto de configuração do Firebase (`firebaseConfig`). Copie os seguintes valores correspondentes:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

---

## Passo 6: Configurar as Variáveis de Ambiente (`.env` ou Vercel)

Com os dados copiados do passo anterior, você precisa adicioná-los às variáveis de ambiente da aplicação.

### Desenvolvimento Local
Crie ou edite o arquivo `/frontend/.env` (ou o arquivo `.env` na raiz do frontend) e insira as seguintes linhas correspondentes às suas chaves:

```env
VITE_FIREBASE_API_KEY=SUA_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=SEU_APP_ID
```

### Produção na Vercel
1. Acesse o painel da sua conta na [Vercel](https://vercel.com/) vinculada à conta do GitHub de `gringoeletronica@gmail.com`.
2. Selecione o projeto do **ControlMax**.
3. Vá em **Settings** (Configurações) ➔ **Environment Variables** (Variáveis de Ambiente).
4. Adicione cada uma das chaves listadas acima com os respectivos valores (`VITE_FIREBASE_API_KEY`, etc.).
5. Execute um novo deploy (Redeploy) na Vercel para que as alterações entrem em vigor.
