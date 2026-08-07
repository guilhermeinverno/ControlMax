# 7. Usuários e Permissões (Matriz RBAC)

Esta matriz define a política de controle de acesso (RBAC) do novo ControlMax.

## Matriz Ação × Role

| Ação | Superadmin | Admin (Tenant) | Supervisor (CN/Rota) | Collector (Cobrador) |
| :--- | :---: | :---: | :---: | :---: |
| **Acesso Global (Todos os Tenants)** | ✅ | ❌ | ❌ | ❌ |
| **Criar/Editar Unidades e Centros** | ✅ | ✅ | ❌ | ❌ |
| **Criar/Editar Usuários/Trabalhadores**| ✅ | ✅ | ❌ | ❌ |
| **Abrir/Fechar Caixa Próprio** | ❌ | ❌ | ❌ | ✅ |
| **Aprovar/Confirmar Caixa** | ✅ | ✅ | ✅ | ❌ |
| **Editar Valores do Caixa Diretamente**| ❌ | ❌ | ❌ | ❌ (Ver Decisão Arquitetural) |
| **Conceder Crédito/Receber Pagamento**| ❌ | ❌ | ❌ | ✅ (se caixa `open`) |
| **Aprovar Transferências CN** | ✅ | ✅ | ✅ | ❌ |

## Isolamento e Vínculo Hierárquico
- **Trabalhador/Cobrador:** É vinculado a uma ou mais Unidades através do array `assignedUnits` no cadastro de usuário. Ele só enxerga clientes e opera caixas nas unidades atribuídas. `[FONTE: TRYCONTROLLER - "Asignación de unidades"]`
- **Supervisor:** Pode supervisionar várias unidades ou ser vinculado diretamente ao `business_center` (`assignedBc`), herdando acesso de leitura/aprovação em todas as unidades filhas. `[INFERÊNCIA para viabilizar supervisão em massa]`
- **Troca de Contexto:** O usuário utiliza o Seletor Global (Header). As permissões ativas (ex: "Criar Venda") são avaliadas pelo Backend cruzando o `unitId` selecionado na UI contra os arrays de escopo do usuário no token. `[PROPOSTA TÉCNICA]`

---

## DECISÃO ARQUITETURAL: CONTROLE DE EDIÇÃO DO CAIXA

Fica formalizado que **Um administrador NÃO poderá alterar arbitrariamente valores financeiros de um caixa (ex: `initialAmount`) pertencente a outro usuário por meio de edição direta de banco/formulário.** 

- **Quem pode realizar correção:** Collector (dono do caixa) via lançamento, ou Supervisor/Admin após o caixa estar fechado, mas apenas mediante transação explícita.
- **Quais operações podem ser utilizadas:** `Ingresos` (para adicionar saldo corretivo) e `Egresos` (para remover saldo incorreto).
- **Necessidade de justificativa:** Obrigatória na operação de correção (campo `observation`). `[PROPOSTA TÉCNICA]`
- **Auditoria:** O `Ingreso/Egreso` corretivo gera um log imutável vinculando quem executou a correção e o caixa alvo.
- **Impacto no saldo:** O valor entra como movimentação contábil, e não como "apagar o valor original e sobrescrever".
- **Comportamento com caixa aberto:** O próprio collector lança o Egreso/Ingreso corretivo (ou supervisor lança direcionado àquele caixa).
- **Comportamento com caixa fechado:** O supervisor rejeita o fechamento (revertendo status para `open`) e exige a correção, OU lança uma transferência de ajuste e então `confirma`. `[NÃO DOCUMENTADO o fluxo exato de ajuste, proposta técnica assumida para segurança]`
- **Comportamento com caixa confirmado:** **Totalmente bloqueado.** Nenhum ajuste pode ser feito sem envolver fluxos de cancelamento complexos (estorno).
