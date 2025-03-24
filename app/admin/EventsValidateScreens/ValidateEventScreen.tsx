// screens/admin/ValidateEventScreen.tsx
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
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getEventToValidateById } from "@/utils/events/validationEventHelpers";
import { EventToValidate } from "@/interfaces/EventToValidateProps";

export default function ValidateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [eventData, setEventData] = useState<EventToValidate | null>(null);

  // Motivo de rechazo
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (id) {
      const found = getEventToValidateById(Number(id));
      if (found) {
        setEventData(found);
      }
    }
  }, [id]);

  const handleValidate = () => {
    console.log("Evento validado, ID:", id);
    // Lógica real para marcar como validado
  };

  const handleReject = () => {
    console.log("Evento rechazado, ID:", id, " Motivo:", rejectReason);
    // Lógica real para rechazar (enviar mail, etc.)
  };

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Evento no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.mainTitle}>Evento a validar:</Text>

          {/* Nombre, usuario, fecha de creación */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nombre del evento:</Text>
            <Text>{eventData.title}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Usuario creador:</Text>
            <Text>{eventData.ownerUser}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha de creación:</Text>
            <Text>{eventData.creationDate}</Text>
          </View>

          {/* Género, isAfter, isLGBT */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Género:</Text>
            <Text>{eventData.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>¿Es after?:</Text>
            <Text>{eventData.isAfter ? "Sí" : "No"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>¿Es LGBT?:</Text>
            <Text>{eventData.isLGBT ? "Sí" : "No"}</Text>
          </View>

          {/* Descripción */}
          <Text style={[styles.label, { marginTop: 12 }]}>Descripción del evento:</Text>
          <View style={styles.descriptionBox}>
            <Text>{eventData.description}</Text>
          </View>

          {/* Imagen */}
          <Text style={[styles.label, { marginTop: 12 }]}>Imagen del evento:</Text>
          <View style={styles.imagePlaceholder}>
            {eventData.imageUrl ? (
              <Image
                source={{ uri: eventData.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text>IMG</Text>
            )}
          </View>

          {/* Entradas (opcional) */}
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={styles.label}>Fecha del evento:</Text>
            <Text>{eventData.eventDate}</Text>
          </View>
          {/* Podrías agregar info de precio, cupo, etc. */}

          {/* Contenido embebido: SoundCloud, YouTube */}
          <Text style={[styles.label, { marginTop: 12 }]}>Contenido embebido:</Text>
          {eventData.soundcloudUrl ? (
            <View style={styles.embeddedBox}>
              <Text>SoundCloud: {eventData.soundcloudUrl}</Text>
              {/* En un proyecto real, usarías un <WebView> o un SoundCloudComponent */}
            </View>
          ) : null}
          {eventData.youtubeUrl ? (
            <View style={styles.embeddedBox}>
              <Text>Video de YouTube: {eventData.youtubeUrl}</Text>
              {/* En un proyecto real, usarías un <WebView> o similar */}
            </View>
          ) : null}

          {/* Motivo de rechazo */}
          <Text style={[styles.label, { marginTop: 12 }]}>
            En caso de rechazar el evento, completar el motivo de rechazo:
          </Text>
          <TextInput
            style={styles.rejectInput}
            multiline
            placeholder="El motivo de rechazo se le enviará por mail al creador del evento"
            value={rejectReason}
            onChangeText={setRejectReason}
          />

          {/* Botones Validar / Rechazar */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.validateButton]} onPress={handleValidate}>
              <Text style={styles.buttonText}>Validar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
              <Text style={styles.buttonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  content: { flex: 1 },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    marginRight: 6,
  },
  descriptionBox: {
    backgroundColor: "#F3F3F3",
    minHeight: 80,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  embeddedBox: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectInput: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 60,
    marginBottom: 12,
    padding: 8,
    textAlignVertical: "top",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: 120,
    alignItems: "center",
  },
  validateButton: {
    backgroundColor: "#4caf50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
