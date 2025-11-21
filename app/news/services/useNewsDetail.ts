// src/screens/NewsScreens/services/useNewsDetail.ts
import { useEffect, useMemo, useState } from "react";
import { NewsItem } from "@/interfaces/NewsProps";
import {
  getNewsById,
  extractEventIdFromUrl,
} from "@/app/news/apis/newsApi";
import { fetchEventById } from "@/app/events/apis/eventApi";

type RelatedEvent = {
  id: string;
  title: string | null;
  imageUrl: string | null;
} | null;

export default function useNewsDetail(id?: string) {
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [relatedEvent, setRelatedEvent] = useState<RelatedEvent>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        if (active) setLoading(false);
        return;
      }
      try {
        const found = await getNewsById(String(id));
        if (!active) return;

        if (!found) {
          setNewsItem(null);
          setRelatedEvent(null);
          return;
        }

        setNewsItem(found);

        // Id de evento vinculado
        const fromApi = (found as any).urlEventoId as string | undefined;
        const fallback = extractEventIdFromUrl((found as any).urlEvento);
        const eventId = fromApi ?? fallback ?? null;

        if (!eventId) {
          setRelatedEvent(null);
          return;
        }

        const ev = await fetchEventById(eventId);
        if (!active) return;

        setRelatedEvent({
          id: eventId,
          title: ev?.title || null,
          imageUrl: ev?.imageUrl || null,
        });
      } catch (e) {
        if (!active) return;
        console.error("[useNewsDetail] error cargando noticia:", e);
        setNewsItem(null);
        setRelatedEvent(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const formattedDate = useMemo(() => {
    if (!newsItem?.dtPublicado) return "";
    try {
      const d = new Date(newsItem.dtPublicado);
      const day = d.getDate().toString().padStart(2, "0");
      const month = d.toLocaleString("es-ES", { month: "long" });
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const year = d.getFullYear();
      return `${day} ${capMonth} ${year}`;
    } catch {
      return "";
    }
  }, [newsItem?.dtPublicado]);

  return { newsItem, relatedEvent, loading, formattedDate } as const;
}
