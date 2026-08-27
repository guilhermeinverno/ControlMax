import { NextFunction, Request, Response } from "express";

export const RATE_LIMIT_ERROR_CODE = "RATE_LIMIT_EXCEEDED";

export interface RateLimitOptions {
  /** Máximo de requisições na janela. */
  limit: number;
  /** Janela em ms. */
  windowMs: number;
  /** Prefixo da chave (ex.: gemini, financial). */
  keyPrefix: string;
  /** Mensagem 429 (PT-BR). */
  message?: string;
}

type RateLimitedRequest = Request & {
  user?: { uid?: string };
};

/** Store in-memory — por instância. Multi-instância: trocar por Redis. */
const buckets = new Map<string, number[]>();

/** Expõe o mapa só para testes. */
export function __resetRateLimitStoreForTests(): void {
  buckets.clear();
}

export function __rateLimitStoreSizeForTests(): number {
  return buckets.size;
}

function resolveClientKey(req: RateLimitedRequest): string {
  if (req.user?.uid) return req.user.uid;
  const forwarded = req.headers["x-forwarded-for"];
  const fromHeader = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (fromHeader) return String(fromHeader).split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "anonymous";
}

/**
 * Sliding window in-memory.
 * @returns allowed ou retryAfterSeconds.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const active = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);

  if (active.length >= limit) {
    const oldest = active[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, active);
    return { allowed: false, retryAfterSeconds };
  }

  active.push(now);
  buckets.set(key, active);
  return { allowed: true };
}

/**
 * Middleware Express pós-auth.
 * Desliga com `RATE_LIMIT_DISABLED=true` (testes / LOCAL_DEV se necessário).
 */
export function createRateLimiter(options: RateLimitOptions) {
  const message =
    options.message ||
    "Muitas solicitações. Por favor, tente novamente em breve.";

  return (req: RateLimitedRequest, res: Response, next: NextFunction): void => {
    if (process.env.RATE_LIMIT_DISABLED === "true") {
      next();
      return;
    }

    const client = resolveClientKey(req);
    const key = `${options.keyPrefix}:${client}`;
    const result = consumeRateLimit(key, options.limit, options.windowMs);

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      res.status(429).json({
        error: message,
        code: RATE_LIMIT_ERROR_CODE,
        retryAfterSeconds: result.retryAfterSeconds,
        limit: options.limit,
        windowMs: options.windowMs,
      });
      return;
    }

    next();
  };
}

/** Assistente Gemini — 10 req/min por usuário (custo/latência). */
export const assistantRateLimit = createRateLimiter({
  keyPrefix: "gemini",
  limit: Math.max(1, Number(process.env.RATE_LIMIT_GEMINI) || 10),
  windowMs: 60_000,
  message: "Muitas solicitações ao assistente. Tente novamente em um minuto.",
});

/** Mutações financeiras (transactions + boxes) — 120 req/min por usuário. */
export const financialRateLimit = createRateLimiter({
  keyPrefix: "financial",
  limit: Math.max(1, Number(process.env.RATE_LIMIT_FINANCIAL) || 120),
  windowMs: 60_000,
  message: "Muitas solicitações financeiras. Tente novamente em breve.",
});
