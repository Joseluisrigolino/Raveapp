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
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
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

  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const path = usePathname();
  const currentScreen = path?.split("/").pop() || "";

  const tabs = [
    {
      label: "EVENTOS A VALIDAR",
      route: ROUTES.ADMIN.EVENTS_VALIDATE.LIST,
      isActive: currentScreen === ROUTES.ADMIN.EVENTS_VALIDATE.LIST.split("/").pop(),
    },
    {
      label: "EVENTOS APROBADOS",
      route: ROUTES.MAIN.EVENTS.MENU,
      isActive: currentScreen === ROUTES.MAIN.EVENTS.MENU.split("/").pop(),
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchEvents(0); // ahora pedimos Estado = 0
        // Asegurar que sólo guardamos eventos con estado 0 (por aprobar).
        // No filtramos por imagen aquí para no ocultar resultados; la UI puede mostrar
        // un placeholder o marcar que falta imagen.
        const filteredByState = Array.isArray(data)
          ? data.filter((ev: any) => {
              // Preferir cdEstado cuando esté disponible (raw API), si no usar estado normalizado
              const isCdEstadoZero = ev?.cdEstado === 0 || String(ev?.cdEstado) === "0";
              const isEstadoZero = ev?.estado === 0 || String(ev?.estado) === "0";
              // Aceptamos cualquier evento con estado 0; no filtramos por imagen aquí.
              return isCdEstadoZero || isEstadoZero;
            })
          : [];
        setEvents(filteredByState);
      } catch (e) {
        console.error("Error al cargar eventos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

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
        {}
        {(() => {
          // Resolver nombre y email desde distintos shapes posibles del backend
          const raw: any = item as any;
          const ownerName = raw.ownerName ?? raw.owner?.name ?? raw.propietario?.nombre ?? raw.ownerDisplayName ?? "N/D";
          const ownerEmail = raw.ownerEmail ?? raw.owner?.email ?? raw.propietario?.correo ?? raw.email ?? null;
          return (
            <Text style={styles.label}>
              <Text style={styles.bold}>Propietario: </Text>
              {ownerName}
              {ownerEmail ? ` — ${ownerEmail}` : ""}
            </Text>
          );
        })()}

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

  <TabMenuComponent tabs={tabs} />

  <View style={styles.content}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => nav.push(router, { pathname: ROUTES.MAIN.EVENTS.CREATE })}
          >
            <Text style={styles.createButtonText}>+ Crear evento</Text>
          </TouchableOpacity>

          <Text style={styles.titleScreen}>Eventos a validar:</Text>

          <TextInput
            placeholder="Buscar por nombre del evento o propietario"
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : filtered.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary }}>
                No hay eventos para aprobar en este momento.
              </Text>
            </View>
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
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
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
    backgroundColor: COLORS.primary,
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
