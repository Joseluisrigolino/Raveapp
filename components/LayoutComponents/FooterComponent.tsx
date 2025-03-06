import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

// Importa tus estilos globales
import globalStyles from "@/styles/globalStyles";

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Botón HOME */}
      <IconButton
        icon="home"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/EventsScreens/MenuScreen")}
      />

      {/* Botón “Noticias + Artistas” */}
      <IconButton
        icon="newspaper-variant-multiple"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/NewsScreens/NewsScreen")}
      />

      {/* Botón con ícono de ticket */}
      <IconButton
        icon="ticket"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/TicketsScreens/TicketPurchasedMenu")}
      />

      {/* Botón para crear evento */}
      <IconButton
        icon="calendar-plus"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/EventsScreens/CreateEventScreen")}
      />

      {/* Botón Perfil */}
      <IconButton
        icon="account"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/UserScreens/UserProfileEditScreen")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // Usamos el color secundario (negro) para el fondo del footer
    backgroundColor: globalStyles.COLORS.secondary,
    width: "100%",
    height: 55,
    marginTop: 10,
  },
});
