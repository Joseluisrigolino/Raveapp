// app/login/RecuperarContrasena.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Link, useRouter } from "expo-router";
import globalStyles from "@/styles/globalStyles";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";
import { sendPasswordRecoveryEmail } from "@/app/apis/mailsApi";
import { getProfile } from "@/app/auth/userHelpers";

export default function RecuperarContrasenaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendRecovery = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    try {
      setSubmitting(true);
      
      // Intentar obtener el perfil del usuario para conseguir el nombre
      let userName = "Usuario";
      try {
        const profile = await getProfile(email.trim());
        userName = profile.nombre || "Usuario";
      } catch {
        // Si no se encuentra el usuario, seguimos con "Usuario" por defecto
      }

      // Enviar email de recuperación
      await sendPasswordRecoveryEmail({
        to: email.trim(),
        name: userName,
      });

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
    } catch (error) {
      console.error("Error sending recovery email:", error);
      Alert.alert("Error", "No se pudo enviar el enlace de recuperación. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: globalStyles.COLORS.backgroundLight }}
        contentContainerStyle={styles.containerScroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header con logo y tagline */}
        <View style={styles.headerBox}>
          <View style={styles.logoCircle}>
            <Icon name="music-note" size={28} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>RaveApp</Text>
          <Text style={styles.brandSubtitle}>Tu puerta al mejor entretenimiento</Text>
        </View>

        {/* Botón volver */}
        <Pressable 
          style={styles.backButton}
          onPress={() => nav.back(router)}
        >
          <Icon name="arrow-back" size={24} color="#374151" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        {/* Card principal */}
        <View style={styles.card}>
          {/* Icono de candado */}
          <View style={styles.lockIconContainer}>
            <View style={styles.lockIconCircle}>
              <Icon name="lock" size={32} color="#6b7280" />
            </View>
          </View>

          <Text style={styles.formTitle}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </Text>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            mode="outlined"
            placeholder="tu@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            textColor={"#0f172a"}
            placeholderTextColor={"#4b5563"}
            selectionColor={"#0f172a"}
            outlineColor={"#e6e9ef"}
            activeOutlineColor="#0f172a"
            outlineStyle={{ borderRadius: 16 }}
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
          />

          <Button
            mode="contained"
            onPress={handleSendRecovery}
            contentStyle={styles.buttonContent}
            style={styles.sendButton}
            labelStyle={{ fontWeight: "700", color: "#ffffff" }}
            disabled={submitting}
            loading={submitting}
          >
            Enviar Enlace
          </Button>

          {/* Link de recordaste contraseña */}
          <View style={styles.rememberRow}>
            <Text style={styles.rememberText}>¿Recordaste tu contraseña? </Text>
            <Link href={ROUTES.LOGIN.LOGIN} style={styles.loginLink}>
              Iniciar Sesión
            </Link>
          </View>
        </View>

        {/* Sección de ayuda */}
        <View style={styles.helpSection}>
          <View style={styles.helpIconCircle}>
            <Text style={styles.helpIcon}>?</Text>
          </View>
          <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
          <Text style={styles.helpText}>
            Si tienes problemas para recuperar tu cuenta, nuestro equipo está aquí para ayudarte.
          </Text>
          <Pressable 
            style={styles.contactButton}
            onPress={() => Alert.alert('Contactar Soporte', 'Esta función estará disponible próximamente.')}
          >
            <Text style={styles.contactButtonText}>Contactar{'\n'}Soporte</Text>
          </Pressable>
        </View>

        {/* Términos y privacidad */}
        <View style={styles.termsRow}>
          <Text style={styles.termsText}>Al continuar, aceptas nuestros </Text>
          <Pressable onPress={() => Alert.alert('Términos de Servicio', 'Próximamente.')}>
            <Text style={styles.termsLink}>Términos de Servicio</Text>
          </Pressable>
          <Text style={styles.termsText}> y </Text>
          <Pressable onPress={() => Alert.alert('Política de Privacidad', 'Próximamente.')}>
            <Text style={styles.termsLink}>Política de Privacidad</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  containerScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  brandSubtitle: {
    color: '#6b7280',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    marginBottom: 32,
  },
  lockIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  sendButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    backgroundColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  buttonContent: { height: 50 },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rememberText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  helpSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  helpIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  helpIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6b7280',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  helpText: {
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e6e9ef',
  },
  contactButtonText: {
    textAlign: 'center',
    color: '#0f172a',
    fontWeight: '600',
    lineHeight: 18,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#6b7280',
    fontSize: 12,
  },
  termsLink: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 12,
  },
});
