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
} from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

import globalStyles from "@/styles/globalStyles";
import { apiClient, login as apiLogin } from "@/utils/apiConfig";

export default function RegisterUserScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (![firstName, lastName, birthDate, dni, email, password].every(Boolean)) {
      Alert.alert("Error", "Completa todos los campos obligatorios (*) antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      // 1) Traer token “root”
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      // 2) Payload completo
      const payload = {
        domicilio: {
          localidad: { nombre: "", codigo: "" },
          municipio: { nombre: "", codigo: "" },
          provincia: { nombre: "", codigo: "" },
          direccion: "",
          latitud: 0,
          longitud: 0,
        },
        nombre: firstName.trim(),
        apellido: lastName.trim(),
        correo: email.trim(),
        cbu: "",
        dni: dni.trim(),
        telefono: phone.trim(),
        nombreFantasia: "",
        bio: "",
        password,
        socials: {
          idSocial: "",
          mdInstagram: "",
          mdSpotify: "",
          mdSoundcloud: "",
        },
        dtNacimiento: new Date(birthDate).toISOString(),
      };

      // 3) Llamada a CreateUsuario
      await apiClient.post("/v1/Usuario/CreateUsuario", payload, {
        headers: { "Content-Type": "application/json" },
      });

      Alert.alert("¡Éxito!", "Tu cuenta se ha registrado correctamente.");
      router.replace("/login/Index");
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineMedium" style={styles.title}>
            Regístrate en RaveApp
          </Text>

          <TextInput
            mode="outlined"
            label="Nombre*"
            placeholder="Juan"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Apellido*"
            placeholder="Pérez"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Fecha de nacimiento*"
            placeholder="YYYY-MM-DD"
            value={birthDate}
            onChangeText={setBirthDate}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="DNI*"
            placeholder="12345678"
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Correo*"
            placeholder="email@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Celular"
            placeholder="+54 9 11 1234-5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Contraseña*"
            placeholder="●●●●●●●●"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            Crear cuenta
          </Button>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    color: globalStyles.COLORS.textPrimary,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 8,
    borderRadius: 24,
    alignSelf: "center",
    width: "80%",
  },
  buttonContent: {
    height: 48,
  },
});
