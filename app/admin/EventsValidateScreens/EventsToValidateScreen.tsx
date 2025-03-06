// screens/admin/EventsToValidateScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import { getAllEventsToValidate } from "@/utils/validationEventHelpers";
import { EventToValidate } from "@/interfaces/EventToValidateProps";

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

  const renderItem = ({ item }: { item: EventToValidate }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.eventDateCell]}>{item.eventDate}</Text>
      <Text style={[styles.cell, styles.creationDateCell]}>
        {item.creationDate}
      </Text>
      <Text style={[styles.cell, styles.titleCell]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.cell, styles.typeCell]}>{item.type}</Text>
      <Text style={[styles.cell, styles.ownerCell]}>{item.ownerUser}</Text>

      <View style={[styles.cell, styles.actionCell]}>
        <Text
          style={styles.verifyButton}
          onPress={() => handleVerify(item.id)}
        >
          Verificar
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.title}>Eventos a validar:</Text>

        {/* Cabecera de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.eventDateCell]}>
            Fecha del evento
          </Text>
          <Text style={[styles.headerCell, styles.creationDateCell]}>
            Fecha de creación
          </Text>
          <Text style={[styles.headerCell, styles.titleCell]}>
            Nombre del evento
          </Text>
          <Text style={[styles.headerCell, styles.typeCell]}>
            Género
          </Text>
          <Text style={[styles.headerCell, styles.ownerCell]}>
            Propietario
          </Text>
          <Text style={[styles.headerCell, styles.actionCell]}>
            Acción
          </Text>
        </View>

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
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  cell: {
    fontSize: 14,
  },
  eventDateCell: { flex: 2 },
  creationDateCell: { flex: 2 },
  titleCell: { flex: 3 },
  typeCell: { flex: 2 },
  ownerCell: { flex: 2 },
  actionCell: {
    flex: 2,
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  verifyButton: {
    backgroundColor: "#9c27b0",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
    fontWeight: "bold",
  },
});
