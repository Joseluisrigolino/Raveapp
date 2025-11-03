// src/screens/admin/EventsValidateScreens/EventsToValidateScreen.tsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { mediaApi } from "@/app/apis/mediaApi";
import { getSafeImageSource } from "@/utils/image";

import { fetchEvents, fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";
import { getProfile, getUsuarioById } from "@/app/auth/userHelpers";
import { EventItem } from "@/interfaces/EventItem";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function EventsToValidateScreen() {
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

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
        // Cargar mapa de géneros para poder mostrar varios por evento
        try {
          const gen = await fetchGenres();
          const map = new Map<number, string>(gen.map((g: ApiGenero) => [g.cdGenero, g.dsGenero]));
          setGenreMap(map);
        } catch {}
  const data = await fetchEvents(0); // ahora pedimos Estado = 0
        // Asegurar que sólo guardamos eventos con estado 0 (por aprobar)
        // y que además tengan imagen para mostrarse en esta vista.
        const filteredByState = Array.isArray(data)
          ? data.filter((ev: any) => {
              // Preferir cdEstado cuando esté disponible (raw API), si no usar estado normalizado
              const isCdEstadoZero = ev?.cdEstado === 0 || String(ev?.cdEstado) === "0";
              const isEstadoZero = ev?.estado === 0 || String(ev?.estado) === "0";
              // Aceptamos cualquier evento con estado 0.
              return isCdEstadoZero || isEstadoZero;
            })
          : [];
        const withImages = filteredByState.filter((ev: any) =>
          typeof ev?.imageUrl === "string" && ev.imageUrl.trim().length > 0
        );

        // Enriquecer con datos reales del propietario (nombre y correo) buscando por email o id
        const emailCache = new Map<string, any>();
        const idCache = new Map<string, any>();
        const enriched = await Promise.all(
          withImages.map(async (ev: any) => {
            const raw: any = ev;
            const fallbackName = raw.ownerName ?? raw.owner?.name ?? raw.propietario?.nombre ?? raw.ownerDisplayName ?? null;
            const fallbackEmail = raw.ownerEmail ?? raw.owner?.email ?? raw.propietario?.correo ?? raw.email ?? null;
            const idUsuario = raw.ownerId ?? raw.propietario?.idUsuario ?? raw.usuario?.idUsuario ?? null;

            let profile: any = null;
            // Primero intentamos por email si lo tenemos, suele ser más directo
            if (fallbackEmail) {
              const key = String(fallbackEmail).toLowerCase();
              if (emailCache.has(key)) {
                profile = emailCache.get(key);
              } else {
                try {
                  profile = await getProfile(key);
                  if (profile) emailCache.set(key, profile);
                } catch {}
              }
            }
            // Si no hay email o falló, probamos por ID de usuario
            if (!profile && idUsuario) {
              const key = String(idUsuario);
              if (idCache.has(key)) {
                profile = idCache.get(key);
              } else {
                try {
                  profile = await getUsuarioById(key);
                  if (profile) idCache.set(key, profile);
                } catch {}
              }
            }

            if (profile) {
              return {
                ...ev,
                ownerName: profile.nombre ? `${profile.nombre} ${profile.apellido ?? ""}`.trim() : fallbackName ?? "N/D",
                ownerEmail: profile.correo ?? fallbackEmail ?? undefined,
                ownerId: profile.idUsuario ?? idUsuario ?? undefined,
              } as EventItem;
            }
            return ev as EventItem;
          })
        );

        // Prefetch owner avatars and enrich events
        try {
          const uniqueOwnerIds = Array.from(
            new Set(
              enriched
                .map((e: any) => e.ownerId)
                .filter((id: any) => typeof id === "string" || typeof id === "number")
                .map((id: any) => String(id))
            )
          );
          const avatarMap = new Map<string, string>();
          await Promise.all(
            uniqueOwnerIds.map(async (id) => {
              try {
                const url = await mediaApi.getFirstImage(id);
                if (typeof url === "string" && url.trim().length > 0) {
                  avatarMap.set(id, url);
                }
              } catch {}
            })
          );

          const enrichedWithAvatars = enriched.map((e: any) => {
            const id = e.ownerId ? String(e.ownerId) : "";
            const ownerAvatarUrl = id ? avatarMap.get(id) || "" : "";
            return { ...e, ownerAvatarUrl } as EventItem & { ownerAvatarUrl?: string };
          });
          setEvents(enrichedWithAvatars);
        } catch {
          setEvents(enriched);
        }
      } catch (e) {
        console.error("Error al cargar eventos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Helper: genera el texto de géneros a partir de los códigos (si están) o del type simple
  const getGenresText = (ev: EventItem): string => {
    const raw: any = ev as any;
    const codes: number[] = Array.isArray(raw?.genero) ? raw.genero : [];
    if (codes.length && genreMap.size) {
      const names = codes
        .map((c) => genreMap.get(Number(c)) || null)
        .filter((n): n is string => Boolean(n));
      if (names.length) return names.join(", ");
    }
    // fallback al type normalizado (un solo género)
    return ev.type || "Otros";
  };

  const filtered = events.filter((ev) => {
    const q = searchText.toLowerCase();
    const raw: any = ev as any;
    const ownerName = raw.ownerName ?? raw.owner?.name ?? raw.propietario?.nombre ?? raw.ownerDisplayName ?? "";
    const ownerEmail = raw.ownerEmail ?? raw.owner?.email ?? raw.propietario?.correo ?? raw.email ?? "";
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.address.toLowerCase().includes(q) ||
      String(ownerName).toLowerCase().includes(q) ||
      String(ownerEmail).toLowerCase().includes(q)
    );
  });

  const handleVerify = (id: string) => {
    nav.push(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.VALIDATE, params: { id } });
  };

  const renderItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => handleVerify(item.id)}>
      <Image
        source={getSafeImageSource(item.imageUrl || PLACEHOLDER_IMAGE)}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.metaRow}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <View style={styles.genreChip}>
            <MaterialCommunityIcons name="music" size={14} color={COLORS.textSecondary} />
            <Text style={styles.genreChipText} numberOfLines={1}>{getGenresText(item)}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        {(() => {
          const raw: any = item as any;
          const ownerName = raw.ownerName ?? raw.owner?.name ?? raw.propietario?.nombre ?? raw.ownerDisplayName ?? "N/D";
          const ownerEmail = raw.ownerEmail ?? raw.owner?.email ?? raw.propietario?.correo ?? raw.email ?? null;
          return (
            <View style={styles.ownerRow}>
              {(item as any).ownerAvatarUrl ? (
                <Image
                  source={getSafeImageSource((item as any).ownerAvatarUrl)}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account-outline" size={18} color={COLORS.textPrimary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName} numberOfLines={1}>{ownerName}</Text>
                {ownerEmail ? (
                  <Text style={styles.ownerEmail} numberOfLines={1}>{ownerEmail}</Text>
                ) : null}
              </View>
            </View>
          );
        })()}

        <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item.id)} activeOpacity={0.85}>
          <Text style={styles.verifyBtnText}>Verificar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />

  <TabMenuComponent tabs={tabs} />

  <View style={styles.content}>
          <SearchBarComponent
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar eventos..."
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
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  titleScreen: {
    fontFamily: FONTS.titleBold,
  fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    marginBottom: 12,
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
  label: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  labelEmail: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 2,
    marginLeft: 0,
  },
  bold: {
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
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
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderInput,
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
});
