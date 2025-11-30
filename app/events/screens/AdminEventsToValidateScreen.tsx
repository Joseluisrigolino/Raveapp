// src/screens/admin/EventsValidateScreens/AdminEventsToValidateScreen.tsx

// imports
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { getSafeImageSource } from "@/utils/image";

import {
  fetchEvents,
  fetchGenres,
  ApiGenero,
} from "@/app/events/apis/eventApi";
import { EventItem } from "@/interfaces/EventItem";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { mediaApi } from "@/app/apis/mediaApi";
import { getUsuarioById, getProfile } from "@/app/auth/userApi";

// helpers
// Comentario: imagen por defecto si no hay imagen del evento
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

// Comentario: convierte los códigos de géneros en texto legible, o usa el tipo básico
function getGenresText(ev: EventItem, genreMap: Map<number, string>): string {
  const raw: any = ev as any;
  const codes: number[] = Array.isArray(raw?.genero) ? raw.genero : [];
  if (codes.length && genreMap.size) {
    const names = codes
      .map((c) => genreMap.get(Number(c)) || null)
      .filter((n): n is string => Boolean(n));
    if (names.length) return names.join(", ");
  }
  return ev.type || "Otros";
}

// componente principal
export default function AdminEventsToValidateScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const path = usePathname();

  // Comentario: estados simples para datos, carga, búsqueda y géneros
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());
  const [ownerAvatars, setOwnerAvatars] = useState<Record<string, string>>({});
  const [ownerEmails, setOwnerEmails] = useState<Record<string, string>>({});
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  // Comentario: tabs según rutas (UI en español se mantiene)
  const currentScreen = path?.split("/").pop() || "";
  const tabs = [
    {
      label: "EVENTOS A VALIDAR",
      route: ROUTES.ADMIN.EVENTS_VALIDATE.LIST,
      isActive:
        currentScreen === ROUTES.ADMIN.EVENTS_VALIDATE.LIST.split("/").pop(),
    },
    {
      label: "EVENTOS APROBADOS",
      route: ROUTES.MAIN.EVENTS.MENU,
      isActive: currentScreen === ROUTES.MAIN.EVENTS.MENU.split("/").pop(),
    },
  ];

  // Comentario: cargar géneros y eventos con estado 0 (por aprobar)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        try {
          const gen = await fetchGenres();
          if (!mounted) return;
          const map = new Map<number, string>(
            gen.map((g: ApiGenero) => [g.cdGenero, g.dsGenero])
          );
          setGenreMap(map);
        } catch {}

        const data = await fetchEvents(0);
        if (!mounted) return;
        const onlyStateZero = Array.isArray(data)
          ? data.filter((ev: any) => {
              const isCdEstadoZero =
                ev?.cdEstado === 0 || String(ev?.cdEstado) === "0";
              const isEstadoZero =
                ev?.estado === 0 || String(ev?.estado) === "0";
              return isCdEstadoZero || isEstadoZero;
            })
          : [];
        const withImages = onlyStateZero.filter(
          (ev: any) =>
            typeof ev?.imageUrl === "string" && ev.imageUrl.trim().length > 0
        );
        setEvents(withImages as EventItem[]);
      } catch (e) {
        console.error("Error al cargar eventos:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // Enriquecer info de propietarios: avatar + email (si falta)
  useEffect(() => {
    (async () => {
      try {
        if (!Array.isArray(events) || events.length === 0) return;
        const ids = Array.from(
          new Set(
            events
              .map((ev: any) => String(
                ev?.ownerId || ev?.propietario?.idUsuario || ev?.__raw?.propietario?.idUsuario || ev?.__raw?.usuario?.idUsuario || ""
              ).trim())
              .filter(Boolean)
          )
        );
        if (ids.length === 0) return;

        // Avatares
        const avatarPairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const url = await mediaApi.getFirstImage(id);
              return url ? ([id, url] as [string, string]) : null;
            } catch { return null; }
          })
        );
        const avatarMap: Record<string, string> = { ...ownerAvatars };
        for (const p of avatarPairs) { if (p) avatarMap[p[0]] = p[1]; }
        if (Object.keys(avatarMap).length) setOwnerAvatars(avatarMap);

        // Emails y nombres faltantes
        const emailMap: Record<string, string> = { ...ownerEmails };
        const nameMap: Record<string, string> = { ...ownerNames };
        await Promise.all(ids.map(async (id) => {
          // si ya tenemos email cacheado, saltar
          if (emailMap[id] && nameMap[id]) return;
          // buscar en los eventos por si alguno ya lo trae
          const existing = (events as any[]).find((e) => String((e as any)?.ownerId || "") === id);
          const fromEventEmail = existing && ((existing as any).ownerEmail || (existing as any).__raw?.propietario?.correo || (existing as any).__raw?.usuario?.correo);
          const fromEventName = existing && ((existing as any).ownerName || (existing as any).__raw?.propietario?.nombre || (existing as any).__raw?.usuario?.nombre);
          if (fromEventEmail) emailMap[id] = String(fromEventEmail);
          if (fromEventName) nameMap[id] = String(fromEventName);
          if (emailMap[id] && nameMap[id]) return;
          try {
            const profile = await getUsuarioById(id);
            if (profile?.correo) emailMap[id] = String(profile.correo);
            if (profile?.nombre || profile?.apellido) nameMap[id] = `${String(profile?.nombre || "").trim()} ${String(profile?.apellido || "").trim()}`.trim();
          } catch {
            // fallback opcional: si tuviéramos un mail aproximado podríamos usar getProfile(mail)
          }
        }));
        if (Object.keys(emailMap).length) setOwnerEmails(emailMap);
        if (Object.keys(nameMap).length) setOwnerNames(nameMap);
      } catch {}
    })();
  }, [events]);

  // Comentario: filtrar por texto en título, dirección o datos básicos del propietario
  const filteredEvents = useMemo(() => {
    const q = searchText.toLowerCase();
    return events.filter((ev: any) => {
      const ownerName =
        ev?.ownerName ||
        ev?.owner?.name ||
        ev?.propietario?.nombre ||
        ev?.ownerDisplayName ||
        "";
      const ownerEmail =
        ev?.ownerEmail ||
        ev?.owner?.email ||
        ev?.propietario?.correo ||
        ev?.email ||
        "";
      return (
        ev.title?.toLowerCase?.().includes(q) ||
        ev.address?.toLowerCase?.().includes(q) ||
        String(ownerName).toLowerCase().includes(q) ||
        String(ownerEmail).toLowerCase().includes(q)
      );
    });
  }, [events, searchText]);

  // Comentario: navegar a la pantalla de validación con el id del evento
  const handleVerify = useCallback(
    (id: string) => {
      nav.push(router, {
        pathname: ROUTES.ADMIN.EVENTS_VALIDATE.VALIDATE,
        params: { id },
      });
    },
    [router]
  );

  // Comentario: render de una tarjeta simple de evento
  const renderItem = ({ item }: { item: EventItem }) => {
    const raw: any = item as any;
    const ownerIdStr = String(
      raw.ownerId || raw.owner?.id || raw.propietario?.idUsuario || raw.__raw?.propietario?.idUsuario || raw.__raw?.usuario?.idUsuario || ""
    ).trim();
    const ownerName =
      raw.ownerName ||
      raw.owner?.name ||
      raw.propietario?.nombre ||
      raw.__raw?.propietario?.nombre ||
      raw.__raw?.usuario?.nombre ||
      ownerNames[ownerIdStr] ||
      raw.ownerDisplayName ||
      "N/D";
    const ownerEmail =
      raw.ownerEmail ||
      raw.owner?.email ||
      raw.propietario?.correo ||
      raw.email ||
      (ownerIdStr ? ownerEmails[ownerIdStr] : null) ||
      null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => handleVerify(item.id)}
      >
        <Image
          source={getSafeImageSource(item.imageUrl || PLACEHOLDER_IMAGE)}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.genreChip}>
              <MaterialCommunityIcons
                name="music"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.genreChipText} numberOfLines={1}>
                {getGenresText(item, genreMap)}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.ownerRow}>
            {ownerIdStr && ownerAvatars[ownerIdStr] ? (
              <Image source={getSafeImageSource(ownerAvatars[ownerIdStr])} style={styles.ownerAvatar} />
            ) : (
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName} numberOfLines={1}>
                {ownerName}
              </Text>
              {ownerEmail ? (
                <Text style={styles.ownerEmail} numberOfLines={1}>
                  {ownerEmail}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => handleVerify(item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>Verificar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Comentario: layout básico con header, tabs, buscador, lista y footer
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />

        <View style={styles.content}>
          <SearchBarComponent
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar eventos..."
          />

          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={() => (
              loading ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : (
                <View style={styles.emptyWrapper}>
                  <Text style={styles.emptyText}>
                    No hay eventos para aprobar en este momento.
                  </Text>
                </View>
              )
            )}
          />
        </View>

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

// estilos al final
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    marginVertical: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
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
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  genreChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    maxWidth: 140,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  ownerName: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 14,
  },
  ownerEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  verifyBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  verifyBtnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
  },
  emptyWrapper: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
});
