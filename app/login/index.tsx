// screens/Index.tsx (ejemplo de LoginScreen)
import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";

import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/common/TitleComponent";
import globalStyles from "@/styles/globalStyles";

// <-- Importamos useAuth para acceder al login global
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { login } = useAuth();   // <-- aquí obtenemos la función login del contexto

  // Estados locales
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Handler de login
  const handleLogin = () => {
    const success = login(username, password);
    if (success) {
      // Si es válido, vamos a la pantalla principal
      router.push("/main/EventsScreens/MenuScreen");
    } else {
      Alert.alert("Error", "Usuario o contraseña incorrectos.");
    }
  };

  return (
    <View style={styles.container}>
      <TitlePers text="Bienvenido a Raveapp" />

      <InputField
        label="Usuario"
        value={username}
        onChangeText={setUsername}
      />

      <InputField
        label="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <ButtonInApp
        icon=""
        text="Ingresar con Cuenta"
        width="75%"
        height={50}
        onPress={handleLogin}
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

      <View style={styles.registerText}>
        <Text variant="labelLarge">
          <Link href="/main/EventsScreens/MenuScreen">
            Ingresar como invitado
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
    backgroundColor: globalStyles.COLORS.backgroundLight,
    padding: 16,
  },
  registerText: {
    color: globalStyles.COLORS.textPrimary,
    marginTop: 10,
    alignItems: "center",
  },
});
