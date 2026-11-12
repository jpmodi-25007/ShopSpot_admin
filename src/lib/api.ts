import { API_URL } from "@/config/constants";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Pulls the most useful human-readable message out of a Nest error body. */
export function messageFromBody(body: unknown, fallback: string): string {
  const message = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message) && message.length) return message.join(", ");
  if (typeof message === "string" && message) return message;
  return fallback;
}

export function authHeaders(json = true): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Access tokens live 15 minutes. Exchanges the stored refresh token for a new
 * pair (shared across concurrent requests). Returns false when the session
 * cannot be renewed and the user must sign in again.
 */
export function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return Promise.resolve(false);

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const tokens = await res.json();
      if (!tokens?.accessToken) return false;
      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  clearSession();
  window.location.href = "/login";
}

/**
 * Authenticated JSON request against the admin API. Throws an Error whose
 * message is the server's validation/business message, so callers can show it
 * in a toast instead of a generic "failed".
 */
export async function apiRequest<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: authHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && (await refreshSession())) res = await send();
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!res.ok) {
    throw new Error(messageFromBody(data, `Request failed (${res.status})`));
  }
  return data as T;
}

export const apiGet = <T = unknown>(path: string) => apiRequest<T>("GET", path);
export const apiPost = <T = unknown>(path: string, body?: unknown) => apiRequest<T>("POST", path, body ?? {});
export const apiPatch = <T = unknown>(path: string, body: unknown) => apiRequest<T>("PATCH", path, body);
export const apiPut = <T = unknown>(path: string, body: unknown) => apiRequest<T>("PUT", path, body);
export const apiDelete = <T = unknown>(path: string) => apiRequest<T>("DELETE", path);

/** Builds "?a=1&b=2" from non-empty values (ALL / "" / undefined are dropped). */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "ALL") continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Maps the toolbar's "date joined" select to the API's createdFrom ISO date. */
export function createdFromFor(range: string): string | undefined {
  const day = 24 * 60 * 60 * 1000;
  if (range === "LAST_7_DAYS") return new Date(Date.now() - 7 * day).toISOString();
  if (range === "LAST_30_DAYS") return new Date(Date.now() - 30 * day).toISOString();
  if (range === "THIS_YEAR") return new Date(new Date().getFullYear(), 0, 1).toISOString();
  return undefined;
}

/** Walks every page of a list endpoint (for "export all" - not just the visible page). */
export async function fetchAllPages<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string | number | undefined | null>,
  maxPages = 50,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await apiGet<{ data: T[]; meta: { totalPages: number } }>(
      `${path}${buildQuery({ ...params, page, limit: 100 })}`,
    );
    rows.push(...(res.data ?? []));
    if (page >= (res.meta?.totalPages ?? 1)) break;
  }
  return rows;
}
