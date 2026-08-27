# Especificação Oficial do Sistema ControlMax (Nova Versão)

Índice oficial da documentação técnica e funcional do novo ControlMax.

## Visão e Requisitos
- [01. Visão Geral](01-visao-geral.md)
- [02. Requisitos Funcionais](02-requisitos-funcionais.md)
- [03. Requisitos Não Funcionais](03-requisitos-nao-funcionais.md)
- [04. Módulos Mapeados](04-modulos.md)

## Regras e Fluxos
- [05. Fluxos de Negócio Financeiro](05-fluxos-de-negocio.md)
- [06. Regras de Negócio e Restrições](06-regras-de-negocio.md)

## Segurança e Arquitetura
- [07. Matriz de Usuários e Permissões (RBAC)](07-usuarios-e-permissoes.md)
- [08. Modelo de Dados Base (Firestore)](08-modelo-de-dados.md)
- [09. Arquitetura Proposta](09-arquitetura.md)
- **[ARQUITETURA-SSOT — fonte canônica pós-piloto](../arquitetura/ARQUITETURA-SSOT.md)**
- [10. APIs e Serviços Backend](10-api.md)
- [11. Segurança e Prevenção de Riscos](11-seguranca.md)
- [ADR-001. Custom Claims (AUTH-01)](ADR-001-custom-claims.md)

## UX e Qualidade
- [12. UX e Experiência de Navegação](12-ux-e-navegacao.md)
- [13. Estratégia de Testes](13-testes.md)

## Entrega
- [14. Roadmap e Priorização Funcional](14-roadmap.md)

---

## DECISÕES DE PRODUTO CONFIRMADAS
1. **Contratos da API (P0):** O tráfego financeiro e máquina de estados de caixa serão rigidamente isolados no Backend, usando validações fortes de permissão e `idempotencyKey`. (Ver *10-api.md*).
2. **Modelo Financeiro do Piloto (P0):** Fica estipulado que o piloto atuará apenas com Abatimento de Saldo (Venda - Pagamentos), sem envolver motor complexo de juros. Todas as operações continuam na base centesimal (`Cents`). (Ver *08-modelo-de-dados.md*).
3. **Controle de Edição do Caixa:** Proibido a edição manual arbitrária de saldos (ex: `initialAmount`) de um cobrador por terceiros (Admins/Supervisores). Correções deverão ser executadas através de Egresos/Ingresos auditáveis e justificados. (Ver *07-usuarios-e-permissoes.md*).
4. **Vínculo Usuário x Hierarquia:** Campo canônico no piloto = `usuario_unidades` (aliases `usuarioUnidades` / spec `assignedUnits`). Escopo enforçado no BFF de abertura/confirmação de caixa (CTX-02). (Ver *08-modelo-de-dados.md*).
5. **Sociedade no piloto (CTX-03, 27/08/2026):** `tenantId` **é** a Sociedade. CRUD multi-sociedade e coleção `societies` ficam **fora do piloto**. Menu “Sociedades” desabilitado até P1; gestão da plataforma continua em `platform-management`.

6. **Custom Claims (AUTH-01, 27/08/2026):** Opção A — `setCustomUserClaims({ role, tenantId, isSuperAdmin })` na provisão admin; middleware BFF prioriza claims (Firestore fallback legado). Ver [ADR-001](ADR-001-custom-claims.md).

## DECISÕES PENDENTES
*(Nenhuma decisão P0 pendente para o Gate Piloto além da assinatura do checklist SYNC-01 em dispositivo real).*
