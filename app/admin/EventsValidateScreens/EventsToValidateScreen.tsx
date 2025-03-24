// screens/admin/EventsToValidateScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getAllEventsToValidate } from "@/utils/validationEventHelpers";
import { EventToValidate } from "@/interfaces/EventToValidateProps";

// Importa tus estilos globales si deseas
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function EventsToValidateScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventToValidate[]>([]);

  useEffect(() => {
    const data = getAllEventsToValidate();
    setEvents(data);
  }, []);

  // Botón “Verificar” -> navega a ValidateEventScreen
  const handleVerify = (id: number) => {
    router.push(`/admin/EventsValidateScreens/ValidateEventScreen?id=${id}`);
  };

  // Renderizamos cada evento como una “card”
  const renderItem = ({ item }: { item: EventToValidate }) => (
    <View style={styles.cardContainer}>
      {/* Puedes mostrar la info en distintos Texts */}
      <Text style={styles.eventDate}>
        <Text style={styles.label}>Fecha del evento: </Text>
        {item.eventDate}
      </Text>

      <Text style={styles.creationDate}>
        <Text style={styles.label}>Fecha de creación: </Text>
        {item.creationDate}
      </Text>

      <Text style={styles.titleText}>
        <Text style={styles.label}>Nombre del evento: </Text>
        {item.title}
      </Text>

      <Text style={styles.typeText}>
        <Text style={styles.label}>Género: </Text>
        {item.type}
      </Text>

      <Text style={styles.ownerText}>
        <Text style={styles.label}>Propietario: </Text>
        {item.ownerUser}
      </Text>

      {/* Botón para verificar */}
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={() => handleVerify(item.id)}
      >
        <Text style={styles.verifyButtonText}>Verificar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.screenTitle}>Eventos a validar:</Text>

        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, // Ej. "#F5F5F5"
  },
  content: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: FONT_SIZES.subTitle, // 18-20
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },

  // CARD
  cardContainer: {
    backgroundColor: COLORS.cardBg, // Ej. "#fff"
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,

    // Sombras suaves (opcional)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  label: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  eventDate: {
    marginBottom: 4,
    color: COLORS.textSecondary,
  },
  creationDate: {
    marginBottom: 4,
    color: COLORS.textSecondary,
  },
  titleText: {
    marginBottom: 4,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  typeText: {
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  ownerText: {
    marginBottom: 8,
    color: COLORS.textPrimary,
  },

  verifyButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.alternative, // Ej. un color morado
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verifyButtonText: {
    color: COLORS.cardBg, // blanco
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
});
