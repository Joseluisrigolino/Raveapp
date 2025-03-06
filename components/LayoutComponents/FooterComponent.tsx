import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

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

      {/* Botón “Noticias + Artistas” (usamos newspaper-variant-multiple como un icono “combinado”) */}
      <IconButton
        icon="newspaper-variant-multiple" 
        size={24}
        iconColor="white"
        // Ajusta la ruta al destino real que combine ambas secciones
        onPress={() => router.push("/main/NewsScreens/NewsScreen")}
      />

      {/* Nuevo botón con ícono de ticket */}
      <IconButton
        icon="ticket"
        size={24}
        iconColor="white"
        // Ajusta la ruta a donde quieras llevar para tickets
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
    backgroundColor: "#000000",
    width: "100%",
    height: 55,
    marginTop: 10,
  },
});
