// src/screens/admin/NewsScreens/services/useManageNews.ts
import { useCallback, useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";

import { getNews, deleteNews } from "@/app/news/apis/newsApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { on as onEvent } from "@/utils/eventBus";

export default function useManageNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isFocused = useIsFocused();

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNews();
      setNews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[useManageNews] Error al cargar noticias:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // carga inicial
  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  // recarga al ganar foco
  useEffect(() => {
    if (isFocused) {
      void loadNews();
    }
  }, [isFocused, loadNews]);

  // recarga al recibir evento global
  useEffect(() => {
    const unsubscribe = onEvent("news:updated", () => {
      console.log("[useManageNews] event news:updated → reload list");
      void loadNews();
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadNews]);

  // elimina media asociada y la noticia
  const deleteNewsWithMedia = useCallback(
    async (idNoticia: string) => {
      try {
        const media = await mediaApi.getByEntidad(idNoticia);
        if (media?.media?.length > 0) {
          for (const m of media.media) {
            await mediaApi.delete(m.idMedia);
          }
        }

        await deleteNews(idNoticia);
        setNews((prev) => prev.filter((n) => n.idNoticia !== idNoticia));
      } catch (e) {
        console.error("[useManageNews] Error al eliminar noticia:", e);
        throw e;
      }
    },
    []
  );

  return { news, loading, deleteNewsWithMedia } as const;
}
