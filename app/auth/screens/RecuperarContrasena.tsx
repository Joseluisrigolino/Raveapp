// app/login/RecuperarContrasena.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Text, TextInput, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { COLORS } from "@/styles/globalStyles";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import useSendRecoveryPass from "@/app/auth/services/user/useSendRecoveryPass";
import InfoTyc from "@/components/infoTyc";

// Comentarios en español: pantalla simple para recuperar contraseña

export default function RecoverPasswordScreen() {
  const router = useRouter();
  // estado del input
  const [email, setEmail] = useState("");
  // hook que maneja envío de recuperación
  const { sending, sendRecovery } = useSendRecoveryPass();

  // Comentario en español: envía el email de recuperación
  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    try {
      await sendRecovery(email.trim());

      // alerta con redirección al login
      Alert.alert(
        "Enlace enviado",
        "Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.",
        [
          {
            text: "OK",
            onPress: () => nav.replace(router, ROUTES.LOGIN.LOGIN),
          },
        ]
      );
    } catch (err) {
      console.error("send recovery error", err);
      Alert.alert(
        "Error",
        "No se pudo enviar el enlace de recuperación. Intenta de nuevo."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 64 })}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={120}
          contentContainerStyle={styles.container}
          style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}
          keyboardShouldPersistTaps="always"
        >
        {/* Header con logo y subtítulo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../../assets/images/raveapplogo/logo3.jpeg")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>RaveApp</Text>
          <Text style={styles.subtitle}>Tu pase al mejor ritmo</Text>
        </View>

        {/* volver atrás */}
        <Pressable style={styles.back} onPress={() => nav.back(router)}>
          <Icon name="arrow-back" size={22} color="#374151" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        {/* tarjeta principal */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.lockCircle}>
              <Icon name="lock" size={30} color="#6b7280" />
            </View>
          </View>

          <Text style={styles.heading}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.lead}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            mode="outlined"
            placeholder="tu@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            textColor="#0f172a"
            placeholderTextColor="#4b5563"
            outlineColor="#e6e9ef"
            activeOutlineColor="#0f172a"
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
          />

          <Button
            mode="contained"
            onPress={handleSend}
            contentStyle={styles.buttonContent}
            style={styles.button}
            labelStyle={{ fontWeight: "700", color: "#ffffff" }}
            disabled={sending}
            loading={sending}
          >
            Enviar Enlace
          </Button>

          <View style={styles.rowCenter}>
            <Text style={styles.smallText}>¿Recordaste tu contraseña? </Text>
            <Link href={ROUTES.LOGIN.LOGIN as any} style={styles.link}>
              Iniciar Sesión
            </Link>
          </View>
        </View>

        {/* términos (componente reutilizable) */}
        <InfoTyc />
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 24, marginBottom: 16 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  logo: { width: 72, height: 72 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#6b7280", marginTop: 4 },
  back: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  backText: { marginLeft: 8, fontSize: 16, color: "#374151" },
  card: {
    marginHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    marginBottom: 24,
  },
  iconRow: { alignItems: "center", marginBottom: 12 },
  lockCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  lead: { textAlign: "center", color: "#6b7280", marginBottom: 14 },
  label: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 8 },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 52,
    overflow: "hidden",
  },
  button: {
    borderRadius: 22,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  buttonContent: { height: 48 },
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  smallText: { color: "#6b7280" },
  link: { color: "#0f172a", fontWeight: "600" },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  termsText: { color: "#6b7280", fontSize: 12 },
  termsLink: { color: "#0f172a", fontWeight: "600", fontSize: 12 },
});
