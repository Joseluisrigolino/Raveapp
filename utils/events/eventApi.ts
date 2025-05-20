// utils/events/eventApi.ts
import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(startIso: string, endIso: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${pad(s.getHours())}hs a ${pad(e.getHours())}hs`;
}

function mapGenre(code: number): string {
  const names = ["Rave","Techno","House","Trance","Drum & Bass","Hardcore","Dubstep"];
  return names[code] ?? "Otros";
}

export async function fetchEvents(): Promise<EventItem[]> {
  const token = await login();
  const response = await apiClient.get("/v1/Evento/GetEventos", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = response.data;
  return (json.eventos as any[]).map(e => {
    // Si e.fechas no existe o está vacío, usamos inicioEvento/finEvento
    const inicioIso = e.fechas?.[0]?.inicio ?? e.inicioEvento;
    const finIso    = e.fechas?.[0]?.fin    ?? e.finEvento;

    return {
      id: e.idEvento,
      title: e.nombre,
      date: formatDate(inicioIso),
      timeRange: formatTimeRange(inicioIso, finIso),
      address: e.domicilio?.direccion ?? "",
      description: e.descripcion,
      imageUrl: e.media?.[0]?.imagen ?? "",
      type: mapGenre(Array.isArray(e.genero) ? e.genero[0] : 0),
    };
  });
}
