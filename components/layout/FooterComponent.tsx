import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

// Hook o contexto de autenticación que devuelve el user con su rol
import { useAuth } from "@/context/AuthContext";

// Estilos globales
import globalStyles, { COLORS } from "@/styles/globalStyles";

export default function Footer() {
  const router = useRouter();
  const { user } = useAuth(); // user?.role === "admin" | "owner" | "user", etc.

  const isAdmin = user?.role === "admin";

  // Handler para noticias
  const handleNewsPress = () => {
    if (isAdmin) {
      router.push("/admin/NewsScreens/ManageNewScreen");
    } else {
      router.push("/main/NewsScreens/NewsScreen");
    }
  };

  // Handler para artistas (solo admin)
  const handleArtistsPress = () => {
    router.push("/admin/ArtistScreens/ManageArtistsScreen");
  };

  // Handler para tickets (solo visible a user normal, no admin)
  const handleTicketsPress = () => {
    router.push("/main/TicketsScreens/TicketPurchasedMenu");
  };

  // Botón para gestión/creación de eventos
  const handleEventManagementPress = () => {
    if (isAdmin) {
      // Admin => Validar / gestionar eventos
      router.push("/admin/EventsValidateScreens/EventsToValidateScreen");
    } else {
      // Usuario normal => crear evento
      router.push("/main/EventsScreens/CreateEventScreen");
    }
  };

  const handleHomePress = () => {
    router.push("/main/EventsScreens/MenuScreen");
  };

  const handleProfilePress = () => {
    router.push("/main/UserScreens/UserProfileEditScreen");
  };

  return (
    <View style={styles.container}>
      {/* 
        Si NO es admin => muestra Home
        Si es admin => lo ocultamos (o lo dejas si prefieres).
      */}
      {!isAdmin && (
        <IconButton
          icon="home"
          size={24}
          iconColor="white"
          onPress={handleHomePress}
        />
      )}

      {/* Botón Noticias */}
      <IconButton
        icon="newspaper-variant-multiple"
        size={24}
        iconColor="white"
        onPress={handleNewsPress}
      />

      {/* 
        Si NO es admin => muestra Tickets
        Si es admin => oculto (opcional).
      */}
      {!isAdmin && (
        <IconButton
          icon="ticket"
          size={24}
          iconColor="white"
          onPress={handleTicketsPress}
        />
      )}

      {/**
       * Para admin usamos "calendar-edit" (calendario con lápiz)
       * Para usuario normal "calendar-plus".
       */}
      <IconButton
        icon={isAdmin ? "calendar-edit" : "calendar-plus"}
        size={24}
        iconColor="white"
        onPress={handleEventManagementPress}
      />

      {/* 
        Si es admin, botón para “Artistas”.
      */}
      {isAdmin && (
        <IconButton
          icon="account-music"
          size={24}
          iconColor="white"
          onPress={handleArtistsPress}
        />
      )}

      {/* Botón Perfil (con lapicito => "account-edit") */}
      <IconButton
        icon="account-edit"
        size={24}
        iconColor="white"
        onPress={handleProfilePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: globalStyles.COLORS.secondary, // color de fondo
    width: "100%",
    height: 55,
    marginTop: 10,
  },
});
