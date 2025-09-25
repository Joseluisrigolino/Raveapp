// src/screens/login/RegisterUserScreen.tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, useTheme, HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../routes";

import globalStyles from "@/styles/globalStyles";
import { apiClient, login as apiLogin } from "@/utils/apiConfig";

export default function RegisterUserScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    dni: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [securePass, setSecurePass] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

  const parseBirthDateToISO = (input: string) => {
    // Accept formats: YYYY-MM-DD or dd/mm/yyyy or dd-mm-yyyy
    if (!input) return new Date().toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(input).toISOString();
    const parts = input.includes("/") ? input.split("/") : input.split("-");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return new Date(`${y}-${m}-${d}`).toISOString();
    }
    return new Date(input).toISOString();
  };

  const validateForm = () => {
    const { firstName, lastName, birthDate, dni, email, password, confirmPassword } = form;
    if (![firstName, lastName, birthDate, dni, email, password].every(Boolean)) {
      Alert.alert("Error", "Completa todos los campos obligatorios (*) antes de continuar.");
      return false;
    }
    if (!isEmailValid(email)) {
      Alert.alert("Error", "Ingresa un correo válido.");
      return false;
    }
    if (!isPasswordValid(password)) {
      Alert.alert("Contraseña débil", "La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      const payload = {
        domicilio: {
          localidad: { nombre: "", codigo: "" },
          municipio: { nombre: "", codigo: "" },
          provincia: { nombre: "", codigo: "" },
          direccion: "",
          latitud: 0,
          longitud: 0,
        },
        nombre: form.firstName.trim(),
        apellido: form.lastName.trim(),
        correo: form.email.trim(),
        cbu: "",
        dni: form.dni.trim(),
        telefono: form.phone.trim(),
        nombreFantasia: "",
        bio: "",
        password: form.password,
        socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
        dtNacimiento: parseBirthDateToISO(form.birthDate),
      };

      await apiClient.post("/v1/Usuario/CreateUsuario", payload, {
        headers: { "Content-Type": "application/json" },
      });

      Alert.alert("¡Éxito!", "Tu cuenta se ha registrado correctamente.");
      nav.replace(router, ROUTES.LOGIN.LOGIN);
    } catch (err: any) {
      console.error("Error CreateUsuario:", err);
      if (err.response?.data?.errors) {
        const msgs = Object.entries(err.response.data.errors)
          .map(([field, arr]: any) => `${field}: ${(arr as string[]).join(", ")}`)
          .join("\n");
        Alert.alert("Validación", msgs);
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Button
                mode="outlined"
                onPress={async () => {
                  setLoading(true);
                  try {
                    // TODO: Implementar OAuth con Google para registro
                    Alert.alert("Aviso", "Registro con Google no implementado aún.");
                  } finally {
                    setLoading(false);
                  }
                }}
                icon="google"
                contentStyle={styles.googleButtonContent}
                style={styles.googleButtonTop}
                labelStyle={{ color: globalStyles.COLORS.primary, fontWeight: "700" }}
                disabled={loading}
              >
                Registrarse con Google
              </Button>

              <Text variant="headlineMedium" style={[styles.title, { color: globalStyles.COLORS.textPrimary }]}>
                Registrarse
              </Text>
              <Text style={styles.subtitle}>Completa tus datos para crear tu cuenta o regístrate con Google</Text>

              <TextInput
                mode="flat"
                label="Nombre*"
                placeholder="Juan"
                value={form.firstName}
                onChangeText={(t) => setField("firstName", t)}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Apellido*"
                placeholder="Pérez"
                value={form.lastName}
                onChangeText={(t) => setField("lastName", t)}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Fecha de nacimiento*"
                placeholder="dd/mm/aaaa o YYYY-MM-DD"
                value={form.birthDate}
                onChangeText={(t) => setField("birthDate", t)}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="DNI*"
                placeholder="12345678"
                value={form.dni}
                onChangeText={(t) => setField("dni", t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Correo*"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChangeText={(t) => setField("email", t)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={<TextInput.Icon icon="email-outline" color="#6b7280" />}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Celular"
                placeholder="(+54) 9 11 1234-5678"
                value={form.phone}
                onChangeText={(t) => setField("phone", t)}
                keyboardType="phone-pad"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Contraseña*"
                placeholder="●●●●●●●●"
                value={form.password}
                onChangeText={(t) => setField("password", t)}
                secureTextEntry={securePass}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={securePass ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setSecurePass((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <HelperText type="info" visible>
                La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.
              </HelperText>

              <TextInput
                mode="flat"
                label="Confirmar contraseña*"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChangeText={(t) => setField("confirmPassword", t)}
                secureTextEntry={secureConfirm}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={secureConfirm ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setSecureConfirm((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Registrarme
              </Button>

              <Text style={styles.smallText}>Al registrarte aceptas los términos y condiciones.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const COLORS = {
  primary: "#7c3aed", // morado vibrante
  inputBg: "#ffffff", // modo claro: inputs blancos
  cardBg: "#ffffff", // fondo tarjeta claro
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 18,
    color: "#6b7280",
  },
  button: {
    marginTop: 8,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
  googleButton: {
    borderRadius: 25,
    borderColor: "#d1d5db",
    marginBottom: 12,
    height: 50,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleButtonTop: {
    borderRadius: 10,
    borderColor: "#d1d5db",
    marginBottom: 18,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleButtonContent: { height: 50 },
  buttonContent: {
    height: 48,
    justifyContent: "center",
  },
  smallText: {
    textAlign: "center",
    marginTop: 12,
    color: "#6b7280",
    fontSize: 12,
  },

  /* Copiado desde login.tsx: estilos de inputs mejorados */
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

});
