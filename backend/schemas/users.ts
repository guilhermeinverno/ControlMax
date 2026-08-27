import { z } from "zod";
import { nonEmptyString } from "./money";

/** POST /api/admin/users */
export const createUserBodySchema = z.object({
  email: z
    .string({ error: "O e-mail é obrigatório." })
    .trim()
    .min(1, { error: "O e-mail é obrigatório." })
    .transform((s) => s.toLowerCase()),
  password: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  roleId: z.union([z.string(), z.number()]).optional(),
  tenantId: z.string().optional(),
  active: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  usuario_unidades: z.array(z.coerce.string()).optional().default([]),
  permissions: z.record(z.string(), z.unknown()).optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

/** PUT /api/admin/users/:id */
export const updateUserBodySchema = z
  .object({
    name: z.string().optional(),
    userName: z.string().optional(),
    role: z.string().optional(),
    roleId: z.union([z.string(), z.number()]).optional(),
    active: z.boolean().optional(),
    usuario_unidades: z.array(z.coerce.string()).optional(),
    permissions: z.record(z.string(), z.unknown()).optional(),
    phone: z.string().optional(),
    document: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine((data) => Object.keys(data).some((k) => k !== "reason" && data[k as keyof typeof data] !== undefined), {
    message: "Nenhum campo para atualizar.",
  });

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

/** Soft re-export for callers that need a required string helper */
export { nonEmptyString };
