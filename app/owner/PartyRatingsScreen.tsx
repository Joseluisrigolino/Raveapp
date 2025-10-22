// app/owner/PartyRatingsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getPartyById } from "@/utils/partysApi";

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
        // Obtener nombre de la fiesta; API aún no expone reseñas, así que usamos placeholder
        try {
          const p = await getPartyById(idFiesta);
          setPartyName(p?.nombre || "Fiesta");
        } catch {}
        // Placeholder de reseñas simuladas (hasta que haya endpoint real)
        const today = new Date();
        const sample: Review[] = [
          {
            id: "1",
            userName: "María González",
            comment:
              "Increíble fiesta! La música estuvo espectacular y el ambiente fue perfecto. Los DJs realmente sabían cómo mantener a la pista llena toda la noche. Definitivamente volveré.",
            rating: 5,
            dateISO: new Date(today.getFullYear(), 0, 15).toISOString(),
          },
          {
            id: "2",
            userName: "Carlos Ruiz",
            comment:
              "Muy buena fiesta en general. El sonido estuvo excelente y la organización fue impecable. Solo le faltó un poco más de variedad en los géneros musicales.",
            rating: 4,
            dateISO: new Date(today.getFullYear(), 0, 12).toISOString(),
          },
          {
            id: "3",
            userName: "Ana Martínez",
            comment:
              "¡Fantástica experiencia! Los efectos visuales y la producción fueron de primer nivel. El line-up estuvo increíble, especialmente el set principal. Muy recomendable.",
            rating: 5,
            dateISO: new Date(today.getFullYear(), 0, 8).toISOString(),
          },
          {
            id: "4",
            userName: "Diego López",
            comment:
              "Estuvo bien pero esperaba más. El lugar se llenó demasiado y era difícil moverse. La música estuvo buena pero nada extraordinario. Precio un poco alto para lo que ofrecieron.",
            rating: 3,
            dateISO: new Date(today.getFullYear(), 0, 5).toISOString(),
          },
          {
            id: "5",
            userName: "Sofía Herrera",
            comment:
              "Me encantó la fiesta! El ambiente estuvo genial y conocí mucha gente nueva. Los tragos estuvieron buenos y el personal muy amable. Solo mejoraría la ventilación del lugar.",
            rating: 4,
            dateISO: new Date(today.getFullYear(), 0, 2).toISOString(),
          },
          {
            id: "6",
            userName: "Roberto Silva",
            comment:
              "No cumplió mis expectativas. La música estuvo muy repetitiva y el servicio en la barra fue muy lento. Además, el lugar estaba demasiado caluroso. No creo que vuelva.",
            rating: 2,
            dateISO: new Date(today.getFullYear() - 1, 11, 28).toISOString(),
          },
        ];
        setReviews(sample);
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
      stars.push(
        <MaterialCommunityIcons key={i} name={name as any} size={16} color={COLORS.textSecondary} />
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
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar reseñas..."
            placeholderTextColor={COLORS.textSecondary}
            value={q}
            onChangeText={setQ}
          />
        </View>

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
