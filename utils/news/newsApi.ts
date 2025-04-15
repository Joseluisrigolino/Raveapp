// src/utils/news/newsApi.ts
import { apiClient, login } from "../apiConfig";
import { NewsItem } from "@/interfaces/NewsProps";

/** Obtiene todas las noticias */
export async function getNews(): Promise<NewsItem[]> {
  const token = await login();
  const response = await apiClient.get("/v1/Noticia", {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "*/*",
    },
  });
  return response.data.noticias;
}

/** Obtiene una noticia por su idNoticia */
export async function getNewsById(id: string): Promise<NewsItem | null> {
  const allNews = await getNews(); 
  return allNews.find((item) => item.idNoticia === id) || null;
}

/** Actualiza (PUT) una noticia */
export async function updateNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.put("/v1/Noticia", news, {
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
      accept: "*/*",
    },
  });
}

/** Crea (POST) una noticia */
export async function createNews(news: Partial<NewsItem>): Promise<NewsItem> {
  const token = await login();
  const response = await apiClient.post("/v1/Noticia", news, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
}
