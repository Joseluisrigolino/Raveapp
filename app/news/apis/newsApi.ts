// src/utils/news/newsApi.ts
import { apiClient, login } from "@/app/apis/apiConfig";
import { NewsItem } from "@/app/news/types/NewsInterface";
import { mediaApi } from "@/app/apis/mediaApi";

/**
 * Extrae el id de evento desde una URL que contenga /evento/{id}
 * Devuelve null si no puede sacar nada útil.
 */
export function extractEventIdFromUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url || url.toLowerCase() === "null") return null;

  const match = url.match(/(?:^|\/)evento\/([^/?#\s]+)(?:[/?#]|$)/i);
  if (match?.[1]) {
    const id = match[1].trim();
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }

  // Si guardaron solo el ID (texto suelto)
  const looksLikeId = /^[A-Za-z0-9-]{8,}$/.test(url);
  return looksLikeId ? url : null;
}

/**
 * Convierte el objeto crudo del backend en el shape que usamos en la app.
 * Básicamente:
 *  - fuerza idNoticia a string
 *  - agrega urlEventoId
 */
function mapNews(raw: any): NewsItem {
  const idNoticia = String(raw.idNoticia ?? "");
  const urlEventoId = extractEventIdFromUrl(raw.urlEvento);

  return {
    ...raw,
    idNoticia,
    urlEventoId,
  } as NewsItem;
}

/** GET: todas las noticias + media */
export async function getNews(): Promise<NewsItem[]> {
  const token = await login();

  const response = await apiClient.get("/v1/Noticia", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = response.data || {};
  const listRaw: any[] = Array.isArray(data.noticias)
    ? data.noticias
    : Array.isArray(data.Noticia)
    ? data.Noticia
    : [];

  const mapped = listRaw.map(mapNews);

  // Agregar imagen desde mediaApi (si existe)
  const withMedia = await Promise.all(
    mapped.map(async (noticia) => {
      try {
        const media = await mediaApi.getByEntidad(noticia.idNoticia);
        if (media?.media?.length > 0) {
          noticia.imagen = media.media[0].url;
        }
      } catch (err) {
        console.warn("[getNews] error al obtener media", err);
      }
      return noticia;
    })
  );

  return withMedia;
}

/** GET: una noticia por id + media */
export async function getNewsById(id: string): Promise<NewsItem | null> {
  const token = await login();

  const response = await apiClient.get("/v1/Noticia", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = response.data || {};
  const listRaw: any[] = Array.isArray(data.noticias)
    ? data.noticias
    : Array.isArray(data.Noticia)
    ? data.Noticia
    : [];

  const raw = listRaw.find(
    (n: any) => String(n.idNoticia) === String(id)
  );
  if (!raw) return null;

  const noticia = mapNews(raw);

  try {
    const media = await mediaApi.getByEntidad(noticia.idNoticia);
    if (media?.media?.length > 0) {
      noticia.imagen = media.media[0].url;
    }
  } catch (err) {
    console.warn("[getNewsById] error al obtener media", err);
  }

  return noticia;
}

/** POST: crea noticia */
export async function createNews(
  news: Partial<NewsItem>
): Promise<NewsItem> {
  const token = await login();

  const response = await apiClient.post("/v1/Noticia", news, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return mapNews(response.data);
}

/** PUT: actualiza noticia */
export async function updateNews(
  news: Partial<NewsItem>
): Promise<NewsItem> {
  const token = await login();

  const response = await apiClient.put("/v1/Noticia", news, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return mapNews(response.data);
}

/** DELETE: elimina noticia */
export async function deleteNews(idNoticia: string): Promise<void> {
  const token = await login();

  await apiClient.delete(`/v1/Noticia/${idNoticia}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
