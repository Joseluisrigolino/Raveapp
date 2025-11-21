// src/screens/admin/NewsScreens/services/useNewsEvents.ts
import { useCallback, useEffect, useState } from "react";
import { fetchEvents } from "@/app/events/apis/eventApi";
import { NewsEventOption } from "../components/create/NewsEventSelectorComponent";

export default function useNewsEvents() {
  const [events, setEvents] = useState<NewsEventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchEvents();
      const mapped: NewsEventOption[] = res.map((e: any) => ({
        id: e.id,
        name: e.title,
        imageUrl: e.imageUrl,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("[useNewsEvents] Error al cargar eventos:", err);
      setError("No se pudieron cargar los eventos.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, refresh: load } as const;
}
