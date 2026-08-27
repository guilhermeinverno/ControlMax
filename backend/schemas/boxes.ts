import { z } from "zod";
import { nonEmptyString, nonNegativeCentsSchema } from "./money";

/**
 * POST /api/boxes/open
 * Aceita alias Sync `initialBalanceCents` → `initialAmount`.
 */
export const openBoxBodySchema = z
  .object({
    unitId: nonEmptyString,
    unitName: z.string().optional().default(""),
    cnId: nonEmptyString,
    cnName: z.string().optional().default(""),
    initialAmount: nonNegativeCentsSchema.optional(),
    initialBalanceCents: nonNegativeCentsSchema.optional(),
    observation: z.string().optional().default(""),
    date: nonEmptyString,
    idempotencyKey: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.initialAmount === undefined && data.initialBalanceCents === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["initialAmount"],
        message: "Campos obrigatórios ausentes.",
      });
    }
  })
  .transform((data) => ({
    unitId: data.unitId,
    unitName: data.unitName,
    cnId: data.cnId,
    cnName: data.cnName,
    initialAmount: (data.initialAmount ?? data.initialBalanceCents) as number,
    observation: data.observation,
    date: data.date,
    idempotencyKey: data.idempotencyKey,
  }));

export type OpenBoxBody = z.infer<typeof openBoxBodySchema>;

/**
 * POST /api/boxes/close
 * Aceita alias Sync `finalBalanceCents` → `realFinalAmount`.
 */
export const closeBoxBodySchema = z
  .object({
    boxId: nonEmptyString,
    realFinalAmount: nonNegativeCentsSchema.optional(),
    finalBalanceCents: nonNegativeCentsSchema.optional(),
    idempotencyKey: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.realFinalAmount === undefined && data.finalBalanceCents === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["realFinalAmount"],
        message: "Campos obrigatórios ausentes.",
      });
    }
  })
  .transform((data) => ({
    boxId: data.boxId,
    realFinalAmount: (data.realFinalAmount ?? data.finalBalanceCents) as number,
    idempotencyKey: data.idempotencyKey,
  }));

export type CloseBoxBody = z.infer<typeof closeBoxBodySchema>;
