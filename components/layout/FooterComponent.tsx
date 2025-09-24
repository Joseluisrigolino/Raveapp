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
  SafeAreaView,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
} from "react-native";
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
  const { user, logout } = useAuth() as any;

  // ---- Roles (robusto: soporta role y roles[])
  const isAdmin =
    (Array.isArray(user?.roles) && user.roles.includes("admin")) ||
    user?.role === "admin";
  const isOwner =
    isAdmin ||
    (Array.isArray(user?.roles) && user.roles.includes("owner")) ||
    user?.role === "owner";

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

  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateOpen = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };
  const animateClose = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_H,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
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
      nav.replace(router, { pathname: ROUTES.MAIN.EVENTS.MENU });
    }
  };

  // ---- Ítems
  const userItems = [
  { icon: "heart", label: "Mis eventos favoritos", route: { pathname: ROUTES.MAIN.EVENTS.FAV } },
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
        {!isAdmin && (
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
        {!isAdmin && (
          <IconButton
            icon="ticket"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleTicketsPress}
          />
        )}
        <IconButton
          icon={isAdmin ? "calendar-edit" : "calendar-plus"}
          size={24}
          iconColor={COLORS.textPrimary}
          onPress={handleEventManagementPress}
        />
        {isAdmin && (
          <IconButton
            icon="account-music"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleArtistsPress}
          />
        )}
        {isAdmin && (
          <IconButton
            icon="file-document"
            size={24}
            iconColor={COLORS.textPrimary}
            onPress={handleTycPress}
          />
        )}
        <TouchableOpacity onPress={openSheet} style={styles.avatarWrapper}>
          <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {/* ===== Modal + Bottom Sheet ===== */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
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

              {/* Header: avatar + nombre */}
              <View style={styles.profileHeader}>
                <Image source={{ uri: profileImageUrl }} style={styles.bigAvatar} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.nameText}>
                    {user?.displayName || user?.name || user?.username || "Usuario"}
                  </Text>
                </View>
              </View>

              {/* Usuario */}
              <Text style={styles.sectionTitle}>Usuario</Text>
              <View style={styles.menuSection}>
                {userItems.map((it) => (
                  <TouchableOpacity key={it.label} style={styles.menuItem} onPress={() => go(it.route)}>
                    <MaterialCommunityIcons name={it.icon as any} size={20} color={COLORS.textPrimary} />
                    <Text style={styles.menuText}>{it.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Opciones de organizador */}
              {isOwner && (
                <>
                  <Text style={styles.sectionTitle}>Opciones de organizador</Text>
                  <View style={styles.menuSection}>
                    {ownerItems.map((it) => (
                      <TouchableOpacity key={it.label} style={styles.menuItem} onPress={() => go(it.route)}>
                        <MaterialCommunityIcons name={it.icon as any} size={20} color={COLORS.textPrimary} />
                        <Text style={styles.menuText}>{it.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.menuItem, { marginBottom: 16 }]} onPress={doLogout}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.negative} />
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -2 },
    elevation: 18,
  },
  handleBar: { paddingTop: 8, paddingBottom: 6, alignItems: "center", justifyContent: "center" },
  handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: "#E2E8F0" },
  closeBtn: { position: "absolute", right: 12, top: 8, padding: 6 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  bigAvatar: { width: 48, height: 48, borderRadius: 24 },
  nameText: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 16 },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: "uppercase",
  },
  menuSection: { paddingVertical: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  menuText: { marginLeft: 12, color: COLORS.textPrimary, fontSize: 15 },
});
