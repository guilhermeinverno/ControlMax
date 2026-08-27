# Decisões Fase 2 — Contexto e hierarquia (CTX)

Data: 27/08/2026

## CTX-01 — Seletor global
- `GlobalContext` persiste `selectedCnId` / `selectedUnitId` em `sessionStorage`.
- UI: `GlobalContextSelector` no header (desktop) e barra sob o header (mobile).
- `UnitSelectors` filtra por `usuario_unidades` quando a lista não está vazia.
- Dashboard consome o contexto global.

## CTX-02 — `usuario_unidades`
- **Fonte de verdade:** `users.usuario_unidades` (aliases de leitura: `usuarioUnidades`, `assignedUnits`).
- **Não migrar** para `assignedUnits` no piloto.
- BFF: `POST /api/boxes/open` valida unidade atribuída; gestores sem lista mantêm acesso amplo.
- Confirmação de caixa já validava a lista; permanece.

## CTX-03 — Sociedade
- **Piloto single-tenant organizacional:** Sociedade ≡ `tenantId`.
- Menu “Sociedades” desabilitado (label: piloto via tenant).
- CRUD multi-sociedade / coleção `societies` → pós-piloto (P1+).
