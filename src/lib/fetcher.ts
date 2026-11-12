import { clearSession, messageFromBody, refreshSession } from "./api";

const request = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { headers });
};

export const fetcher = async (url: string) => {
  let res = await request(url);

  // Access tokens expire after 15 minutes: renew silently and retry once.
  if (res.status === 401 && (await refreshSession())) {
    res = await request(url);
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      window.location.href = '/login';
    }
    const errorInfo = await res.json().catch(() => ({}));
    const error = new Error(messageFromBody(errorInfo, "An error occurred while fetching the data."));
    Object.assign(error, { info: errorInfo, status: res.status });
    throw error;
  }

  return res.json();
};
