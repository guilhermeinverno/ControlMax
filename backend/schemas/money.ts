import { z } from "zod";

/** Centavos > 0 (venda, parcela, etc.). */
export const positiveCentsSchema = z.coerce
  .number({ error: "Valor monetário inválido." })
  .finite({ error: "Valor monetário inválido." })
  .gt(0, { error: "Valores monetários inválidos. Devem ser números finitos maiores que zero." })
  .transform((n) => Math.round(n));

/** Centavos >= 0 (caixa, visita sem pagamento). */
export const nonNegativeCentsSchema = z.coerce
  .number({ error: "Valor monetário inválido." })
  .finite({ error: "Valor monetário inválido." })
  .gte(0, {
    error: "Valor monetário inválido. Deve ser um número finito maior ou igual a zero.",
  })
  .transform((n) => Math.round(n));

export const nonEmptyString = z
  .string({ error: "Campo obrigatório ausente." })
  .trim()
  .min(1, { error: "Campo obrigatório ausente." });

