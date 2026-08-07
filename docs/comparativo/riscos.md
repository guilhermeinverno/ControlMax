# Matriz de Riscos

## Riscos de Migração e Aceitação
1. **Curva de Aprendizado UX (Médio):** A transição de uma aplicação server-rendered (ASP.NET/jQuery) para uma SPA (React) muda paradigmas de navegação. A ausência de um contexto explícito no topo (CN/Unidade) como no TryController pode confundir operadores acostumados ao sistema antigo.
2. **Concorrência Firestore (Alto):** ControlMax atual usa Firestore Client SDK intensivamente. No fluxo financeiro (muitos cobradores atualizando caixas simultaneamente), a falta de transações ou uso de locks pessimistas (comuns em SQL) pode gerar inconsistências.

## Riscos de Segurança Arquitetural
3. **Bypasses Existentes (Crítico):** A base do ControlMax possui validações hardcoded e e-mails de bypass (ex: `gringoeletronica@gmail.com`). Se isso migrar para a especificação final, haverá quebra total do isolamento multi-tenant.
4. **Dependência Exclusiva de Firestore Rules (Alto):** A complexidade da hierarquia `Sociedade → Centro de Negócios → Unidade` é difícil de manter apenas no `firestore.rules`. Requer um middleware robusto no Node.js.

## Riscos de Funcionalidade
5. **Divergência de Cálculo de Saldos (Alto):** O TryController possui um motor financeiro provado. O ControlMax atual lida com centavos manualmente no front e back. Qualquer erro nesta reescrita (margens, juros, saldos parciais) causará desconfiança imediata dos clientes.
6. **Sincronização Offline (Médio):** Cobradores em áreas remotas. TryController tem `Última sincronización`. Firebase faz cache local, mas garantir a consistência das transações offline ao reconectar é um desafio técnico alto.
