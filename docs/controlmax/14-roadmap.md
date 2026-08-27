# 14. Roadmap de Execução

> Status em 27/08/2026 — ver também `documentation/PLANO-DESENVOLVIMENTO.md`.

## P0: OBRIGATÓRIO (Bloqueadores para Piloto)
O sistema deve iniciar a operação mínima garantindo segurança e fluxo de capital da rua para o cofre.
1. ✅ **Hierarquia Multi-Tenant** — piloto: Sociedade ≡ `tenantId` (CTX-03); CN/Unidade OK. CRUD multi-sociedade adiado.
2. ✅ **Autenticação** sem bypasses (SEC-01/02) + Custom Claims (AUTH-01).
3. ✅ **API NodeJS** caixa Abrir/Fechar/Confirmar (`boxRoutes`).
4. ✅ **Seletor Global de Contexto** no header (CTX-01).
5. ✅ **Vendas e Cobranças** em centavos via BFF + Sync (FIN-02…04).
6. ✅ **Auditoria** `security_logs`/`audit_logs` + UI `AuditLogs` (AUD-01).

**Ainda abertos para Gate Piloto:** deploy rules/indexes ([`DEPLOY-FIRESTORE-GATE.md`](../../documentation/DEPLOY-FIRESTORE-GATE.md)); QA ([`GATE-PILOTO-QA.md`](../../documentation/GATE-PILOTO-QA.md) + [`SYNC-01`](../../documentation/SYNC-01-CHECKLIST-QA.md)).

## P1: IMPORTANTE (Piloto ou Produção Inicial)
Necessário para a expansão operacional sustentável.
1. ✅ **Lista Negra de Clientes** (P1-01).
2. ✅ **Transferências Financeiras** via BFF (P1-02).
3. ✅ **Relatórios** hub + exports XLSX síncronos (P1-05) + fila assíncrona BFF `report_jobs` (P2).
4. ✅ Sincronização/Log básico de **Dispositivos** (`DeviceList`).

## P2: DESEJÁVEL (Pós-Piloto)
Traz eficiência e controles extras.
1. ✅ **Aprovações** de transferências em `BCTransfers` (menus alinhados P1-03).
2. ✅ **Faturamento SaaS** cobrança direta (PIX/boleto/contrato) + faturas manuais; simulador só como projeção.
3. ✅ Abertura/Fechamento **Massivo** via BFF (P1-04).
4. ✅ Formulários Dinâmicos e Feriados.
5. ✅ Fila assíncrona de relatórios (`POST/GET /api/reports/jobs`).

## P3: EVOLUÇÃO (Diferenciais)
Características modernas de diferenciação mercadológica.
1. Interface do **Assistente IA (Voicebot Gemini)** atuando sobre a base de dados blindada.
2. Dashboards de Performance Avançados.
3. Alertas de Pânico geolocalizados do App.

## Limpeza técnica (Fase 5)
1. ✅ CLEAN-01 — `fmtCents` canônico em `currency.ts`.
2. ✅ CLEAN-02 — leitura de saldo via `resolvePendingCents` (cents first).
3. ✅ CLEAN-03 — docs oficiais atualizados.
