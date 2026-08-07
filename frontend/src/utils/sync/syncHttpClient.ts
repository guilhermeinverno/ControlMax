// src/utils/sync/syncHttpClient.ts

import { HttpMethod } from "./httpMethod";

/**
 * Generic HTTP client used by SyncExecutor to communicate with the BFF.
 * It supports the basic HTTP verbs, JSON payloads and a configurable timeout.
 * No `any` is used – request and response bodies are typed via generics.
 */
export class SyncHttpClient {
  /** Default timeout in milliseconds (10 seconds). */
  private static readonly DEFAULT_TIMEOUT = 10_000;

  /**
   * Perform an HTTP request.
   * @param method HTTP method.
   * @param url Full URL (including base path) to call.
   * @param data Optional request body – will be JSON‑stringified.
   * @param headers Optional additional headers.
   * @returns Parsed JSON response typed as `Response`.
   */
  async request<Response, Request = unknown>(
    method: HttpMethod,
    url: string,
    data?: Request,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SyncHttpClient.DEFAULT_TIMEOUT);

    const init: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data !== undefined) {
      init.body = JSON.stringify(data);
    }

    const response = await fetch(url, init);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Assume JSON response – callers can type‑cast as needed.
    return (await response.json()) as Response;
  }
}
