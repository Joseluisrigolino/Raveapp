import { View, Image, StyleSheet } from "react-native";

import React from "react";


// Componente que muestra el logo de la app en la pantalla de login
export default function LoginUserImageAppComponent() {
  // Renderiza el logo dentro de un círculo estilizado
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image
          source={require("../../../../../assets/images/raveapplogo/logo3.png")}
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
