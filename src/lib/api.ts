import { mockRequest } from "./mock-api";
import { getAccessToken, setAccessToken } from "./token";
import type { ApiResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function parseJson(res: Response): Promise<ApiResponse<unknown>> {
  try {
    return (await res.json()) as ApiResponse<unknown>;
  } catch {
    return { success: false, error: "Ungültige Server-Antwort" };
  }
}

async function rawFetch(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  if (USE_MOCK) {
    return mockRequest(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return { status: res.status, body: await parseJson(res) };
}

async function refreshAccess() {
  if (USE_MOCK) {
    const result = await mockRequest("/api/auth/refresh", { method: "POST" });
    if (result.body.success) {
      const token = (result.body.data as { access_token: string }).access_token;
      setAccessToken(token);
      return token;
    }
    setAccessToken(null);
    return null;
  }

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const body = await parseJson(res);
  if (body.success) {
    const token = (body.data as { access_token: string }).access_token;
    setAccessToken(token);
    return token;
  }
  setAccessToken(null);
  return null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const first = await rawFetch(path, options, getAccessToken());
  if (first.status !== 401 || path.startsWith("/api/auth/")) {
    return first.body as ApiResponse<T>;
  }
  const next = await refreshAccess();
  if (!next) return first.body as ApiResponse<T>;
  const retry = await rawFetch(path, options, next);
  return retry.body as ApiResponse<T>;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: "POST", body }),
};
