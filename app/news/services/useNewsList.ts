// src/screens/NewsScreens/services/useNewsList.ts
import { useCallback, useEffect, useState } from "react";
import { getNews } from "@/app/news/apis/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";

type LoadOptions = {
  refresh?: boolean;
};

export default function useNewsList() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts: LoadOptions = {}) => {
    if (opts.refresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const data = await getNews();
      setNews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[useNewsList] error loading news", e);
      setError("Error al cargar las noticias");
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    news,
    loading,
    refreshing,
    error,
    reload: load,
  } as const;
}
