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

  // Estado para el popup
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupOnClose, setPopupOnClose] = useState<null | (() => void)>(null);

  // Muestra el popup con título, mensaje y acción opcional al cerrar
  const showPopup = (title: string, message: string, onClose?: () => void) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupOnClose(() => onClose || null);
    setPopupVisible(true);
  };

  // Comentario en español: envía el email de recuperación
  const handleSend = async () => {
    if (!email.trim()) {
      showPopup("Error", "Por favor ingresa tu email");
      return;
    }

    try {
      await sendRecovery(email.trim());
      // popup con redirección al login
      showPopup(
        "Enlace enviado",
        "Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.",
        () => nav.replace(router, ROUTES.LOGIN.LOGIN)
      );
    } catch (err) {
      console.error("send recovery error", err);
      showPopup(
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
      {/* Popup tipo NewsSuccessPopupComponent */}
      {popupVisible && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupModal}>
            <View style={styles.popupHeaderIcon}>
              <Text style={styles.popupCheck}>✓</Text>
            </View>
            <Text style={styles.popupTitle}>{popupTitle}</Text>
            <Text style={styles.popupText}>{popupMessage}</Text>
            <Button
              mode="contained"
              style={styles.popupButton}
              contentStyle={{ height: 48 }}
              onPress={() => {
                setPopupVisible(false);
                if (popupOnClose) popupOnClose();
              }}
            >
              Aceptar
            </Button>
          </View>
        </View>
      )}

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
    // estilos para el popup
    popupOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.18)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },
    popupModal: {
      backgroundColor: "#fff",
      padding: 22,
      borderRadius: 14,
      width: "90%",
      maxWidth: 400,
      alignSelf: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 6,
    },
    popupHeaderIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "#eaf7ef",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    popupCheck: {
      color: "#16a34a",
      fontSize: 24,
      fontWeight: "700",
    },
    popupTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 6,
      textAlign: "center",
    },
    popupText: {
      color: "#374151",
      textAlign: "center",
      marginBottom: 16,
    },
    popupButton: {
      alignSelf: "stretch",
      borderRadius: 12,
      backgroundColor: "#0f172a",
    },
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
