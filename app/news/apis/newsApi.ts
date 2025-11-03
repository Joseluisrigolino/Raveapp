// src/utils/news/newsApi.ts
import { apiClient, login } from "../../apis/apiConfig";
import { NewsItem } from "@/app/news/types/NewsProps";
import { mediaApi } from "@/app/apis/mediaApi";

/** Extrae el id de evento desde una URL que contenga /evento/{id}
 *  Soporta:
 *   - https://raveapp.com.ar/evento/3c69.../
 *   - https://raveapp.com.ar/evento/3c69...?a=1
 *   - /evento/3c69...
 *   - evento/3c69...
 *  Ignora casos "null", null, "", y espacios.
 */
export function extractEventIdFromUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url || url.toLowerCase() === "null") return null;

  // Regex tolerante
  const m = url.match(/(?:^|\/)evento\/([^/?#\s]+)(?:[/?#]|$)/i);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1].trim());
    } catch {
      return m[1].trim();
    }
  }

  // Si guardaron solo el ID (raro pero posible)
  const looksLikeId = /^[A-Za-z0-9-]{8,}$/.test(url);
  if (looksLikeId) return url;

  return null;
}

/** Normaliza NewsItem con tipos/props que usamos en la app */
function normalizeNews(n: any): any {
  const copy: any = { ...n };
  // idNoticia siempre como string para evitar mismatches
  copy.idNoticia = String(copy.idNoticia ?? "");
  // Agregamos id del evento extraído de la URL (si existe)
  copy.urlEventoId = extractEventIdFromUrl(copy.urlEvento);
  return copy;
}

/** Obtiene todas las noticias y les asocia la imagen desde mediaApi, + urlEventoId */
export async function getNews(): Promise<NewsItem[]> {
  const token = await login();
  const response = await apiClient.get<{
    noticias?: NewsItem[];
    Noticia?: NewsItem[];
  }>("/v1/Noticia", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  const listRaw = response.data.noticias ?? response.data.Noticia ?? [];
  if (!Array.isArray(listRaw)) return [];

  // Normalizamos + media
  const list = listRaw.map(normalizeNews);

  const newsWithMedia = await Promise.all(
    list.map(async (noticia: any) => {
      try {
        const media = await mediaApi.getByEntidad(noticia.idNoticia);
        if (media?.media?.length > 0) {
          noticia.imagen = media.media[0].url;
        }
      } catch (err) {
        console.error(
          "Error al obtener media para noticia",
          noticia.idNoticia,
          err
        );
      }
      return noticia;
    })
  );

  return newsWithMedia as NewsItem[];
}

/** Obtiene una noticia por su idNoticia, incluyendo su media, + urlEventoId */
export async function getNewsById(id: string): Promise<NewsItem | null> {
  const token = await login();
  const response = await apiClient.get<{
    noticias?: NewsItem[];
    Noticia?: NewsItem[];
  }>("/v1/Noticia", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  const listRaw = response.data.noticias ?? response.data.Noticia ?? [];
  const raw =
    Array.isArray(listRaw) &&
    listRaw.find((n: any) => String(n.idNoticia) === String(id));
  if (!raw) return null;

  const noticia: any = normalizeNews(raw);

  try {
    const media = await mediaApi.getByEntidad(noticia.idNoticia);
    if (media?.media?.length > 0) {
      noticia.imagen = media.media[0].url;
    }
  } catch (err) {
    console.warn("[newsApi] No se pudo cargar imagen de la noticia", err);
  }

  return noticia as NewsItem;
}

/** Crea una noticia */
export async function createNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.post<NewsItem>("/v1/Noticia", news, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  // Normalizamos la salida por coherencia
  return normalizeNews(response.data) as NewsItem;
}

/** Actualiza (PUT) una noticia */
export async function updateNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.put<NewsItem>("/v1/Noticia", news, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return normalizeNews(response.data) as NewsItem;
}

/** Elimina (DELETE) una noticia */
export async function deleteNews(idNoticia: string): Promise<void> {
  const token = await login();
  await apiClient.delete(`/v1/Noticia/${idNoticia}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });
}
