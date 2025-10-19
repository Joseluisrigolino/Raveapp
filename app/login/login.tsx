import React, { useMemo, useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session"; // ✅ Necesario para el redirectUri
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../routes";
import TitlePers from "@/components/common/TitleComponent";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { getProfile, createUsuario } from "@/utils/auth/userHelpers";

// ✅ Obligatorio para cerrar correctamente el flujo OAuth en Expo
WebBrowser.maybeCompleteAuthSession();

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

  // --- CONFIGURACIÓN DE LOGIN CON GOOGLE ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "728778718807-imc5ad9jh3om4oj48ohkaiv81o4e7gsv.apps.googleusercontent.com",
    iosClientId:
      "728778718807-r65km9pj3scldf126tmo9plvpnuri2tl.apps.googleusercontent.com",
    webClientId:
      "728778718807-otcuqi0nkfvpgua16ong1c3s6qqto00k.apps.googleusercontent.com", // ✅ Nuevo cliente web proporcionado
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true, // ✅ Clave para que funcione en Expo Go
      native: "myapp://auth", // ✅ Para builds nativas
    }),
  });

  // --- EFECTO PARA CAPTURAR RESPUESTA GOOGLE ---
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      handleGoogleResponse(authentication?.accessToken);
    }
  }, [response]);

  // --- LOGIN CLÁSICO ---
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

  // --- LOGIN CON GOOGLE ---
  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (err) {
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
    }
  };

  // --- PROCESAR DATOS DEL TOKEN GOOGLE ---
  const handleGoogleResponse = async (token: string | undefined) => {
    if (!token) {
      Alert.alert("Error", "No se obtuvo token de Google.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await res.json();

      if (!userInfo?.email) {
        Alert.alert("Error", "No se pudo obtener la información del usuario.");
        return;
      }

      // Si el usuario ya existe, lo logueamos
      try {
        const existingUser = await getProfile(userInfo.email);
        console.log("Usuario existente:", existingUser);
        nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
      } catch {
        // Si no existe, creamos uno nuevo
        await createUsuario({
          nombre: userInfo.given_name || "",
          apellido: userInfo.family_name || "",
          correo: userInfo.email,
          cbu: "",
          dni: "",
          telefono: "",
          nombreFantasia: "",
          bio: "",
          password: "google_auth",
          dtNacimiento: new Date().toISOString(),
          domicilio: {
            direccion: "",
            latitud: 0,
            longitud: 0,
            localidad: { nombre: "", codigo: "" },
            municipio: { nombre: "", codigo: "" },
            provincia: { nombre: "", codigo: "" },
          },
          socials: {
            idSocial: "",
            mdInstagram: "",
            mdSpotify: "",
            mdSoundcloud: "",
          },
        });

        Alert.alert("Cuenta creada", "Se creó una nueva cuenta con Google.");
        nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
      }
    } catch (error) {
      console.error("Error login Google:", error);
      Alert.alert("Error", "No se pudo completar el inicio de sesión con Google.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI ---
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: globalStyles.COLORS.backgroundLight },
          ]}
        >
          <View style={styles.card}>
            <TitlePers text="Bienvenido a RaveApp" />
            <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

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
              textColor={"#0f172a"}
              placeholderTextColor={"#4b5563"}
              selectionColor={"#0f172a"}
              outlineColor={"#e6e9ef"}
              activeOutlineColor={globalStyles.COLORS.primary}
              outlineStyle={{ borderRadius: 16 }}
              right={<TextInput.Icon icon="email-outline" color="#6b7280" />}
            />

            <TextInput
              mode="outlined"
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              textColor={"#0f172a"}
              placeholderTextColor={"#4b5563"}
              selectionColor={"#0f172a"}
              outlineColor={"#e6e9ef"}
              activeOutlineColor={globalStyles.COLORS.primary}
              outlineStyle={{ borderRadius: 16 }}
              right={
                <TextInput.Icon
                  icon={secure ? "eye" : "eye-off"}
                  color="#6b7280"
                  onPress={() => setSecure((s) => !s)}
                  forceTextInputFocus={false}
                />
              }
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
                <Link
                  href={ROUTES.LOGIN.REGISTER}
                  style={{ color: globalStyles.COLORS.primary }}
                >
                  ¿No tenés cuenta? Registrate
                </Link>
              </Text>
            </View>

            <View style={styles.linksRow}>
              <Button
                mode="text"
                onPress={() => nav.replace(router, ROUTES.MAIN.EVENTS.MENU)}
                compact
                labelStyle={{
                  color: globalStyles.COLORS.primary,
                  fontWeight: "600",
                }}
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
    overflow: "hidden",
    height: 56,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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
