import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

export function formatZodError(error: ZodError): {
  error: string;
  code: typeof VALIDATION_ERROR_CODE;
  details: Array<{ path: string; message: string }>;
} {
  const details = error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
  const first = details[0];
  const summary =
    first?.message ||
    (details.length > 1 ? "Campos obrigatórios ausentes." : "Payload inválido.");
  return {
    error: summary,
    code: VALIDATION_ERROR_CODE,
    details,
  };
}

/**
 * Valida `req.body` com Zod e substitui pelo resultado parseado.
 * Responde 400 tipado sem seguir para o handler (sem tocar Firestore).
 */
export function validateBody<T extends ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(formatZodError(parsed.error));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
