import { mutate } from "swr";
import { API_URL } from "@/config/constants";

/** Refresh sidebar badge counts after approve / resolve / mark-read actions. */
export function revalidateAdminSummary() {
  return mutate(`${API_URL}/admin/summary`);
}

export function revalidateAdminNotifications() {
  const base = `${API_URL}/admin/notifications`;
  return mutate(
    (key) => typeof key === "string" && key.startsWith(base),
    undefined,
    { revalidate: true },
  );
}
