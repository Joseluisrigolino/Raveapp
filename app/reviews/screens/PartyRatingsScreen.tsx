// app/owner/PartyRatingsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getPartyById } from "@/app/party/apis/partysApi";
import { getResenias } from "@/utils/reviewsApi";
import { getUsuarioById } from "@/app/auth/userHelpers";
import { mediaApi } from "@/app/apis/mediaApi";
import SearchBarComponent from "@/components/common/SearchBarComponent";

type Review = {
  id: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  rating: number; // 0..5
  dateISO: string; // fecha de reseña
};

export default function PartyRatingsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partyName, setPartyName] = useState<string>("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "best" | "worst">("recent");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const idFiesta = id ? decodeURIComponent(String(id)) : "";
        if (!idFiesta) {
          setError("Fiesta no encontrada");
          setLoading(false);
          return;
        }
        // Nombre de la fiesta
        try {
          const p = await getPartyById(idFiesta);
          setPartyName(p?.nombre || "Fiesta");
        } catch {}

        // 1) Traer reseñas reales de la fiesta
        const raw = await getResenias({ idFiesta });

        // 2) Enriquecer con usuario (nombre + avatar)
        const uniqueUserIds = Array.from(
          new Set(
            (raw || [])
              .map((r) => String(r?.idUsuario || "").trim())
              .filter((v) => v.length > 0)
          )
        );

        const usersMap: Record<string, { name: string; avatar?: string }> = {};
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const u = await getUsuarioById(uid);
              const name = `${u?.nombre ?? ""} ${u?.apellido ?? ""}`.trim() || (u as any)?.correo || "Usuario";
              // Asumimos que la imagen de perfil se guarda en Media con idEntidadMedia = idUsuario
              // Si tu backend usa otra entidad para el avatar, ajustá acá
              let avatar = "";
              try { avatar = await mediaApi.getFirstImage(uid); } catch {}
              usersMap[uid] = { name, avatar };
            } catch {
              usersMap[uid] = { name: "Usuario", avatar: "" };
            }
          })
        );

        const list: Review[] = (raw || []).map((r) => {
          const uid = String(r?.idUsuario || "").trim();
          const u = usersMap[uid] || { name: "Usuario", avatar: "" };
          return {
            id: String(r?.id ?? r?.idResenia ?? Math.random()),
            userName: u.name,
            userAvatar: u.avatar,
            comment: String(r?.comentario ?? "").trim(),
            rating: Number(r?.estrellas ?? 0) || 0,
            dateISO: String(r?.fecha || new Date().toISOString()),
          } as Review;
        });

        setReviews(list);
      } catch (e) {
        setError("No se pudieron cargar las reseñas");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const filtered = useMemo(() => {
    const list = reviews.filter((r) =>
      !q.trim() || r.comment.toLowerCase().includes(q.toLowerCase()) || r.userName.toLowerCase().includes(q.toLowerCase())
    );
    const sorter = (a: Review, b: Review) => {
      if (sort === "best") return b.rating - a.rating;
      if (sort === "worst") return a.rating - b.rating;
      return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime();
    };
    return [...list].sort(sorter);
  }, [reviews, q, sort]);

  const formatDateEsLong = (iso: string) => {
    try {
      const d = new Date(iso);
      const day = d.getDate().toString().padStart(2, "0");
      const month = d.toLocaleString("es-ES", { month: "long" });
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const year = d.getFullYear();
      return `${day} ${capMonth} ${year}`;
    } catch {
      return iso;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [] as JSX.Element[];
    for (let i = 1; i <= 5; i++) {
      const name = rating >= i ? "star" : rating >= i - 0.5 ? "star-half-full" : "star-outline";
      const color = name === "star" || name === "star-half-full" ? "#f59e0b" : COLORS.textSecondary; // amarillo para llenas/medias
      stars.push(
        <MaterialCommunityIcons key={i} name={name as any} size={16} color={color} />
      );
    }
    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Reseñas - {partyName || "Fiesta"}</Text>

        {/* Search bar */}
        <SearchBarComponent
          value={q}
          onChangeText={setQ}
          placeholder="Buscar reseñas..."
        />

        {/* Sort row */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Ordenar por:</Text>
          <TouchableOpacity style={styles.sortPicker} onPress={() => {
            // simple toggle for now: recent -> best -> worst -> recent
            setSort((prev) => (prev === 'recent' ? 'best' : prev === 'best' ? 'worst' : 'recent'));
          }}>
            <Text style={styles.sortPickerText}>
              {sort === 'recent' ? 'Más recientes' : sort === 'best' ? 'Mejor puntuación' : 'Peor puntuación'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Reviews list */}
        <View style={{ gap: 14 }}>
          {filtered.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.avatarCircle} />
                  <View>
                    <Text style={styles.userName}>{r.userName}</Text>
                    <Text style={styles.dateText}>{formatDateEsLong(r.dateISO)}</Text>
                  </View>
                </View>
                {renderStars(r.rating)}
              </View>
              <Text style={styles.commentText}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16 },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginBottom: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  sortLabel: { color: COLORS.textSecondary },
  sortPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBg,
  },
  sortPickerText: { color: COLORS.textPrimary, fontFamily: FONTS.bodyRegular },
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.borderInput,
  },
  userName: { color: COLORS.textPrimary, fontFamily: FONTS.subTitleMedium, fontSize: 14 },
  dateText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  commentText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, marginTop: 8, lineHeight: 20 },
});
