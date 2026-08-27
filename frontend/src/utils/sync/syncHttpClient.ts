import { getAuthIdToken, forceRefreshIdToken, isClaimsStaleResponse } from "../authToken";
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
   * Perform an HTTP request with Firebase Auth token attached.
   * ENT-04: em 401 CLAIMS_STALE força refresh do token e tenta 1 vez.
   */
  async request<Response, Request = unknown>(
    method: HttpMethod,
    url: string,
    data?: Request,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    const doFetch = async (token: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SyncHttpClient.DEFAULT_TIMEOUT);

      const init: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      };

      if (data !== undefined) {
        init.body = JSON.stringify(data);
      }

      const fullUrl =
        url.startsWith("/") && typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

      try {
        return await fetch(fullUrl, init);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let token = await getAuthIdToken(false);
    let response = await doFetch(token);

    if (response.status === 401) {
      let body: unknown = null;
      try {
        body = await response.clone().json();
      } catch {
        body = null;
      }
      if (isClaimsStaleResponse(401, body)) {
        token = await forceRefreshIdToken();
        response = await doFetch(token);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return (await response.json()) as Response;
  }
}
