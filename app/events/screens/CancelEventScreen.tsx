// app/owner/CancelEventScreen.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import InputDesc from "@/components/common/inputDesc";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

import {
  fetchEventById,
  EventItemWithExtras,
  cancelEvent,
} from "@/app/events/apis/eventApi";
import { sendMassCancelEmail } from "@/app/events/services/useSendEmailMassiveCancel";
import { useAuth } from "@/app/auth/AuthContext";
import { fetchReporteVentasEvento, ReporteVentasEvento } from "@/app/events/apis/entradaApi";

type TicketSoldInfo = { type: string; quantity: number; price: number };
type OwnerEventCancelItem = {
  id: string | number;
  eventName: string;
  ticketsSold: TicketSoldInfo[];
  totalRefund: number;
  imageUrl?: string;
  dateText?: string;
};

export default function CancelEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? decodeURIComponent(String(rawId)) : "";
  const { user, hasRole } = useAuth();
  const baseUserId = String((user as any)?.id ?? (user as any)?.idUsuario ?? "");
  const isAdmin = !!hasRole?.("admin");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelData, setCancelData] = useState<OwnerEventCancelItem | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);
      setCancelData(null);

      try {
        if (!id) throw new Error("No llegó el ID del evento en la URL.");
        const ev = await fetchEventById(id);
        if (!ev) throw new Error("Evento no encontrado.");

        // Determinar organizador para el reporte (igual que en pantalla de reporte)
        const pickOwnerId = (e: any): string | null => {
          return (
            (e?.ownerId && String(e.ownerId)) ||
            (e?.__raw?.propietario?.idUsuario && String(e.__raw.propietario.idUsuario)) ||
            (e?.__raw?.usuario?.idUsuario && String(e.__raw.usuario.idUsuario)) ||
            null
          );
        };

        const orgForReport = isAdmin ? pickOwnerId(ev) || baseUserId : baseUserId;

        // Intentar traer el reporte real de ventas por evento
        let report: ReporteVentasEvento | null = null;
        if (orgForReport) {
          try {
            report = await fetchReporteVentasEvento(String(id), String(orgForReport));
          } catch (e) {
            report = null;
          }
        }

        const mapped: OwnerEventCancelItem = mapToCancel(ev, report || undefined);
        if (mounted) setCancelData(mapped);
      } catch (e: any) {
        if (mounted) setErrorMsg(e?.message || "No se pudo obtener el evento.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const mapToCancel = (ev: EventItemWithExtras, rep?: ReporteVentasEvento): OwnerEventCancelItem => {
    // Aggregate real sold entries from report if available
    const aggregateFromReport = (report: ReporteVentasEvento | undefined) => {
      if (!report || !Array.isArray(report.dias)) return { rows: [] as TicketSoldInfo[], total: 0 };
      type Acc = { qty: number; subtotal: number };
      const byType = new Map<string, Acc>();
      for (const d of report.dias) {
        for (const it of d.items || []) {
          // Saltar fila TOTAL si existiera
          const label = String(it?.tipo || it?.entrada || "");
          if (label.trim().toUpperCase() === "TOTAL") continue;
          const derCantidad = Number(it?.cantidadVendida ?? 0);
          const unit = Number(it?.precioUnitario ?? 0);
          // Preferir subtotal exacto si viene; si no, qty * unit
          const subtotal = typeof it?.subtotal === "number" && isFinite(it.subtotal)
            ? Number(it.subtotal)
            : derCantidad * unit;
          const acc = byType.get(label) || { qty: 0, subtotal: 0 };
          acc.qty += derCantidad;
          acc.subtotal += subtotal;
          byType.set(label, acc);
        }
      }
      const rows: TicketSoldInfo[] = Array.from(byType.entries()).map(([type, acc]) => {
        const price = acc.qty > 0 ? acc.subtotal / acc.qty : 0; // promedio cuando hay múltiples precios
        return { type, quantity: acc.qty, price };
      });
      const total = Array.from(byType.values()).reduce((s, v) => s + v.subtotal, 0);
      return { rows, total };
    };

    const agg = aggregateFromReport(rep);
    return {
      id: Number(String(ev.id)) || 0,
      eventName: ev.title || "Evento",
      imageUrl: ev.imageUrl || "",
      dateText:
        ev.date ||
        (Array.isArray(ev.fechas) && ev.fechas[0]?.inicio
          ? new Date(ev.fechas[0].inicio).toLocaleDateString()
          : ""),
      ticketsSold: agg.rows,
      totalRefund: agg.total,
    };
  };

  const backendMsg = (e: any) =>
    e?.response?.data?.message ||
    e?.response?.data?.Message ||
    e?.response?.data?.error ||
    e?.message ||
    "Ocurrió un error al cancelar el evento.";

  const handleCancelEvent = async () => {
    if (!cancelData || !id) {
      Alert.alert("Error", "No se pudo resolver el ID del evento.");
      return;
    }

    Alert.alert(
      "Confirmar cancelación",
      "Esta acción no se puede deshacer. ¿Querés cancelar el evento?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              // El endpoint solo recibe 'id' como query param
              await cancelEvent(String(id));
              // Solo enviar mail si hay compradores
              const totalQty = cancelData.ticketsSold.reduce((s, r) => s + r.quantity, 0);
              if (totalQty > 0) {
                try {
                  await sendMassCancelEmail({
                    idEvento: String(id),
                    eventName: cancelData.eventName,
                    reason: reason || undefined,
                  });
                } catch (mailErr) {
                  // Si falla el envío de mail, no mostrar ningún mensaje ni alerta
                }
              }
              Alert.alert("Evento cancelado", "El evento se canceló correctamente.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert("Error", backendMsg(e));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator />
          <Text style={styles.loaderText}>Cargando evento…</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.notFoundWrapper}>
          <Text style={styles.notFoundText}>{errorMsg}</Text>
          {!!id && (
            <Text style={[styles.notFoundText, { marginTop: 6, opacity: 0.7 }]}>ID recibido: {id}</Text>
          )}
        </View>
      ) : !cancelData ? (
        <View style={styles.notFoundWrapper}>
          <Text style={styles.notFoundText}>No se encontró la información del evento a cancelar.</Text>
          {!!id && (
            <Text style={[styles.notFoundText, { marginTop: 6, opacity: 0.7 }]}>ID recibido: {id}</Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <MaterialCommunityIcons name="alert-outline" size={22} color={COLORS.negative} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoCardTitle}>Cancelación de evento</Text>
              <Text style={styles.infoCardBody}>La cancelación de este evento es una acción que <Text style={{fontWeight: '700'}}>no se puede revertir</Text>. Se avisará vía mail a las personas que hayan comprado una entrada, y se procederá a realizar la devolución del dinero correspondiente.</Text>
            </View>
          </View>

          {/* Subtitulo */}
          <Text style={styles.eventSubtitle}>Evento a cancelar:</Text>

          {/* Evento card */}
          <View style={styles.eventCard}>
            {cancelData.imageUrl ? (
              <Image source={{ uri: cancelData.imageUrl }} style={styles.eventThumb} />
            ) : (
              <View style={[styles.eventThumb, { backgroundColor: COLORS.backgroundLight, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: COLORS.textSecondary }}>Evento</Text>
              </View>
            )}
            <View style={styles.eventCardBody}>
              <Text style={styles.eventCardTitle}>{cancelData.eventName}</Text>
              <Text style={styles.eventCardDate}>{cancelData.dateText || ""}</Text>
            </View>
          </View>

          {/* Tickets sold section (real data). If none, show previous banner/card */}
          {(() => {
            const totalQty = cancelData.ticketsSold.reduce((s, r) => s + r.quantity, 0);
            if (totalQty === 0) {
              return (
                <View style={[styles.infoCard, { marginTop: 12 }]}> 
                  <View style={styles.infoIconBox}>
                    <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoCardTitle}>Sin entradas vendidas</Text>
                    <Text style={styles.infoCardBody}>
                      No se encontraron entradas vendidas para este evento. Al cancelarlo, no se realizarán reembolsos.
                    </Text>
                  </View>
                </View>
              );
            }
            return (
              <View style={[styles.ticketListContainer, { marginTop: 12 }]}>
                <Text style={styles.ticketSubtitle}>Se reembolsarán un total de {totalQty} entradas:</Text>
                {cancelData.ticketsSold.map((t, i) => (
                  <View key={i} style={styles.ticketRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketRowTitle}>{t.quantity} entradas <Text style={styles.ticketRowType}>{t.type}</Text></Text>
                      <Text style={styles.ticketRowSubtitle}>de ${Number(t.price).toLocaleString()} c/u</Text>
                    </View>
                    <Text style={styles.ticketRowAmount}>${(t.quantity * t.price).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.ticketDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total a devolver:</Text>
                  <Text style={styles.totalAmount}>${cancelData.totalRefund.toLocaleString()}</Text>
                </View>
              </View>
            );
          })()}

          {/* Motivo */}
          <View style={styles.formGroup}>
            <InputDesc
              label="Motivo de cancelación *"
              isEditing={true}
              onBeginEdit={() => {}}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe el motivo de la cancelación del evento..."
            />
            <Text style={styles.helperText}>Este motivo será enviado a todos los compradores</Text>
          </View>

          {/* Footer actions */}
          <View style={styles.footerActions}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Volver</Text>
            </Pressable>
            <TouchableOpacity
              style={[styles.confirmButton, submitting && { opacity: 0.7 }]}
              onPress={handleCancelEvent}
              disabled={submitting}
            >
              <Text style={styles.confirmButtonText}>{submitting ? "Cancelando..." : "Confirmar cancelación"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderText: { marginTop: 8, color: COLORS.textSecondary },

  notFoundWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body },

  scrollContent: { padding: 16 },

  formGroup: { marginBottom: 16, width: "100%" },

  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    alignSelf: "center",
    marginBottom: 8,
  },

  infoText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
  },
  infoTextBold: { fontWeight: "bold" },

  sectionLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  eventName: { color: COLORS.info },

  ticketListContainer: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: RADIUS.card,
  },
  ticketSubtitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  ticketItem: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 10,
    marginBottom: 2,
  },
  totalRefund: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.negative,
    marginTop: 8,
  },

  motivoLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  motivoInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    color: COLORS.textPrimary,
    marginHorizontal: 4,
  },
  warningText: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginHorizontal: 4,
  },

  cancelButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  /* new styles for redesigned layout */
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: { fontSize: 20 },
  infoTextCol: { flex: 1 },
  infoCardTitle: { fontSize: FONT_SIZES.subTitle, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  infoCardBody: { color: COLORS.textSecondary, lineHeight: 18 },

  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.card, padding: 12, marginHorizontal: 4, marginTop: 12, borderWidth: 1, borderColor: COLORS.borderInput },
  eventThumb: { width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: COLORS.backgroundLight },
  eventCardBody: { flex: 1 },
  eventCardTitle: { fontWeight: '700', color: COLORS.textPrimary, fontSize: FONT_SIZES.body },
  eventCardDate: { color: COLORS.textSecondary, marginTop: 4 },

  eventSubtitle: { fontSize: FONT_SIZES.body, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12, marginHorizontal: 4, marginBottom: 6 },

  ticketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderInput },
  ticketRowTitle: { fontWeight: '700', color: COLORS.textPrimary },
  ticketRowType: { fontWeight: '400', color: COLORS.textSecondary },
  ticketRowSubtitle: { color: COLORS.textSecondary, marginTop: 4 },
  ticketRowAmount: { fontWeight: '700', color: COLORS.textPrimary, marginLeft: 12 },
  ticketDivider: { height: 1, backgroundColor: COLORS.borderInput, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  totalLabel: { color: COLORS.textPrimary, fontWeight: '700' },
  totalAmount: { color: COLORS.negative, fontWeight: '700', fontSize: FONT_SIZES.body },

  helperText: { color: COLORS.textSecondary, marginTop: 8 },

  footerActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 4 },
  backButton: { flex: 1, marginRight: 8, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.borderInput, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.cardBg },
  backButtonText: { color: COLORS.textPrimary, fontWeight: '700' },
  confirmButton: { flex: 1, marginLeft: 8, borderRadius: RADIUS.card, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.negative },
  confirmButtonText: { color: COLORS.cardBg, fontWeight: '700' },
});
