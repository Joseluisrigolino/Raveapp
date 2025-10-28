// src/components/layout/Footer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { ROUTES } from "../../routes";
import * as nav from "@/utils/navigation";
import { useAuth } from "@/context/AuthContext";
import { mediaApi } from "@/utils/mediaApi";
import { getProfile } from "@/utils/auth/userHelpers";
import { apiClient } from "@/utils/apiConfig";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  // Consumir el contexto de autenticación. Tipamos con `any` para mantener
  // compatibilidad con el shape existente, pero preferimos usar los helpers
  // `hasRole`/`hasAnyRole` expuestos desde `AuthContext`.
  const { user, logout, hasRole, hasAnyRole } = useAuth() as any;

  // Ahora simplificamos los checks de roles reutilizando helpers del contexto.
  const isAdmin = hasRole("admin");
  const isOwner = hasAnyRole(["owner", "admin"]);

  // Colores de iconos/labels
  const inactiveColor = "#4B5563"; // gris más oscuro
  const activeColor = COLORS.textPrimary; // casi negro

  // Helpers de matching por ruta (prefijos)
  const startsWith = (p: string) => pathname?.startsWith(p);
  // Home activo para cualquier pantalla de eventos excepto la de crear
  const isActiveHome = !isAdmin && (startsWith("/main/eventos")) && !startsWith(ROUTES.MAIN.EVENTS.CREATE);
  // Noticias también activa cuando se navega por pantallas de artistas (usuario)
  const isActiveNewsUser = !isAdmin && (startsWith("/main/noticias") || startsWith("/main/artistas"));
  // Tickets activo también cuando se está en "Eventos favoritos"
  const isActiveTickets = !isAdmin && (startsWith("/main/tickets") || startsWith(ROUTES.MAIN.EVENTS.FAV));
  // Crear activo también cuando se está en "Fiestas recurrentes" (owner no-admin)
  const isActiveCreate = !isAdmin && (startsWith(ROUTES.MAIN.EVENTS.CREATE) || startsWith(ROUTES.OWNER.PARTYS));

  const isActiveAdminEventos = isAdmin && (startsWith("/admin/EventsValidateScreens"));
  // En admin, marcar Noticias como activa también cuando se está en pantallas de artistas-admin
  const isActiveAdminArtists = isAdmin && (startsWith("/admin/artistas-admin"));
  const isActiveAdminNews = isAdmin && (startsWith("/admin/NewsScreens") || isActiveAdminArtists);

  // ===== Avatar
  const randomProfileImage = useMemo(
    () => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/200`,
    []
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string>(
    randomProfileImage
  );

  useEffect(() => {
    if (!user?.username) return;
    (async () => {
      try {
        const u = await getProfile(user.username);
        const data: any = await mediaApi.getByEntidad(u.idUsuario);
        const m = data?.media?.[0];
        let img = m?.url ?? m?.imagen ?? "";
        if (img && m?.imagen && !/^https?:\/\//.test(img)) {
          img = `${apiClient.defaults.baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
        }
        setProfileImageUrl(img || randomProfileImage);
      } catch {
        setProfileImageUrl(randomProfileImage);
      }
    })();
  }, [user]);

  // ===== Rutas barra inferior
  const handleHomePress = () => nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
  const handleNewsPress = () =>
    nav.replace(
    router,
    isAdmin
      ? ROUTES.ADMIN.NEWS.MANAGE
      : ROUTES.MAIN.NEWS.LIST
    );
  const handleTicketsPress = () =>
    nav.replace(router, ROUTES.MAIN.TICKETS.MENU);
  const handleEventManagementPress = () =>
    nav.replace(
    router,
    isAdmin
      ? ROUTES.ADMIN.EVENTS_VALIDATE.LIST
      : ROUTES.MAIN.EVENTS.CREATE
    );
  const handleArtistsPress = () => nav.replace(router, ROUTES.ADMIN.ARTISTS.MANAGE);
  const handleTycPress = () => nav.replace(router, ROUTES.ADMIN.TYC);

  // ===== Bottom Sheet (3/4 de pantalla)
  const [open, setOpen] = useState(false);
  const windowH = Dimensions.get("window").height;
  const SHEET_H = Math.round(windowH * 0.75);

  // Animaciones mejoradas
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;

  const animateOpen = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        speed: 10,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const animateClose = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_H,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 0.85,
        speed: 8,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start(() => cb && cb());
  };
  const openSheet = () => {
    setOpen(true);
    requestAnimationFrame(animateOpen);
  };
  const closeSheet = () => animateClose(() => setOpen(false));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => {
        const dy = Math.max(0, g.dy);
        translateY.setValue(dy);
        const p = Math.min(1, dy / SHEET_H);
        backdropOpacity.setValue(1 - p * 0.9);
      },
      onPanResponderRelease: (_e, g) => {
        const shouldClose = g.vy > 0.35 || g.dy > SHEET_H * 0.15;
        if (shouldClose) closeSheet();
        else animateOpen();
      },
    })
  ).current;

  type RouteArg = string | { pathname: string; params?: Record<string, any> };
  const go = (route: any) => {
    closeSheet();
    setTimeout(() => nav.push(router, route), 140);
  };
  const doLogout = async () => {
    closeSheet();
    try {
      if (typeof logout === "function") await logout();
    } finally {
      nav.replace(router, ROUTES.LOGIN.LOGIN);
    }
  };

  // ---- Ítems
  // Mostrar siempre "Mis eventos favoritos" y "Mi perfil"
  const userItems = [
    { icon: "heart-outline", label: "Mis eventos favoritos", route: { pathname: ROUTES.MAIN.EVENTS.FAV } },
    { icon: "ticket-outline", label: "Mis entradas", route: { pathname: ROUTES.MAIN.TICKETS.MENU } },
    { icon: "account-outline", label: "Mi perfil", route: { pathname: ROUTES.MAIN.USER.PROFILE_EDIT } },
  ];
  const ownerItems = [
  { icon: "calendar-plus", label: "Mis eventos creados", route: { pathname: ROUTES.OWNER.MANAGE_EVENTS } },
  { icon: "repeat", label: "Mis fiestas recurrentes", route: { pathname: ROUTES.OWNER.PARTYS } },
  { icon: "chart-bar", label: "Entradas vendidas", route: { pathname: ROUTES.OWNER.TICKET_SOLD } },
  ];

  return (
    <>
      {/* ===== Footer ===== */}
      <View style={styles.container}>
        {isAdmin ? (
          <>
            <TouchableOpacity style={styles.tabItem} onPress={handleEventManagementPress}>
              <MaterialCommunityIcons name={isActiveAdminEventos ? "clipboard-edit" : "clipboard-edit-outline"} size={24} color={isActiveAdminEventos ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveAdminEventos && styles.tabLabelActive]}>Eventos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleNewsPress}>
              <MaterialCommunityIcons name={isActiveAdminNews ? "newspaper-variant" : "newspaper-variant-outline"} size={24} color={isActiveAdminNews ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveAdminNews && styles.tabLabelActive]}>Noticias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleArtistsPress}>
              <MaterialCommunityIcons name={isActiveAdminArtists ? "music" : "music-note-outline"} size={24} color={isActiveAdminArtists ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveAdminArtists && styles.tabLabelActive]}>Artistas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={openSheet}>
              <View style={styles.avatarWrapper}>
                <Image source={getSafeImageSource(profileImageUrl)} style={styles.avatar} />
              </View>
              <Text style={styles.tabLabel}>Perfil</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.tabItem} onPress={handleHomePress}>
              <MaterialCommunityIcons name={isActiveHome ? "home" : "home-outline"} size={24} color={isActiveHome ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveHome && styles.tabLabelActive]}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleNewsPress}>
              <MaterialCommunityIcons name={isActiveNewsUser ? "newspaper-variant" : "newspaper-variant-outline"} size={24} color={isActiveNewsUser ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveNewsUser && styles.tabLabelActive]}>Noticias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleTicketsPress}>
              <MaterialCommunityIcons name={isActiveTickets ? "ticket" : "ticket-outline"} size={24} color={isActiveTickets ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveTickets && styles.tabLabelActive]}>Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleEventManagementPress}>
              <MaterialCommunityIcons name={isActiveCreate ? "calendar-plus" : "calendar-plus-outline"} size={24} color={isActiveCreate ? activeColor : inactiveColor} />
              <Text style={[styles.tabLabel, isActiveCreate && styles.tabLabelActive]}>Crear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={openSheet}>
              <View style={styles.avatarWrapper}>
                <Image source={getSafeImageSource(profileImageUrl)} style={styles.avatar} />
              </View>
              <Text style={styles.tabLabel}>Perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ===== Modal + Bottom Sheet ===== */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
          {/* Fondo difuminado con blur */}
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}> 
            <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          </Animated.View>

          <Animated.View
            style={[styles.sheet, { height: SHEET_H, transform: [{ translateY }] }]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.handleBar} {...panResponder.panHandlers}>
                <View style={styles.handle} />
                <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Sheet title */}
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetTitleText}>{isAdmin ? "Panel de Administración" : "Mi Perfil"}</Text>
                </View>

                {/* Header: avatar + nombre, avatar animado */}
                <View style={styles.profileHeader}>
                  <Animated.Image
                    source={getSafeImageSource(profileImageUrl)}
                    style={[styles.bigAvatar, { transform: [{ scale: avatarScale }] }]}
                  />
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={styles.nameText}>
                      {user?.displayName || user?.name || user?.username || "Usuario"}
                    </Text>
                    <Text style={styles.usernameText}>{isAdmin ? "Administrador" : "Usuario"}</Text>
                  </View>
                </View>

                {/* Usuario (oculto para admin) */}
                {!isAdmin && (
                  <>
                    <Text style={styles.sectionTitle}>Usuario</Text>
                    <View style={styles.menuSection}>
                      {userItems.map((it) => (
                        <TouchableOpacity key={it.label} style={styles.menuItem} onPress={() => go(it.route)}>
                          <MaterialCommunityIcons name={it.icon as any} size={22} color={COLORS.textPrimary} />
                          <Text style={styles.menuText}>{it.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Opciones de organizador (oculto para admin) */}
                    {isOwner && (
                      <>
                        <Text style={styles.sectionTitle}>Organizador</Text>
                        <View style={styles.menuSection}>
                          {ownerItems.map((it) => (
                            <TouchableOpacity key={it.label} style={styles.menuItem} onPress={() => go(it.route)}>
                              <MaterialCommunityIcons name={it.icon as any} size={22} color={COLORS.textPrimary} />
                              <Text style={styles.menuText}>{it.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}

                {/* Perfil (visible también para admin) */}
                {isAdmin && (
                  <>
                    <View style={styles.menuSection}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.MAIN.USER.PROFILE_EDIT })}>
                        <MaterialCommunityIcons name="account-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Mi Perfil</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Opciones de administración (solo para admin) */}
                {isAdmin && (
                  <>
                    <Text style={styles.sectionTitle}>Administración</Text>
                    <View style={styles.menuSection}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.REPORT_SALES.MENU })}>
                        <MaterialCommunityIcons name="chart-bar" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Ver reporte de ventas</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST })}>
                        <MaterialCommunityIcons name="check-circle-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Validar Eventos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.ARTISTS.NEW })}>
                        <MaterialCommunityIcons name="account-plus-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Crear Artista</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.ARTISTS.MANAGE })}>
                        <MaterialCommunityIcons name="account-edit-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Editar Artistas</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.NEWS.CREATE })}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Crear Noticia</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.NEWS.MANAGE })}>
                        <MaterialCommunityIcons name="square-edit-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Editar Noticias</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.TYC })}>
                        <MaterialCommunityIcons name="file-document-edit-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>Actualizar TyC</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={doLogout}>
                  <MaterialCommunityIcons name="logout" size={22} color={COLORS.negative} />
                  <Text style={[styles.menuText, { color: COLORS.negative }]}>Cerrar sesión</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderTopColor: COLORS.borderInput,
    borderTopWidth: 2,
    width: "100%",
    height: 60,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    marginTop: 2,
    color: "#4B5563",
    fontFamily: FONTS.subTitleMedium,
    fontSize: 12,
  },
  tabLabelActive: {
    color: COLORS.textPrimary,
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    // Si usas expo-blur, podrías agregar un BlurView aquí
  },
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 22,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  sheetTitleRow: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 8,
  },
  sheetTitleText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.titleBold,
    fontSize: 18,
  },
  handleBar: { paddingTop: 10, paddingBottom: 8, alignItems: "center", justifyContent: "center" },
  handle: { width: 54, height: 6, borderRadius: 3, backgroundColor: "#E2E8F0" },
  closeBtn: { position: "absolute", right: 16, top: 10, padding: 8 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f3",
    backgroundColor: "#fafcff",
    shadowColor: "#e0e0e0",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bigAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#f3f3f3",
  },
  nameText: { color: COLORS.textPrimary, fontFamily: FONTS.titleBold, fontSize: 18 },
  usernameText: { color: COLORS.textSecondary, fontFamily: FONTS.subTitleMedium, fontSize: 13, marginTop: 2 },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 14,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 7,
  },
  menuSection: { paddingVertical: 2 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: "#f8f9fa",
  },
  menuText: { marginLeft: 14, color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.subTitleMedium },
  logoutBtn: {
    marginBottom: 18,
    backgroundColor: "#fff0f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.negative,
  },
});
