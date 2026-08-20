export const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      window.location.href = '/login';
    }
    const error = new Error("An error occurred while fetching the data.");
    const errorInfo = await res.json().catch(() => ({}));
    Object.assign(error, { info: errorInfo, status: res.status });
    throw error;
  }

  return res.json();
};
