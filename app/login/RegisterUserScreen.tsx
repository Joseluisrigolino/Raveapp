// src/screens/login/RegisterUserScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";

import globalStyles from "@/styles/globalStyles";
import { apiClient, login as apiLogin } from "@/utils/apiConfig";

export default function RegisterUserScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !birthDate || !dni || !email || !password) {
      Alert.alert("Error", "Completa todos los campos obligatorios (*) antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      // 1) Traer token “root”
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      // 2) Payload completo:
      const payload = {
        domicilio: {
          localidad: { nombre: "", codigo: "" },
          municipio: { nombre: "", codigo: "" },
          provincia: { nombre: "", codigo: "" },
          direccion: "",
          latitud: 0,
          longitud: 0,
        },
        nombre: firstName,
        apellido: lastName,
        correo: email,
        cbu: "",               // si es obligatorio, reemplaza por un campo o value válido
        dni,
        telefono: phone,
        nombreFantasia: "",    // idem
        bio: "",               // idem
        password,
        socials: {
          idSocial: "",
          mdInstagram: "",
          mdSpotify: "",
          mdSoundcloud: "",
        },
        // convertir "YYYY-MM-DD" a ISO
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
      // Si la API devuelve un objeto con errores de validación, lo mostramos:
      if (err.response?.data) {
        console.warn("Detalle de validación:", err.response.data);
        const msgs = Object.entries(err.response.data.errors || {})
          .map(([field, msgs]: any) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join("\n");
        Alert.alert("Error 400", msgs || "Datos inválidos");
      } else if (err.response?.status === 401) {
        Alert.alert("No autorizado", "Revisa tu configuración de API.");
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>
          Registrate en Raveapp
        </Text>

        <TextInput
          mode="outlined"
          label="Nombre*"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Apellido*"
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
          value={dni}
          onChangeText={setDni}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Correo*"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Celular"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Contraseña*"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Registrar cuenta
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalStyles.COLORS.backgroundLight,
  },
  content: {
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    color: globalStyles.COLORS.textPrimary,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 8,
    alignSelf: "center",
    width: "80%",
  },
  buttonContent: {
    height: 48,
  },
});
