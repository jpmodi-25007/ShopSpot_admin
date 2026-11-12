/** One CSV cell: quotes/commas/newlines escaped, spreadsheet formulas neutralised. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Prevent CSV/formula injection when the file is opened in Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/** Triggers a browser download (Blob based - safe for '#', large files and unicode). */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const blob = new Blob(["\uFEFF" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
