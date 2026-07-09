# AGENTS.md — Guia para agentes (vibe coding) no ControlMax

Leia este arquivo **antes** de realizar qualquer tarefa no repositório. Ele serve para orientar o desenvolvimento de forma padronizada, evitando que você reinvente a roda ou cometa erros de arquitetura no **ControlMax**. Se houver divergências com o código ativo, confie no código e **atualize este arquivo**.

> Idiomas principais do projeto: **português brasileiro** (PT-BR) e **espanhol** (ES), tanto na interface quanto nas interações com a IA. Mantenha as mensagens de commit e documentação em português.

---

## 1. TL;DR — O que é e como rodar

**ControlMax** é um painel SaaS de controle financeiro, gestão de rotas, cobradores (collectors), caixas (boxes), recebimentos e vendas voltado para empresas e equipes de cobrança locais. Ele opera em uma arquitetura de isolamento multi-tenant (multi-inquilino) e integra um assistente de voz IA avançado (alimentado pelo Gemini AI) para consulta de dados em tempo real.

O projeto é estruturado com uma separação clara entre as responsabilidades do sistema:

```bash
# --- BACKEND (Node.js/Express + Gemini SDK) ---
cd backend
npm install                                # Instala dependências do backend
# Configure o arquivo .env com a GEMINI_API_KEY e credenciais do Firebase
npm run dev                                # Inicia o servidor Express local na porta 3000 (tsx server.ts)

# --- FRONTEND (React 19 + Vite 6 + Tailwind CSS v4) ---
cd frontend
npm install                                # Instala dependências do frontend
npm run dev                                # Inicia o Vite local (normalmente na porta 5173 ou 3000 em produção)
```

---

## 2. Melhores Práticas de Organização de Desenvolvimento

Para garantir a escalabilidade do ControlMax, seguimos princípios rígidos de arquitetura e organização:

### 2.1 Separação por Pastas (Frontend / Backend / Documentação)
O monorepo divide as responsabilidades do sistema nas seguintes pastas principais:
- **`backend/`**: Servidor Express que gerencia as integrações de IA e orquestra operações pesadas ou integrações de terceiros.
- **`frontend/`**: Toda a interface visual web (React 19 + Vite 6) e regras de navegação do usuário.
- **`documentation/`**: Todos os manuais técnicos, configurações de banco de dados, guias de qualidade e planos de homologação (ex.: [QA_DOCUMENTATION.md](file:///Users/fabio/Documents/Controlmax/QA_DOCUMENTATION.md) e [INDEXES.md](file:///Users/fabio/Documents/Controlmax/INDEXES.md)).

### 2.2 Precisão Financeira Estrita (Manejo de Centavos)
Para evitar as imprecisões de arredondamento inerentes a números de ponto flutuante em JavaScript (IEEE 754), **todos os valores monetários no ControlMax devem ser manipulados e armazenados como números inteiros (centavos)**.
- **Regra geral**: R$ 1,00 ou U$ 1,00 é representado como `100` centavos no banco de dados.
- **Operações matemáticas**: Somas, subtrações e multiplicações de taxas são feitas em inteiros.
- **Exibição**: A conversão para float e formatação de moeda deve ocorrer exclusivamente na renderização da interface visual utilizando funções utilitárias como `fmt(cents)`.

### 2.3 Isolamento Multi-Tenant (Segurança de Dados)
O ControlMax funciona com base em empresas e filiais parceiras. Cada empresa tem seu próprio identificador único chamado `tenantId`.
- **Filtro obrigatório**: Qualquer operação de leitura ou escrita no banco de dados deve incluir explicitamente a cláusula `where('tenantId', '==', tenantId)`.
- **Regras de segurança**: O arquivo `firestore.rules` deve validar e reforçar esse isolamento no servidor do Firestore, impedindo que um usuário leia ou escreva dados de outros tenants.

---

## 3. Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React **19**, Vite **6**, TypeScript, **Tailwind CSS v4** (via `@tailwindcss/vite`), React Router Dom **7**, Lucide React, Motion (animações), Leaflet / React Leaflet (visualização de mapas e rotas) |
| **Backend** | Node.js, Express, TypeScript, `tsx` (runtime de desenvolvimento), `esbuild` (bundler de produção), SDK do Gemini (`@google/genai` v2.x) |
| **Banco de Dados** | **Firebase Cloud Firestore** (Banco de dados NoSQL reativo em tempo real) |
| **Autenticação** | **Firebase Auth** (Gerenciamento de credenciais e sessões de usuários) |

---

## 4. Estrutura de Diretórios Planejada

```
/                         Raiz do Monorepo
├── backend/              Backend Node.js/Express
│   ├── server.ts         Entrypoint do servidor e API do Assistente Gemini
│   ├── package.json      Dependências e scripts do backend
│   └── tsconfig.json     Configuração de compilador TypeScript backend
├── frontend/             Frontend React/Vite
│   ├── index.html        Entrypoint do app e definição de containers de renderização
│   ├── vite.config.ts    Configuração do Vite 6 e plugins (Tailwind CSS v4)
│   ├── package.json      Dependências e scripts do frontend
│   └── src/              Código-fonte do frontend
│       ├── App.tsx       Componente raiz e roteamento (ErrorBoundary e AppRoutes)
│       ├── main.tsx      Montagem do React no DOM
│       ├── index.css     Estilos gerais
│       ├── context/      Contextos globais (NavigationContext)
│       ├── hooks/        React Hooks customizados (useTenant, useBox, etc.)
│       ├── lib/          Clientes de bibliotecas externas (firebase.ts)
│       ├── routes/       Configurações de rotas privadas/públicas (AppRoutes.tsx)
│       ├── screens/      Telas completas do sistema (Dashboard, Login, RouteList, etc.)
│       ├── types.ts      Tipos e interfaces globais da aplicação (Box, User, etc.)
│       └── utils/        Funções utilitárias (formatação monetária, masks)
└── documentation/        Manuais e guias do projeto
    ├── QA_DOCUMENTATION.md   Manual de arquitetura técnica e planos de QA
    └── INDEXES.md            Guia de configuração de índices do Cloud Firestore
```

---

## 5. Comandos de Verificação

Execute estes comandos antes de commitar ou abrir um Pull Request para garantir a estabilidade técnica:

```bash
# Verificar tipos de dados no Frontend
cd frontend
npm run lint                 # Executa o tsc --noEmit

# Validar compilação do Frontend
npm run build

# Validar compilação do Backend
cd backend
npm run build
```

---

## 6. Firebase & Cloud Firestore — Fatos Essenciais

- **Tipos de Usuários (Roles)**: O sistema possui papéis como `collector` (cobradores que gerenciam caixas e rotas locais), `admin` (supervisor técnico do tenant) e `superadmin` (administrador do ecossistema SaaS).
- **Estrutura das Coleções**:
  - `/users`: Documentos do perfil do usuário contendo `tenantId`, `role` (collector/admin/superadmin), `active` (boolean) e dados cadastrais.
  - `/boxes`: Controles de caixas abertos, fechados ou confirmados de cada cobrador. Contém montantes monetários em centavos (`initialAmount`, `totalSales`, `totalCollections`, `finalAmount`, etc.).
  - `/routes`: Rotas de cobrança atribuídas a cobradores específicos.
  - `/sales`: Registro de vendas realizadas.
  - `/collections`: Registros de recebimentos/cobranças em dinheiro das rotas.
  - `/transfers`: Movimentações de dinheiro entre caixas.
- **Configuração de Índices**: Consultas compostas exigem índices definidos em `firestore.indexes.json` e configurados no console do Firebase (conforme detalhado no [INDEXES.md](file:///Users/fabio/Documents/Controlmax/INDEXES.md)).

---

## 7. Assistente de Voz IA (Gemini SDK)

O ControlMax possui um recurso de assistência por voz baseado no Gemini AI que permite que os administradores e supervisores consultem dados da operação de forma fluida.

- **Endpoint**: `POST /api/gemini/assistant`
- **Funcionamento**:
  - Aceita inputs textuais (`message`) ou arquivos de áudio em formato Base64 (`audio`).
  - O backend captura os dados da operação do dia no Firestore (cobradores ativos, caixas abertos, rotas cadastradas, faturamento e recebimentos em centavos) e gera uma instrução de sistema estruturada ("system instruction").
  - Essa instrução alimenta a API do Gemini com o **Contexto em Tempo Real do Sistema**, garantindo que as respostas da IA sejam fidedignas e não inventadas (alucinações).
  - O assistente responde no idioma correto (PT-BR ou ES) com respostas curtas e fluidas apropriadas para síntese de voz (máximo de 3 frases, sem caracteres especiais ou listas longas).

---

## 8. Frontend — Arquitetura de UI e Tema

- **Tailwind CSS v4**: Utilizado nativamente via `@tailwindcss/vite`. Não adicione arquivos redundantes de pipeline de CSS. Toda a configuração de cores e fontes é feita diretamente na folha de estilos principal e nas declarações do Tailwind.
- **Componentes Utilitários e Máscaras**: Entrada de dados monetários ou documentos devem sempre aplicar máscaras adequadas definidas nos utilitários da pasta `src/utils/` para evitar dados corrompidos.
- **Integração de Mapas**: Utiliza Leaflet / React Leaflet para exibir caminhos e localizações de cobradores e centrais de negócios. Garanta a correta importação de estilos de Leaflet para evitar quebras visuais em produção.

---

## 9. Convenções e Armadilhas Gerais

- **Evite o tipo `any`**: Mantenha as interfaces definidas em `src/types.ts` atualizadas e utilize-as tanto no frontend quanto no backend.
- **Regras do Firestore**: Sempre que alterar o comportamento de queries de banco, revise se as `firestore.rules` ou os índices do `firestore.indexes.json` precisam ser atualizados.
- **Manipulação de Data/Hora**: Prefira objetos de data padronizados do Firestore (`Timestamp`) para facilitar a filtragem temporal.

---

## 10. Fluxo Recomendado para uma Tarefa

1. **Investigação inicial**: Localize as views, hooks ou endpoints correspondentes usando busca por grep antes de criar novos arquivos.
2. **Separação de pastas**: Coloque o código de backend na pasta `backend/` e o de frontend em `frontend/`. Qualquer mudança de regras ou documentação geral deve ir para `documentation/`.
3. **Manejo monetário**: Certifique-se de que os valores tratados estão em centavos antes de persistir no Firestore.
4. **Verificação de tipos**: Execute `npm run lint` na pasta apropriada para validar a ausência de erros em tempo de compilação.
5. **Teste local**: Valide a mudança nos modos claro/escuro e certifique-se de que ela não afeta a segurança multi-tenant.

---

## 11. Regras Gerais — Boas Práticas de Programação

- **Diff Mínimo**: Resolva apenas o que foi solicitado. Evite refatorar códigos adjacentes funcionais de forma desnecessária.
- **Segurança de chaves**: Nunca commite segredos, chaves de API ou arquivos `.env` com dados confidenciais.
- **Comentários de código**: Comente apenas o que não for autoexplicativo (lógicas financeiras complexas, truques de estilização de mapas, regras de voz Gemini).
- **Git**: Se estiver trabalhando diretamente no repositório de desenvolvimento, prefira criar branches organizados antes de mesclar mudanças críticas na branch principal (`main`).