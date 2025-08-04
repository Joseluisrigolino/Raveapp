// src/utils/events/eventApi.ts

import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";

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
  const names = [
    "Rave",
    "Techno",
    "House",
    "Trance",
    "Drum & Bass",
    "Hardcore",
    "Dubstep",
  ];
  return names[code] ?? "Otros";
}

const PLACEHOLDER_IMAGE = "";

async function fetchEventMediaUrl(idEvento: string): Promise<string> {
  try {
    const data: any = await mediaApi.getByEntidad(idEvento);
    const m = data.media?.[0];
    let img = m?.url ?? m?.imagen ?? "";
    if (img && m?.imagen && !/^https?:\/\//.test(img)) {
      img = `${apiClient.defaults.baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
    }
    return img;
  } catch {
    return PLACEHOLDER_IMAGE;
  }
}

/**
 * Obtiene solamente eventos con estado===2, pasando Estado=2 en la query string,
 * y les enriquece la primera imagen.
 */
export async function fetchEvents(): Promise<EventItem[]> {
  const token = await login();
  // Llamada con ?Estado=2
  const resp = await apiClient.get<{ eventos: any[] }>(
    "/v1/Evento/GetEventos",
    {
      params: { Estado: 2 },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log("[debug|fetchEvents] respuesta completa:", resp.data);

  const list = resp.data.eventos ?? [];
  // Si tu API devuelve directamente un array:
  // const list = Array.isArray(resp.data) ? resp.data : resp.data.eventos;

  // Enriquecemos y formateamos
  const enriched = await Promise.all(
    list.map(async e => {
      const inicioIso = e.fechas?.[0]?.inicio ?? e.inicioEvento;
      const finIso    = e.fechas?.[0]?.fin    ?? e.finEvento;

      const mediaUrl = await fetchEventMediaUrl(e.idEvento);
      const fallback = e.media?.[0]?.imagen ?? "";
      const imageUrl = mediaUrl || fallback;

      return {
        id:          e.idEvento,
        title:       e.nombre,
        date:        formatDate(inicioIso),
        timeRange:   formatTimeRange(inicioIso, finIso),
        address:     e.domicilio?.direccion ?? "",
        description: e.descripcion,
        imageUrl,
        type:        mapGenre(Array.isArray(e.genero) ? e.genero[0] : 0),
        // opcional:
        estado:      e.fechas?.[0]?.estado,
      } as EventItem & { estado: number };
    })
  );


  
  console.log("[debug|fetchEvents] eventos formateados:", enriched);
  return enriched;
}

