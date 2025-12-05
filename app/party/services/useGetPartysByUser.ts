import { useState, useEffect, useCallback } from "react";
import { Party, getPartiesByUser } from "@/app/party/apis/partysApi";
import { getAvgResenias } from "@/utils/reviewsApi";

export default function useGetPartysByUser(userId?: string | null) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        setParties([]);
        return;
      }
      const data = await getPartiesByUser(String(userId));
      // Mostrar solo las fiestas activas
      const active = (data || []).filter((p) => p.isActivo === true);

      // Intentar obtener promedios/cantidades consolidadas desde el endpoint de reseñas
      try {
        const avgs = await getAvgResenias();
        const map = new Map<string, { avg: number; count?: number }>();
        for (const it of avgs || []) {
          const id = it?.idFiesta ?? it?.IdFiesta ?? it?.fiestaId ?? undefined;
          if (!id) continue;
          const key = String(id);
          const avg = typeof it.avg === "number" ? it.avg : Number(it.avg);
          const count = it.count !== undefined ? Number(it.count) : undefined;
          if (!Number.isNaN(avg)) {
            map.set(key, { avg: Number.isFinite(avg) ? avg : 0, count: Number.isFinite(count as number) ? count : undefined });
          }
        }

        const merged = active.map((p) => {
          const existing = p;
          const entry = map.get(String(p.idFiesta));
          if (entry) {
            return { ...existing, ratingAvg: entry.avg, reviewsCount: entry.count ?? existing.reviewsCount } as Party;
          }
          return existing;
        });

        setParties(merged);
      } catch (err) {
        // Si falla el endpoint de promedios, conservar lo que ya trajo getPartiesByUser
        setParties(active);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { parties, loading, error, refresh } as const;
}
