// src/utils/news/newsApi.ts

import { apiClient, login } from "../apiConfig";
import { NewsItem } from "@/interfaces/NewsProps";

/** Obtiene todas las noticias */
export async function getNews(): Promise<NewsItem[]> {
  const token = await login();
  const { data } = await apiClient.get<{
    noticias?: NewsItem[];
    Noticia?: NewsItem[];
  }>(
    "/v1/Noticia/GetNoticia",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "*/*",
      },
    }
  );

  console.log("[debug] getNews response.data:", data);

  // Detectar la propiedad que contiene el array
  const list = data.noticias ?? data.Noticia ?? [];
  return Array.isArray(list) ? list : [];
}

/** Obtiene una noticia por su idNoticia */
export async function getNewsById(id: string): Promise<NewsItem | null> {
  const all = await getNews();
  return all.find(item => item.idNoticia === id) || null;
}

/** Crea una noticia */
export async function createNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.post<NewsItem>(
    "/v1/Noticia",
    news,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

/** Actualiza (PUT) una noticia */
export async function updateNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.put<NewsItem>(
    "/v1/Noticia",
    news,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

/** Elimina (DELETE) una noticia */
export async function deleteNews(idNoticia: string): Promise<void> {
  const token = await login();
  await apiClient.delete(
    `/v1/Noticia/${idNoticia}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "*/*",
      },
    }
  );
}
