import { z } from "zod";
import { nonEmptyString, nonNegativeCentsSchema, positiveCentsSchema } from "./money";

/** POST /api/transactions/sale */
export const saleBodySchema = z.object({
  clientId: nonEmptyString,
  clientName: nonEmptyString,
  amountCents: positiveCentsSchema,
  installmentAmountCents: positiveCentsSchema,
  totalInstallments: z.coerce
    .number({ error: "Quantidade de parcelas inválida." })
    .int({ error: "Quantidade de parcelas inválida." })
    .positive({ error: "Quantidade de parcelas inválida." }),
  date: nonEmptyString,
  notes: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  photoName: z.string().optional().default(""),
  frequency: z.string().optional().default("diaria"),
  idempotencyKey: z.string().optional(),
});

export type SaleBody = z.infer<typeof saleBodySchema>;

/** POST /api/transactions/collection */
export const collectionBodySchema = z.object({
  saleId: nonEmptyString,
  amountCents: nonNegativeCentsSchema,
  paymentMethod: nonEmptyString,
  comment: z.string().optional().default(""),
  idempotencyKey: z.string().optional(),
});

export type CollectionBody = z.infer<typeof collectionBodySchema>;

/** POST /api/transactions/reversal */
export const reversalBodySchema = z.object({
  originalTransactionId: nonEmptyString,
  reason: nonEmptyString,
  idempotencyKey: z.string().optional(),
});

export type ReversalBody = z.infer<typeof reversalBodySchema>;
