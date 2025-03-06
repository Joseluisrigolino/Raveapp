import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Link } from "expo-router";

import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/TitleComponent";

// Importa tus estilos globales
import globalStyles from "@/styles/globalStyles";

export default function Index() {
  return (
    <View style={styles.container}>
      <TitlePers text="Bienvenido a Raveapp" />
      <InputField label="Correo Electronico" />
      <InputField label="Contraseña" secureTextEntry />

      <ButtonInApp
        icon=""
        text="Ingresar con Cuenta"
        width="75%"
        height={50}
        onPress={() => console.log("Ingresar con Cuenta Normal")}
      />
      <ButtonInApp
        icon="google"
        text="Ingresar con Google"
        width="75%"
        height={50}
        onPress={() => console.log("Ingresar con Google")}
      />

      <View style={styles.registerText}>
        <Text variant="labelLarge">
          <Link href="/login/RegisterUserScreen">
            ¿Aun no tenes cuenta?, registrate aqui
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    // Aplicamos un color de fondo claro desde globalStyles
    backgroundColor: globalStyles.COLORS.backgroundLight,
    padding: 16, // Margen interno para separar contenido
  },
  registerText: {
    // color de texto principal
    color: globalStyles.COLORS.textPrimary,
    marginTop: 10,
    alignItems: "center",
  },
});
