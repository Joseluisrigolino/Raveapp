import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
// Importa el hook useRouter
import { useRouter } from "expo-router";

export default function Footer() {
  // Obtienes el router para navegar
  const router = useRouter();

  return (
    <View style={styles.container}>
      <IconButton
        icon="home"
        size={24}
        iconColor="white"
        // Llama a router.push("MenuScreen") o "/MenuScreen"
        onPress={() => router.push("/main/MenuScreen")}
      />
      <IconButton
        icon="newspaper"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/NewsScreen")}
      />
      <IconButton
        icon="calendar-plus"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/CreateEventScreen")}
      />
      <IconButton
        icon="account"
        size={24}
        iconColor="white"
        onPress={() => router.push("/main/UserProfileEditScreen")}
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
