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
import { MaterialIcons as Icon } from "@expo/vector-icons";
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
  // Estados válidos: en_venta | fin_venta | finalizado
  const STATUS_MAP: Record<string, number[]> = {
    en_venta: [ESTADO_CODES.EN_VENTA],
    fin_venta: [ESTADO_CODES.FIN_VENTA],
    finalizado: [ESTADO_CODES.FINALIZADO],
    todos: [ESTADO_CODES.EN_VENTA, ESTADO_CODES.FIN_VENTA, ESTADO_CODES.FINALIZADO],
  };
  const [filterStatus, setFilterStatus] = useState<string>("en_venta");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Solo estados: 2 "En venta", 3 "Fin venta" y 4 "Finalizado"
        const estados = [
          ESTADO_CODES.EN_VENTA,
          ESTADO_CODES.FIN_VENTA,
          ESTADO_CODES.FINALIZADO,
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
    const allowedCodes = STATUS_MAP[filterStatus] || STATUS_MAP.todos;
    arr = arr.filter((e) => {
      const code = Number((e as any).cdEstado ?? (e as any).estado ?? NaN);
      return allowedCodes.includes(code);
    });
    return arr;
  }, [events, search, filterStatus]);

  const goReport = useCallback((id: string) => {
    // Navega a la pantalla de reporte por evento directamente
    nav.push(router, { pathname: ROUTES.OWNER.TICKET_SOLD_EVENT, params: { id } });
  }, [router]);

  return (
    <SafeAreaView style={styles.root}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis Eventos</Text>
        <Text style={styles.subtitle}>Selecciona un evento para ver el reporte de entradas</Text>

        {/* Chips de estado (estilo MenuPantalla) */}
        <View style={styles.chipsRow}>
          {([
            { key: 'en_venta', label: 'En venta' },
            { key: 'fin_venta', label: 'Fin venta' },
            { key: 'finalizado', label: 'Finalizado' },
          ] as const).map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, filterStatus === c.key && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setFilterStatus(c.key)}
            >
              <Text style={[styles.chipText, filterStatus === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Barra de búsqueda visual como en eventos */}
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar eventos..." />

        {loading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Icon name="event-busy" size={34} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
            <Text style={styles.emptyText}>No tienes eventos con estados "En venta", "Fin venta" o "Finalizados" para mostrar reportes de entradas.</Text>
            {/* Caja de leyenda eliminada */}
            <TouchableOpacity style={styles.createBtn} onPress={() => nav.push(router, { pathname: ROUTES.OWNER.MANAGE_EVENTS })}>
              <Text style={styles.createBtnText}>Ver estado de mis eventos →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((e) => (
            <TouchableOpacity
              key={String(e.id)}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => goReport(String(e.id))}
            >
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
            </TouchableOpacity>
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
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 8, marginBottom: 8 },
  chip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  chipActive: { backgroundColor: '#111827' },
  chipText: { color: COLORS.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  error: { color: COLORS.negative, textAlign: "center", marginTop: 16 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyIconText: { fontSize: 42 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 18, lineHeight: 20 },
  legendBox: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.borderInput, marginBottom: 20 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#374151', marginRight: 8 },
  legendText: { color: COLORS.textSecondary },
  createBtn: { backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700' },
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
