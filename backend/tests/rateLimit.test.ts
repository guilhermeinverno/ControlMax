import { describe, expect, it, beforeEach } from "vitest";
import express from "express";
import http from "http";
import {
  RATE_LIMIT_ERROR_CODE,
  __resetRateLimitStoreForTests,
  assistantRateLimit,
  consumeRateLimit,
  createRateLimiter,
  financialRateLimit,
} from "../middleware/rateLimit";

describe("ENT-03 rateLimit", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    delete process.env.RATE_LIMIT_DISABLED;
  });

  it("consumeRateLimit permite até o limite e depois bloqueia", () => {
    expect(consumeRateLimit("k1", 3, 60_000).allowed).toBe(true);
    expect(consumeRateLimit("k1", 3, 60_000).allowed).toBe(true);
    expect(consumeRateLimit("k1", 3, 60_000).allowed).toBe(true);
    const blocked = consumeRateLimit("k1", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    }
  });

  it("chaves diferentes são isoladas", () => {
    expect(consumeRateLimit("a", 1, 60_000).allowed).toBe(true);
    expect(consumeRateLimit("b", 1, 60_000).allowed).toBe(true);
    expect(consumeRateLimit("a", 1, 60_000).allowed).toBe(false);
  });

  it("middleware responde 429 tipado após abuso (assistente)", async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { uid: "u-abuse-gemini" };
      next();
    });

    const limiter = createRateLimiter({
      keyPrefix: "test-gemini",
      limit: 2,
      windowMs: 60_000,
      message: "Muitas solicitações ao assistente. Tente novamente em um minuto.",
    });

    app.post("/api/gemini/assistant", limiter, (_req, res) => {
      res.json({ ok: true });
    });

    const server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const addr = server.address() as { port: number };
    const base = `http://127.0.0.1:${addr.port}`;

    const r1 = await fetch(`${base}/api/gemini/assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const r2 = await fetch(`${base}/api/gemini/assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const r3 = await fetch(`${base}/api/gemini/assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
    const body = await r3.json();
    expect(body.code).toBe(RATE_LIMIT_ERROR_CODE);
    expect(r3.headers.get("retry-after")).toBeTruthy();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("middleware bloqueia abuso em collection (financial)", async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { uid: "u-abuse-fin" };
      next();
    });

    const limiter = createRateLimiter({
      keyPrefix: "test-financial",
      limit: 2,
      windowMs: 60_000,
    });

    app.post("/api/transactions/collection", limiter, (_req, res) => {
      res.status(201).json({ success: true });
    });

    const server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const addr = server.address() as { port: number };
    const base = `http://127.0.0.1:${addr.port}`;

    await fetch(`${base}/api/transactions/collection`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    await fetch(`${base}/api/transactions/collection`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const r3 = await fetch(`${base}/api/transactions/collection`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });

    expect(r3.status).toBe(429);
    const body = await r3.json();
    expect(body.code).toBe(RATE_LIMIT_ERROR_CODE);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("RATE_LIMIT_DISABLED bypassa o middleware", async () => {
    process.env.RATE_LIMIT_DISABLED = "true";
    const app = express();
    app.use((req: any, _res, next) => {
      req.user = { uid: "u-bypass" };
      next();
    });
    app.get("/x", createRateLimiter({ keyPrefix: "bypass", limit: 1, windowMs: 60_000 }), (_req, res) => {
      res.json({ ok: true });
    });

    const server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const addr = server.address() as { port: number };
    const base = `http://127.0.0.1:${addr.port}`;

    expect((await fetch(`${base}/x`)).status).toBe(200);
    expect((await fetch(`${base}/x`)).status).toBe(200);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env.RATE_LIMIT_DISABLED;
  });

  it("exporta limiters de produção", () => {
    expect(typeof assistantRateLimit).toBe("function");
    expect(typeof financialRateLimit).toBe("function");
  });
});
