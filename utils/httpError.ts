// utils/httpError.ts
export function formatAxiosError(err: any): string {
  const status = err?.response?.status;
  const statusText = err?.response?.statusText;
  const url = err?.config?.url;
  const method = (err?.config?.method || "get").toUpperCase();

  // body que devolvió el backend
  const data = err?.response?.data;
  const msgFromBackend =
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.errors ||
    (typeof data === "string" ? data : null);

  // payload que intentamos enviar
  const sent = err?.config?.data;
  let sentStr = "";
  try {
    if (sent) sentStr = typeof sent === "string" ? sent : JSON.stringify(sent);
  } catch {}

  return [
    `HTTP ${method} ${url}`,
    status ? `Status: ${status} ${statusText || ""}`.trim() : null,
    msgFromBackend ? `Backend: ${typeof msgFromBackend === "string" ? msgFromBackend : JSON.stringify(msgFromBackend)}` : null,
    sentStr ? `Payload: ${sentStr}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
