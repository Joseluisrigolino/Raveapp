import React from "react";
import { View, Image, StyleSheet } from "react-native";

// Imagen del logo de la app usada en la pantalla de login
export default function LoginUserImageAppComponent() {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image
          source={require("../../../../../assets/images/raveapplogo/logo3.jpeg")}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 24, marginBottom: 12 },
  logoCircle: { width: 72, height: 72, borderRadius: 16, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoImage: { width: 72, height: 72, borderRadius: 16 },
});
