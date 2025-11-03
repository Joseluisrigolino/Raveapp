import React, { useEffect, useMemo, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBar from "@/components/common/SearchBarComponent";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { fetchEventsByEstados, ESTADO_CODES, EventItemWithExtras } from "@/app/events/apis/eventApi";
import { getSafeImageSource } from "@/utils/image";

type FilterKey = "all" | "active" | "finished" | "draft";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "finished", label: "Finalizados" },
  { key: "draft", label: "Borrador" },
];

export default function ReporteVentaEntradaMenu() {
  const router = useRouter();
  const { id: ownerIdParam } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItemWithExtras[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Aprobados + En venta + Finalizados + Fin Venta + Por Aprobar (borrador)
        const estados = [
          ESTADO_CODES.APROBADO,
          ESTADO_CODES.EN_VENTA,
          ESTADO_CODES.FIN_VENTA,
          ESTADO_CODES.FINALIZADO,
          ESTADO_CODES.POR_APROBAR,
        ];
        let list = await fetchEventsByEstados(estados);
        // Si se pasó un owner id por params, filtrar solo eventos de ese owner
        if (ownerIdParam) {
          list = list.filter((e) => String(e.ownerId ?? e.ownerId ?? "") === String(ownerIdParam));
        }
        // Orden por fecha asc (usa string dd/mm/yyyy)
        const toTs = (d?: string) => {
          if (!d) return 0;
          const [dd, mm, yy] = String(d).split("/").map(Number);
          return new Date(yy || 0, (mm || 1) - 1, dd || 1).getTime();
        };
        setEvents(list.slice().sort((a, b) => toTs(a.date) - toTs(b.date)));
      } catch (e) {
        setError("No se pudieron cargar los eventos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ownerIdParam]);

  const filtered = useMemo(() => {
    let arr = [...events];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      arr = arr.filter((e) => {
        const code = Number((e as any).cdEstado ?? (e as any).estado ?? NaN);
        if (filter === "active") return code === ESTADO_CODES.APROBADO || code === ESTADO_CODES.EN_VENTA;
        if (filter === "finished") return code === ESTADO_CODES.FIN_VENTA || code === ESTADO_CODES.FINALIZADO;
        if (filter === "draft") return code === ESTADO_CODES.POR_APROBAR;
        return true;
      });
    }
    return arr;
  }, [events, search, filter]);

  const goReport = useCallback((id: string) => {
    nav.push(router, { pathname: ROUTES.OWNER.TICKET_SOLD, params: { id } });
  }, [router]);

  return (
    <SafeAreaView style={styles.root}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis Eventos</Text>
        <Text style={styles.subtitle}>Selecciona un evento para ver el reporte de entradas</Text>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar eventos..." />

        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No hay eventos.</Text>
        ) : (
          filtered.map((e) => (
            <View key={String(e.id)} style={styles.card}>
              <View style={styles.row}>
                {e.imageUrl ? (
                  <Image source={getSafeImageSource(e.imageUrl)} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{e.title}</Text>
                  <Text style={styles.cardMeta}>{e.type}</Text>
                  <Text style={styles.cardMeta}>{e.date}{e.timeRange ? `  •  ${e.timeRange}` : ""}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.reportBtn} onPress={() => goReport(String(e.id))}>
                  <Text style={styles.reportText}>Ver Reporte →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 10 },
  filtersRow: { flexDirection: "row", gap: 10, paddingHorizontal: 8, marginBottom: 10 },
  chip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  chipActive: { backgroundColor: "#111827" },
  chipText: { color: COLORS.textSecondary },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  error: { color: COLORS.negative, textAlign: "center", marginTop: 16 },
  empty: { color: COLORS.textSecondary, textAlign: "center", marginTop: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.card,
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center" },
  image: { width: 56, height: 56, borderRadius: RADIUS.card, backgroundColor: COLORS.cardBg },
  imageFallback: { backgroundColor: COLORS.borderInput },
  cardTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 16 },
  cardMeta: { color: COLORS.textSecondary, marginTop: 2 },
  cardFooter: { marginTop: 10, alignItems: "flex-end" },
  reportBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reportText: { color: "#fff", fontWeight: "700" },
});
