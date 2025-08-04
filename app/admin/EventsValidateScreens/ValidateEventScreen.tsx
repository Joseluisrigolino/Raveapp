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
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import { fetchEvents } from "@/utils/events/eventApi";
import { EventItem } from "@/interfaces/EventItem";

export default function ValidateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");

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
          setEventData(found);
        }
      } catch (err) {
        console.error("Error al cargar evento para validar:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleValidate = () => {
    console.log("Evento validado, ID:", id);
    // TODO: hacer PUT a la API para cambiar Estado a 1
    router.back();
  };

  const handleReject = () => {
    console.log("Evento rechazado, ID:", id, "Motivo:", rejectReason);
    // TODO: lógica real de rechazo (enviar mail, etc.)
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={styles.validateButton.backgroundColor} />
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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.mainTitle}>Evento a validar</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>{eventData.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{eventData.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Horario:</Text>
            <Text style={styles.value}>{eventData.timeRange}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{eventData.address}</Text>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Descripción:</Text>
          <View style={styles.descriptionBox}>
            <Text>{eventData.description}</Text>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Imagen:</Text>
          <View style={styles.imageContainer}>
            {eventData.imageUrl ? (
              <Image
                source={{ uri: eventData.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.noImageText}>Sin imagen</Text>
            )}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Motivo de rechazo (opcional):
          </Text>
          <TextInput
            style={styles.rejectInput}
            multiline
            placeholder="Escribí el motivo..."
            value={rejectReason}
            onChangeText={setRejectReason}
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.validateButton]}
              onPress={handleValidate}
            >
              <Text style={styles.buttonText}>Validar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
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
    backgroundColor: "#4caf50",
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: "#f44336",
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
