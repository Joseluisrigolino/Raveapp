import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { mediaApi } from "@/utils/mediaApi";
import { getProfile } from "@/utils/auth/userHelpers";
import { apiClient } from "@/utils/apiConfig";
import { COLORS } from "@/styles/globalStyles";

export default function Footer() {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = Array.isArray(user?.roles)
    ? user?.roles.includes("admin")
    : user?.roles === "admin";

  const randomProfileImage = useMemo(
    () => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/200`,
    []
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string>(randomProfileImage);

  useEffect(() => {
    if (!user?.username) return;
    (async () => {
      try {
        const u = await getProfile(user.username);
        const data: any = await mediaApi.getByEntidad(u.idUsuario);
        const m = data.media?.[0];
        let img = m?.url ?? m?.imagen ?? "";
        if (img && m?.imagen && !/^https?:\/\//.test(img)) {
          img = `${apiClient.defaults.baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
        }
        setProfileImageUrl(img || randomProfileImage);
      } catch (err) {
        console.warn("[Footer] no pude cargar media perfil:", err);
        setProfileImageUrl(randomProfileImage);
      }
    })();
  }, [user]);

  // Rutas
  const handleHomePress = () => router.replace("/main/EventsScreens/MenuScreen");
  const handleNewsPress = () =>
    router.replace(
      isAdmin
        ? "/admin/NewsScreens/ManageNewScreen"
        : "/main/NewsScreens/NewsScreen"
    );
  const handleTicketsPress = () =>
    router.replace("/main/TicketsScreens/TicketPurchasedMenu");
  const handleEventManagementPress = () =>
    router.replace(
      isAdmin
        ? "/admin/EventsValidateScreens/EventsToValidateScreen"
        : "/main/EventsScreens/CreateEventScreen"
    );
  const handleArtistsPress = () =>
    router.replace("/admin/ArtistScreens/ManageArtistsScreen");
  const handleProfilePress = () =>
    router.replace("/main/UserScreens/UserProfileEditScreen");

  return (
    <View style={styles.container}>
      {/* Home (usuarios comunes) */}
      {!isAdmin && (
        <IconButton
          icon="home"
          size={24}
          iconColor={COLORS.textPrimary}
          onPress={handleHomePress}
        />
      )}

      {/* Noticias (todos los roles) */}
      <IconButton
        icon="newspaper-variant-multiple"
        size={24}
        iconColor={COLORS.textPrimary}
        onPress={handleNewsPress}
      />

      {/* Tickets (usuarios comunes) */}
      {!isAdmin && (
        <IconButton
          icon="ticket"
          size={24}
          iconColor={COLORS.textPrimary}
          onPress={handleTicketsPress}
        />
      )}

      {/* Gestión de eventos */}
      <IconButton
        icon={isAdmin ? "calendar-edit" : "calendar-plus"}
        size={24}
        iconColor={COLORS.textPrimary}
        onPress={handleEventManagementPress}
      />

      {/* Artistas (solo admin) */}
      {isAdmin && (
        <IconButton
          icon="account-music"
          size={24}
          iconColor={COLORS.textPrimary}
          onPress={handleArtistsPress}
        />
      )}

      {/* Perfil (todos los roles) */}
      <TouchableOpacity
        onPress={handleProfilePress}
        style={styles.avatarWrapper}
      >
        <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
      </TouchableOpacity>
    </View>
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
  avatar: {
    width: "100%",
    height: "100%",
  },
});
