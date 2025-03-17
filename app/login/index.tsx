import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";

import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/TitleComponent";
import globalStyles from "@/styles/globalStyles";

// Importamos nuestro helper
import { validateUser } from "@/utils/authHelpers";

export default function Index() {
  const router = useRouter();

  // Estados locales para usuario y password
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Handler para el botón de login
  const handleLogin = () => {
    // Validamos contra el helper
    const isValid = validateUser(username, password);
    if (isValid) {
      // Si es admin/admin, vamos a MenuScreen
      router.push("/main/EventsScreens/MenuScreen");
    } else {
      Alert.alert("Error", "Usuario o contraseña incorrectos.");
    }
  };

  return (
    <View style={styles.container}>
      <TitlePers text="Bienvenido a Raveapp" />

      {/* Input usuario */}
      <InputField
        label="Usuario"
        value={username}
        onChangeText={setUsername}
      />

      {/* Input contraseña */}
      <InputField
        label="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Botón de login con cuenta */}
      <ButtonInApp
        icon=""
        text="Ingresar con Cuenta"
        width="75%"
        height={50}
        onPress={handleLogin}
      />

      {/* Botón de login con Google (ejemplo) */}
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

      <View style={styles.registerText}>
        <Text variant="labelLarge">
          <Link href="/main/EventsScreens/MenuScreen">Ingresar como invitado</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: globalStyles.COLORS.backgroundLight,
    padding: 16,
  },
  registerText: {
    color: globalStyles.COLORS.textPrimary,
    marginTop: 10,
    alignItems: "center",
  },
});
