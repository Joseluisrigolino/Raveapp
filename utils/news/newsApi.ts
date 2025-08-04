// src/utils/news/newsApi.ts
import { apiClient, login } from "../apiConfig";
import { NewsItem } from "@/interfaces/NewsProps";
import { mediaApi } from "@/utils/mediaApi";

/** Obtiene todas las noticias y les asocia la imagen desde mediaApi */
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

  const list = response.data.noticias ?? response.data.Noticia ?? [];
  if (!Array.isArray(list)) return [];

  const newsWithMedia = await Promise.all(
    list.map(async (noticia) => {
      try {
        const media = await mediaApi.getByEntidad(noticia.idNoticia);
        if (media?.media?.length > 0) {
          return {
            ...noticia,
            imagen: media.media[0].url,
          };
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

  return newsWithMedia;
}

/** Obtiene una noticia por su idNoticia, incluyendo su media */
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

  const list = response.data.noticias ?? response.data.Noticia ?? [];
  const noticia = list.find((n) => n.idNoticia === id);
  if (!noticia) return null;

  try {
    const media = await mediaApi.getByEntidad(noticia.idNoticia);
    if (media?.media?.length > 0) {
      noticia.imagen = media.media[0].url;
    }
  } catch (err) {
    console.warn("[newsApi] No se pudo cargar imagen de la noticia", err);
  }

  return noticia;
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
  return response.data;
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
  return response.data;
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
