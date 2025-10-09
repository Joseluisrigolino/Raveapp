// src/components/layout/Footer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
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
import { useRouter } from "expo-router";
import { ROUTES } from "../../routes";
import * as nav from "@/utils/navigation";
import { useAuth } from "@/context/AuthContext";
import { mediaApi } from "@/utils/mediaApi";
import { getProfile } from "@/utils/auth/userHelpers";
import { apiClient } from "@/utils/apiConfig";
import { COLORS } from "@/styles/globalStyles";

export default function Footer() {
  const router = useRouter();
  // Consumir el contexto de autenticación. Tipamos con `any` para mantener
  // compatibilidad con el shape existente, pero preferimos usar los helpers
  // `hasRole`/`hasAnyRole` expuestos desde `AuthContext`.
  const { user, logout, hasRole, hasAnyRole } = useAuth() as any;

  // Ahora simplificamos los checks de roles reutilizando helpers del contexto.
  const isAdmin = hasRole("admin");
  const isOwner = hasAnyRole(["owner", "admin"]);

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
    { icon: "heart", label: "Mis eventos favoritos", route: { pathname: ROUTES.MAIN.EVENTS.FAV } },
    { icon: "ticket-confirmation", label: "Mis entradas", route: { pathname: ROUTES.MAIN.TICKETS.MENU } },
    { icon: "account", label: "Mi perfil", route: { pathname: ROUTES.MAIN.USER.PROFILE_EDIT } },
  ];
  const ownerItems = [
  { icon: "calendar-multiselect", label: "Mis eventos creados", route: { pathname: ROUTES.OWNER.MANAGE_EVENTS } },
  { icon: "repeat", label: "Mis fiestas recurrentes", route: { pathname: ROUTES.OWNER.PARTYS } },
  { icon: "ticket-percent", label: "Entradas vendidas", route: { pathname: ROUTES.OWNER.TICKET_SOLD } },
  ];

  return (
    <>
      {/* ===== Footer ===== */}
      <View style={styles.container}>
        {/* Footer: para admin cambiamos 'home' por 'calendar-edit' y el botón del medio por 'artists' */}
        {isAdmin ? (
          <IconButton
            icon="calendar-edit"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleEventManagementPress}
          />
        ) : (
          <IconButton
            icon="home"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleHomePress}
          />
        )}
        <IconButton
          icon="newspaper-variant-multiple"
          size={24}
          iconColor={COLORS.textPrimary}
          onPress={handleNewsPress}
        />
        {isAdmin ? (
          <IconButton
            icon="account-music"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleArtistsPress}
          />
        ) : (
          <IconButton
            icon="ticket"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleTicketsPress}
          />
        )}
        {!isAdmin && (
          <IconButton
            icon="calendar-plus"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleEventManagementPress}
          />
        )}
        <TouchableOpacity onPress={openSheet} style={styles.avatarWrapper}>
          <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
        </TouchableOpacity>
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
            {...panResponder.panHandlers}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.handleBar}>
                <View style={styles.handle} />
                <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Header: avatar + nombre, avatar animado */}
              <View style={styles.profileHeader}>
                <Animated.Image
                  source={{ uri: profileImageUrl }}
                  style={[styles.bigAvatar, { transform: [{ scale: avatarScale }] }]}
                />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={styles.nameText}>
                    {user?.displayName || user?.name || user?.username || "Usuario"}
                  </Text>
                  <Text style={styles.usernameText}>
                    {user?.email ? user.email : ""}
                  </Text>
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
                  <Text style={styles.sectionTitle}>Perfil</Text>
                  <View style={styles.menuSection}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.MAIN.USER.PROFILE_EDIT })}>
                      <MaterialCommunityIcons name="account" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Mi perfil</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Opciones de administración (solo para admin) */}
              {isAdmin && (
                <>
                  <Text style={styles.sectionTitle}>Administración</Text>
                  <View style={styles.menuSection}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST })}>
                      <MaterialCommunityIcons name="calendar-check" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Validar eventos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.ARTISTS.NEW })}>
                      <MaterialCommunityIcons name="account-plus" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Crear artista</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.ARTISTS.MANAGE })}>
                      <MaterialCommunityIcons name="account-music" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Editar artistas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.NEWS.CREATE })}>
                      <MaterialCommunityIcons name="newspaper-plus" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Crear noticia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.NEWS.MANAGE })}>
                      <MaterialCommunityIcons name="newspaper-variant-multiple" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Editar noticias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => go({ pathname: ROUTES.ADMIN.TYC })}>
                      <MaterialCommunityIcons name="file-document-edit" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.menuText}>Actualizar TyC</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={doLogout}>
                <MaterialCommunityIcons name="logout" size={22} color={COLORS.negative} />
                <Text style={[styles.menuText, { color: COLORS.negative }]}>Cerrar sesión</Text>
              </TouchableOpacity>
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
  nameText: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 18 },
  usernameText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  menuText: { marginLeft: 14, color: COLORS.textPrimary, fontSize: 16, fontWeight: "500" },
  logoutBtn: {
    marginBottom: 18,
    backgroundColor: "#fff0f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.negative,
  },
});
