// app/party/services/usePartyRatings.ts
import { useEffect, useMemo, useState } from "react";
import { getPartyById } from "@/app/party/apis/partysApi";
import { getResenias } from "@/utils/reviewsApi";
import { getUsuarioById } from "@/app/auth/userApi";
import { mediaApi } from "@/app/apis/mediaApi";

export type PartyReview = {
  id: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  rating: number; // 0..5
  dateISO: string; // fecha de reseña
};

export type PartyRatingsSortKey = "recent" | "best" | "worst";

type UsePartyRatingsResult = {
  loading: boolean;
  error: string | null;
  partyName: string;
  reviews: PartyReview[];
  filteredReviews: PartyReview[];
  search: string;
  setSearch: (value: string) => void;
  sort: PartyRatingsSortKey;
  setSort: (value: PartyRatingsSortKey) => void;
  toggleSort: () => void;
};

export default function usePartyRatings(partyId?: string): UsePartyRatingsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partyName, setPartyName] = useState<string>("");
  const [reviews, setReviews] = useState<PartyReview[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PartyRatingsSortKey>("recent");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const idFiesta = partyId ? String(partyId) : "";
        if (!idFiesta) {
          setError("Fiesta no encontrada");
          setLoading(false);
          return;
        }

        // Nombre de la fiesta
        try {
          const p = await getPartyById(idFiesta);
          setPartyName(p?.nombre || "Fiesta");
        } catch {
          // si falla igual seguimos con reseñas
          setPartyName("Fiesta");
        }

        // 1) reseñas
        const raw = await getResenias({ idFiesta });

        // 2) usuarios únicos para enriquecer
        const uniqueUserIds = Array.from(
          new Set(
            (raw || [])
              .map((r: any) => String(r?.idUsuario || "").trim())
              .filter((v) => v.length > 0)
          )
        );

        const usersMap: Record<string, { name: string; avatar?: string }> = {};

        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const u = await getUsuarioById(uid);
              const name =
                `${u?.nombre ?? ""} ${u?.apellido ?? ""}`.trim() ||
                (u as any)?.correo ||
                "Usuario";

              let avatar = "";
              try {
                avatar = await mediaApi.getFirstImage(uid);
              } catch {
                // sin avatar
              }

              usersMap[uid] = { name, avatar };
            } catch {
              usersMap[uid] = { name: "Usuario", avatar: "" };
            }
          })
        );

        const list: PartyReview[] = (raw || []).map((r: any) => {
          const uid = String(r?.idUsuario || "").trim();
          const u = usersMap[uid] || { name: "Usuario", avatar: "" };

          return {
            id: String(r?.id ?? r?.idResenia ?? Math.random()),
            userName: u.name,
            userAvatar: u.avatar,
            comment: String(r?.comentario ?? "").trim(),
            rating: Number(r?.estrellas ?? 0) || 0,
            dateISO: String(r?.fecha || new Date().toISOString()),
          };
        });

        setReviews(list);
      } catch (e) {
        setError("No se pudieron cargar las reseñas");
      } finally {
        setLoading(false);
      }
    })();
  }, [partyId]);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base = reviews.filter(
      (r) =>
        !q ||
        r.comment.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q)
    );

    const sorter = (a: PartyReview, b: PartyReview) => {
      if (sort === "best") return b.rating - a.rating;
      if (sort === "worst") return a.rating - b.rating;
      return (
        new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
    };

    return [...base].sort(sorter);
  }, [reviews, search, sort]);

  const toggleSort = () => {
    setSort((prev) =>
      prev === "recent" ? "best" : prev === "best" ? "worst" : "recent"
    );
  };

  return {
    loading,
    error,
    partyName,
    reviews,
    filteredReviews,
    search,
    setSearch,
    sort,
    setSort,
    toggleSort,
  };
}
