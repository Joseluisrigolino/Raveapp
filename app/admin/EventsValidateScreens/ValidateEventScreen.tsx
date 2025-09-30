// src/screens/admin/EventsValidateScreens/ValidateEventScreen.tsx

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import { fetchEvents, setEventStatus, ESTADO_CODES, getEventFlags, EventItemWithExtras } from "@/utils/events/eventApi";
import { apiClient, login } from "@/utils/apiConfig";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import { EventItem } from "@/interfaces/EventItem";
import TituloEvento from "@/components/events/evento/TituloEvento";
import HeroImagen from "@/components/events/evento/HeroImagen";
import BloqueInfoEvento from "@/components/events/evento/BloqueInfoEvento";
import BadgesEvento from "@/components/events/evento/BadgesEvento";
import ReproductorSoundCloud from "@/components/events/evento/ReproductorSoundCloud";
import ReproductorYouTube from "@/components/events/evento/ReproductorYouTube";
// Las reseñas no se muestran en el preview de validación
import { COLORS } from "@/styles/globalStyles";

export default function ValidateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Trae sólo los eventos con Estado=0
        const pendientes = await fetchEvents(0);
        // id viene como string, eventData.id es string
        const found = pendientes.find(e => e.id === id);
        if (found) {
          console.log("ValidateEventScreen - evento encontrado (normalizado):", found);
          setEventData(found);
        }
      } catch (err) {
        console.error("Error al cargar evento para validar:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Si no tenemos email del creador, intentar pedirlo a la API de usuarios
  useEffect(() => {
    (async () => {
      if (!eventData) return;
      console.log("ValidateEventScreen - eventData en efecto de macheo:", eventData);
      // ya hay email
      const existing =
        eventData.ownerEmail ||
        (eventData as any).__raw?.ownerEmail ||
        (eventData as any).__raw?.propietario?.correo ||
        (eventData as any).__raw?.usuario?.correo;
      console.log("ValidateEventScreen - existing email desde eventData/raw:", existing);
      if (existing) return;

      // intentar obtener ownerId desde el evento normalizado o raw
      const ownerId =
        eventData.ownerId ||
        (eventData as any).__raw?.ownerId ||
        (eventData as any).__raw?.propietario?.idUsuario ||
        (eventData as any).__raw?.usuario?.idUsuario ||
        (eventData as any).__raw?.idUsuarioPropietario;
      console.log("ValidateEventScreen - ownerId candidates, usado:", ownerId);
      if (!ownerId) return;

      try {
        const token = await login().catch(() => null);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        console.log("ValidateEventScreen - llamando a /v1/Usuario/GetUsuario con idUsuario=", ownerId);
        const resp = await apiClient.get<{ usuarios: any[] }>("/v1/Usuario/GetUsuario", { params: { idUsuario: ownerId }, headers });
        console.log("ValidateEventScreen - respuesta usuario:", resp?.data);
        const u = resp?.data?.usuarios?.[0] ?? null;
        if (u?.correo) {
          const updated = (prev: EventItemWithExtras | null): EventItemWithExtras | null =>
            prev ? { ...prev, ownerEmail: u.correo, ownerName: u.nombre ?? prev.ownerName } : prev;
          setEventData(prev => {
            const out = updated(prev);
            console.log("ValidateEventScreen - eventData actualizado con ownerEmail:", out);
            return out;
          });
        }
      } catch (e) {
        // no crítico
        console.warn("No se pudo obtener email del creador:", e);
      }
    })();
  }, [eventData]);

  const handleValidate = () => {
    if (!eventData?.id) return;
    (async () => {
      try {
        setLoading(true);
        await setEventStatus(String(eventData.id), ESTADO_CODES.APROBADO);
  Alert.alert("Éxito", "El evento fue validado.");
  nav.replace(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST, params: { refresh: Date.now() } });
      } catch (e: any) {
        console.error("Error validando evento:", e);
        Alert.alert("Error", e?.message || "No se pudo validar el evento.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleReject = () => {
    // validate reason then open confirmation modal
    if (!eventData?.id) return;
    if (!rejectReason || !rejectReason.trim()) {
      Alert.alert("Error", "Debés escribir el motivo del rechazo.");
      return;
    }
    setRejectModalVisible(true);
  };

  const handleRejectConfirmed = () => {
    if (!eventData?.id) return;
    const prev = eventData; // capture previous state for rollback
    (async () => {
      try {
        setLoading(true);
        // optimistic update: marcar localmente como RECHAZADO (cdEstado y estado)
        setEventData(prevData => prevData ? { ...prevData, cdEstado: ESTADO_CODES.RECHAZADO, estado: ESTADO_CODES.RECHAZADO } : prevData);

        await setEventStatus(String(eventData.id), ESTADO_CODES.RECHAZADO, { motivoRechazo: rejectReason.trim() });

  Alert.alert("Evento rechazado", "El evento fue marcado como rechazado.");
  setRejectModalVisible(false);
  nav.replace(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST, params: { refresh: Date.now() } });
      } catch (e: any) {
        console.error("Error rechazando evento:", e);
        Alert.alert("Error", e?.message || "No se pudo rechazar el evento.");
        // rollback optimistic update
        setEventData(prev);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Evento no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Intentar obtener el email del creador desde distintas fuentes (normalizado o raw)
  const creatorEmail =
    eventData?.ownerEmail ||
    (eventData as any)?.__raw?.ownerEmail ||
    (eventData as any)?.__raw?.propietario?.correo ||
    (eventData as any)?.propietario?.correo ||
    "";

  // Preview: reusar componentes de EventScreen para mostrar cómo se vería el evento
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewNoteWrap}>
            <Text style={styles.previewNote}>
              PREVIEW: Esto es sólo una vista previa. Si validás este evento, se publicará y lo verán los usuarios finales de la aplicación.
            </Text>
          </View>
          <TituloEvento title={eventData.title} isFavorite={false} favBusy={false} onToggleFavorite={() => {}} showFavorite={false} />
          <BadgesEvento isLGBT={getEventFlags(eventData).isLGBT} isAfter={getEventFlags(eventData).isAfter} />
          <HeroImagen imageUrl={(eventData as any).imageUrl} onPress={() => {}} />

          <BloqueInfoEvento
            artistas={(eventData as any).artistas}
            fechas={(eventData as any).fechas}
            date={(eventData as any).date}
            timeRange={(eventData as any).timeRange}
            address={(eventData as any).address}
            onSeeAllArtists={() => {}}
            onCómoLlegar={() => {}}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Descripción:</Text>
          <View style={styles.descriptionBox}>
            <Text>{(eventData as any).description}</Text>
          </View>

          {/* La imagen principal ya se muestra en HeroImagen arriba; evitamos duplicados */}

          {/* Multimedia preview */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <ReproductorSoundCloud soundCloudUrl={(eventData as any).musica || (eventData as any).soundCloud || null} />
            <ReproductorYouTube youTubeEmbedUrl={null} />
          </View>

          <Text style={[styles.rejectTitle, { marginTop: 12 }]}>Motivo de rechazo</Text>
          <Text style={styles.rejectSubtitle}>Es obligatorio escribir un motivo si vas a rechazar el evento. Este motivo se enviará al equipo y al creador del evento vía mail y quedará registrado.</Text>
          <TextInput
            style={styles.rejectInput}
            multiline
            placeholder="Escribí el motivo..."
            value={rejectReason}
            onChangeText={setRejectReason}
          />

          {/* Confirmación modal antes de rechazar */}
          <Modal visible={rejectModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirmar rechazo</Text>
                <Text style={styles.modalMessage}>
                  {`Estás por rechazar este evento. Se enviará el motivo al equipo`}
                  {creatorEmail ? ` y al creador vía mail.` : ` y al creador vía mail.`}
                </Text>
                {creatorEmail ? <Text style={styles.modalEmail}>{creatorEmail}</Text> : null}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.button, styles.modalCancel]} onPress={() => setRejectModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.modalConfirm]} onPress={handleRejectConfirmed}>
                    <Text style={styles.buttonText}>Confirmar rechazo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.validateButton]} onPress={handleValidate}>
              <Text style={styles.buttonText}>Validar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
              <Text style={styles.buttonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>

          

        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#f00" },

  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    width: 100,
  },
  value: {
    flex: 1,
  },
  descriptionBox: {
    backgroundColor: "#f3f3f3",
    padding: 8,
    borderRadius: 6,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  noImageText: {
    color: "#666",
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  validateButton: {
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: COLORS.negative,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewNoteWrap: {
    marginTop: 18,
    backgroundColor: "#fff7e6",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ffe9b8",
  },
  previewNote: {
    color: "#7a5a00",
    fontSize: 13,
    lineHeight: 18,
  },
  rejectTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary || "#222",
    marginBottom: 6,
  },
  rejectSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#444",
    marginBottom: 14,
  },
  modalEmail: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 12,
    fontWeight: "600",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalCancel: {
    backgroundColor: "#ccc",
    marginRight: 8,
  },
  modalConfirm: {
    backgroundColor: COLORS.negative,
  },
});
