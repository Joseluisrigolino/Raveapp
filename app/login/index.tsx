import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";

import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/common/TitleComponent";
import globalStyles from "@/styles/globalStyles";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const u = await login(username, password);
    if (!u) {
      return Alert.alert("Error", "Usuario o contraseña incorrectos.");
    }

    // redirijo según rol:
    switch (u.role) {
      case "admin":
        router.replace("/admin/EventsValidateScreens/EventsToValidateScreen");
        break;
      case "owner":
        router.replace("/main/EventsScreens/CreateEventScreen");
        break;
      default:
        router.replace("/main/EventsScreens/MenuScreen");
    }
  };

  return (
    <View style={styles.container}>
      <TitlePers text="Bienvenido a Raveapp" />

      <InputField
        label="Correo"
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

      <View style={styles.linksRow}>
        <Text variant="labelLarge">
          <Link href="/login/RegisterUserScreen">
            ¿Aún no tenés cuenta? Registrate aquí
          </Link>
        </Text>
      </View>

      <View style={styles.linksRow}>
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
  linksRow: {
    marginTop: 10,
    alignItems: "center",
  },
});
