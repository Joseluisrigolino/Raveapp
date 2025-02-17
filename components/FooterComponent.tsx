import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { IconButton } from "react-native-paper";

const Footer = () => {
  return (
    <View style={styles.container}>
      <IconButton
        icon="home"
        size={24}
        iconColor="white"
        onPress={() => console.log("Inicio presionado")}
      />
      <IconButton
        icon="newspaper"
        size={24}
        iconColor="white"
        onPress={() => console.log("Noticas presionado")}
      />
      <IconButton
        icon="calendar-plus"
        size={24}
        iconColor="white"
        onPress={() => console.log("Agregar evento presionado")}
      />
      <IconButton
        icon="account"
        size={24}
        iconColor="white"
        onPress={() => console.log("Ir a perfil presionado")}
      />
    </View>
  );
};

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

export default Footer;
