// app/owner/CancelEventScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

import {
  fetchEventById,
  EventItemWithExtras,
  cancelEvent,
} from "@/utils/events/eventApi";

type TicketSoldInfo = { type: string; quantity: number; price: number };
type OwnerEventCancelItem = {
  id: string | number;
  eventName: string;
  ticketsSold: TicketSoldInfo[];
  totalRefund: number;
};

export default function CancelEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? decodeURIComponent(String(rawId)) : "";

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

        const mapped: OwnerEventCancelItem = mapToCancel(ev);
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

  const mapToCancel = (ev: EventItemWithExtras): OwnerEventCancelItem => ({
    id: ev.id,
    eventName: ev.title || "Evento",
    ticketsSold: [], // TODO: poblar con tu endpoint real de vendidas
    totalRefund: 0,
  });

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
            <Text style={[styles.notFoundText, { marginTop: 6, opacity: 0.7 }]}>
              ID recibido: {id}
            </Text>
          )}
        </View>
      ) : !cancelData ? (
        <View style={styles.notFoundWrapper}>
          <Text style={styles.notFoundText}>
            No se encontró la información del evento a cancelar.
          </Text>
          {!!id && (
            <Text style={[styles.notFoundText, { marginTop: 6, opacity: 0.7 }]}>
              ID recibido: {id}
            </Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.title}>Cancelación de evento</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.infoText}>
              La cancelación de este evento es una acción que{" "}
              <Text style={styles.infoTextBold}>no se puede revertir</Text>. Se
              avisará vía mail a las personas que hayan comprado una entrada, y se
              procederá a realizar la devolución del dinero correspondiente.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.sectionLabel}>
              Evento a cancelar: <Text style={styles.eventName}>{cancelData.eventName}</Text>
            </Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.ticketListContainer}>
              <Text style={styles.ticketSubtitle}>
                Se reembolsarán un total de {cancelData.ticketsSold.length} entradas:
              </Text>

              {cancelData.ticketsSold.length === 0 ? (
                <Text style={styles.ticketItem}>
                  (No se encontraron entradas vendidas para este evento)
                </Text>
              ) : (
                cancelData.ticketsSold.map((t, i) => (
                  <Text key={i} style={styles.ticketItem}>
                    • {t.quantity} {t.type} de ${t.price.toLocaleString()}.00 c/u
                  </Text>
                ))
              )}

              <Text style={styles.totalRefund}>
                Total a devolver: ${cancelData.totalRefund.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.motivoLabel}>Motivo (opcional)</Text>
            <TextInput
              style={styles.motivoInput}
              placeholder="Podés dejar un mensaje para tu equipo interno…"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              value={reason}
              onChangeText={setReason}
            />
            <Text style={styles.warningText}>* Esta operación no puede ser revertida.</Text>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, submitting && { opacity: 0.7 }]}
            onPress={handleCancelEvent}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>
              {submitting ? "Cancelando..." : "Cancelar Evento"}
            </Text>
          </TouchableOpacity>
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
});
