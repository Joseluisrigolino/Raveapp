// app/login/Login.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../routes";

import TitlePers from "@/components/common/TitleComponent";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && !submitting,
    [username, password, submitting]
  );

  const handleLogin = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const u = await login(username.trim(), password);

      if (!u) {
        Alert.alert("Error", "Usuario o contraseña incorrectos.");
        return;
      }

      // Redirige según rol (normalizamos a array)
      const roles = Array.isArray((u as any)?.roles)
        ? (u as any).roles
        : (u as any)?.roles
        ? [(u as any).roles]
        : [];

      if (roles.includes("admin")) {
        nav.replace(router, ROUTES.ADMIN.EVENTS_VALIDATE.LIST);
      } else if (roles.includes("owner")) {
        nav.replace(router, ROUTES.MAIN.EVENTS.CREATE);
      } else {
        nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
      }
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <TitlePers text="Bienvenido a RaveApp" />

          <TextInput
            mode="outlined"
            label="Correo"
            placeholder="email@ejemplo.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            right={
              <TextInput.Icon
                icon={secure ? "eye" : "eye-off"}
                onPress={() => setSecure((s) => !s)}
                forceTextInputFocus={false}
              />
            }
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
            disabled={!canSubmit}
            loading={submitting}
          >
            Ingresar con Cuenta
          </Button>

          <View style={styles.linksRow}>
            <Text variant="bodySmall" style={styles.linkText}>
              <Link href={ROUTES.LOGIN.REGISTER}>
                ¿No tenés cuenta? Registrate
              </Link>
            </Text>
          </View>

          <View style={styles.linksRow}>
            <Button
              mode="text"
              onPress={() => nav.replace(router, ROUTES.MAIN.EVENTS.MENU)}
              compact
              labelStyle={{ color: globalStyles.COLORS.primary, fontWeight: "600" }}
            >
              Entrar como invitado
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  input: { marginBottom: 16, backgroundColor: "#fff" },
  loginButton: { borderRadius: 25, height: 50, justifyContent: "center" },
  buttonContent: { height: 50 },
  linksRow: { marginTop: 16, alignItems: "center" },
  linkText: { color: globalStyles.COLORS.primary },
});
