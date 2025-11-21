import { useEffect, useState } from "react";
import { fetchEvents, fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";

// Hook simple para obtener eventos con estado 0 y el mapa de géneros
// Comentarios en español explicando lo que hace
export default function useGetEventsToValidate(refresh?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // cargar géneros (si falla, seguimos con mapa vacío)
        try {
          const gen = await fetchGenres();
          if (!mounted) return;
          setGenreMap(new Map((gen as ApiGenero[]).map((g) => [g.cdGenero, g.dsGenero])));
        } catch {}

        // cargar eventos en estado 0 (pendientes)
        try {
          const data = await fetchEvents(0);
          if (!mounted) return;
          const onlyStateZero = Array.isArray(data)
            ? (data as any[]).filter((ev) => {
                const isCdEstadoZero = ev?.cdEstado === 0 || String(ev?.cdEstado) === "0";
                const isEstadoZero = ev?.estado === 0 || String(ev?.estado) === "0";
                return isCdEstadoZero || isEstadoZero;
              })
            : [];
          const withImages = onlyStateZero.filter((ev: any) => typeof ev?.imageUrl === "string" && ev.imageUrl.trim().length > 0);
          if (mounted) setItems(withImages);
        } catch (e) {
          // en caso de error, dejamos items vacío
          if (mounted) setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refresh]);

  return { items, loading, genreMap } as const;
}
import { useEffect, useState } from "react";
import { fetchEvents, fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";

// Hook simple para obtener eventos con estado 0 y el mapa de géneros
// Comentarios en español explicando lo que hace
export default function useGetEventsToValidate(refresh?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // cargar géneros (si falla, seguimos con mapa vacío)
        try {
          const gen = await fetchGenres();
          if (!mounted) return;
          setGenreMap(new Map((gen as ApiGenero[]).map((g) => [g.cdGenero, g.dsGenero])));
        } catch {}

        // cargar eventos en estado 0 (pendientes)
        try {
          const data = await fetchEvents(0);
          if (!mounted) return;
          const onlyStateZero = Array.isArray(data)
            ? (data as any[]).filter((ev) => {
                const isCdEstadoZero = ev?.cdEstado === 0 || String(ev?.cdEstado) === "0";
                const isEstadoZero = ev?.estado === 0 || String(ev?.estado) === "0";
                return isCdEstadoZero || isEstadoZero;
              })
            : [];
          const withImages = onlyStateZero.filter((ev: any) => typeof ev?.imageUrl === "string" && ev.imageUrl.trim().length > 0);
          if (mounted) setItems(withImages);
        } catch (e) {
          // en caso de error, dejamos items vacío
          if (mounted) setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refresh]);

  return { items, loading, genreMap } as const;
}
