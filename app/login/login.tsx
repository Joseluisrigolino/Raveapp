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

      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      // TODO: Implementar OAuth con Google
      Alert.alert("Aviso", "Inicio de sesión con Google no implementado aún.");
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
        <View style={[styles.container, { backgroundColor: globalStyles.COLORS.backgroundLight }]}>
          <View style={styles.card}>
            <TitlePers text="Bienvenido a RaveApp" />
            <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

            <TextInput
              mode="flat"
              label="Correo"
              placeholder="email@ejemplo.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              right={<TextInput.Icon icon="email-outline" color="#6b7280" />}
              theme={{
                colors: {
                  primary: globalStyles.COLORS.primary,
                  background: styles.input.backgroundColor,
                  text: "#111827",
                  placeholder: "#6b7280",
                },
              }}
            />

            <TextInput
              mode="flat"
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={secure ? "eye" : "eye-off"}
                  color="#6b7280"
                  onPress={() => setSecure((s) => !s)}
                  forceTextInputFocus={false}
                />
              }
              theme={{
                colors: {
                  primary: globalStyles.COLORS.primary,
                  background: styles.input.backgroundColor,
                  text: "#111827",
                  placeholder: "#6b7280",
                },
              }}
            />

            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              icon="google"
              contentStyle={styles.googleButtonContent}
              style={styles.googleButton}
              labelStyle={{ color: "#111827", fontWeight: "700" }}
              disabled={submitting}
            >
              Ingresar con Google
            </Button>

            <Button
              mode="contained"
              onPress={handleLogin}
              contentStyle={styles.buttonContent}
              style={styles.loginButton}
              labelStyle={{ fontWeight: "700", color: "#ffffff" }}
              disabled={!canSubmit}
              loading={submitting}
            >
              Ingresar
            </Button>

            <View style={styles.linksRow}>
              <Text variant="bodySmall" style={styles.linkText}>
                <Link href={ROUTES.LOGIN.REGISTER} style={{ color: globalStyles.COLORS.primary }}>
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
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    marginHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 12,
  },
  input: {
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    height: 56,
    paddingHorizontal: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 2,
  },
  googleButton: {
    borderRadius: 25,
    borderColor: "#d1d5db",
    marginBottom: 12,
    height: 50,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleButtonContent: { height: 50 },
  loginButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    backgroundColor: globalStyles.COLORS.primary,
    // sombra
    shadowColor: globalStyles.COLORS.primary,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContent: { height: 50 },
  linksRow: { marginTop: 12, alignItems: "center" },
  linkText: { color: globalStyles.COLORS.primary },
});
