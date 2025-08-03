// app/login/index.tsx

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import TitlePers from "@/components/common/TitleComponent";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const u = await login(username.trim(), password);
    if (!u) {
      return Alert.alert("Error", "Usuario o contraseña incorrectos.");
    }
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

  const handleGoogleLogin = () => {
    Alert.alert("Google", "Aquí iría el flujo de login con Google.");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TitlePers text="Bienvenido a RaveApp" />

        <TextInput
          mode="outlined"
          label="Correo"
          placeholder="email@ejemplo.com"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          theme={{
            colors: {
              primary: globalStyles.COLORS.primary,
              background: "#fff",
              text: globalStyles.COLORS.textPrimary,
              placeholder: globalStyles.COLORS.textSecondary,
            },
          }}
        />

        <TextInput
          mode="outlined"
          label="Contraseña"
          placeholder="••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          theme={{
            colors: {
              primary: globalStyles.COLORS.primary,
              background: "#fff",
              text: globalStyles.COLORS.textPrimary,
              placeholder: globalStyles.COLORS.textSecondary,
            },
          }}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          contentStyle={styles.buttonContent}
          style={styles.loginButton}
          labelStyle={{ fontWeight: "bold" }}
        >
          Ingresar con Cuenta
        </Button>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>o</Text>
          <View style={styles.line} />
        </View>

        <TouchableWithoutFeedback onPress={handleGoogleLogin}>
          <View style={styles.googleButton}>
            <FontAwesome name="google" size={24} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.linksRow}>
          <Text variant="bodySmall" style={styles.linkText}>
            <Link href="/login/RegisterUserScreen">
              ¿No tenés cuenta? Registrate
            </Link>
          </Text>
        </View>

        <View style={styles.linksRow}>
          <Text variant="bodySmall" style={styles.linkText}>
            <Link href="/main/EventsScreens/MenuScreen">
              Entrar como invitado
            </Link>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalStyles.COLORS.backgroundLight,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  loginButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
  },
  buttonContent: {
    height: 50,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: globalStyles.COLORS.borderInput,
  },
  orText: {
    marginHorizontal: 8,
    color: globalStyles.COLORS.textSecondary,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  googleButtonText: {
    marginLeft: 8,
    fontSize: globalStyles.FONT_SIZES.button,
    color: "#444",
    fontWeight: "600",
  },
  linksRow: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: globalStyles.COLORS.primary,
  },
});
