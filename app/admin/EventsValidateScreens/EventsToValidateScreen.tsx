// src/screens/admin/EventsValidateScreens/EventsToValidateScreen.tsx

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";

import { fetchEvents } from "@/utils/events/eventApi";
import { EventItem } from "@/interfaces/EventItem";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function EventsToValidateScreen() {
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEvents(0); // ahora pedimos Estado = 0
        setEvents(data);
      } catch (e) {
        console.error("Error al cargar eventos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = events.filter((ev) => {
    const q = searchText.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) || ev.address.toLowerCase().includes(q)
    );
  });

  const handleVerify = (id: string) => {
    nav.push(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.VALIDATE, params: { id } });
  };

  const renderItem = ({ item }: { item: EventItem }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Fecha(s): </Text>
          {item.date}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Género(s): </Text>
          {item.type}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Propietario: </Text>
          {(item as any).ownerName ?? "N/D"}
        </Text>
        {(item as any).ownerEmail && <Text style={styles.label}>{(item as any).ownerEmail}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleVerify(item.id)}
        >
          <Text style={styles.buttonText}>VERIFICAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.content}>
          <Text style={styles.titleScreen}>Eventos a validar:</Text>

          <TextInput
            placeholder="Buscar por nombre del evento o propietario"
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleScreen: {
    fontFamily: FONTS.titleBold,
  fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  search: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: COLORS.borderInput,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  bold: {
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
  },
  button: {
    marginTop: 10,
    backgroundColor: COLORS.alternative,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
});
