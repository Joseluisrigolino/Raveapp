import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Text, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CONFIG } from "@/app/auth/googleConfig";
import LoginUserWelcomeComponent from "@/app/auth/components/user/login-user/LoginUserWelcomeComponent";
import LoginUserImageAppComponent from "@/app/auth/components/user/login-user/LoginUserImageAppComponent";
import LoginUserInfoUserComponent from "@/app/auth/components/user/login-user/LoginUserInfoUserComponent";
import LoginUserWhyRaveAppComponent from "@/app/auth/components/user/login-user/LoginUserWhyRaveAppComponent";
import LoginUserStaffComponent from "@/app/auth/components/user/login-user/LoginUserStaffComponent";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import InfoTyc from "@/components/infoTyc";
// imports cleaned: removed unused `globalStyles`
import { useAuth } from "@/app/auth/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==================================================
// helpers
// ==================================================

// (Checkbox moved into the form component)

// ==================================================
// Login screen (simplified, internals English, UI Spanish)
// ==================================================
export default function LoginScreen() {
  // router y auth
  const router = useRouter();
  // Usar el login del contexto para que el estado de autenticación se setee globalmente
  const { login: authLogin } = useAuth();

  // (Firebase flags removed)

  // estados (nombres en inglés)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberFlag, setRememberFlag] = useState(false);

  // Google config (solo clientes)
  const googleConfig: any = {
    expoClientId: GOOGLE_CONFIG.expoClientId || undefined,
    iosClientId: GOOGLE_CONFIG.iosClientId || undefined,
    androidClientId: GOOGLE_CONFIG.androidClientId || undefined,
    webClientId: GOOGLE_CONFIG.webClientId || undefined,
    redirectUri: makeRedirectUri({ useProxy: true } as any),
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  };

  // Completar auth sessions en móviles (expo-auth-session)
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Cargar preferencia "recordarme" y email guardado
  useEffect(() => {
    (async () => {
      try {
        const r = await AsyncStorage.getItem("raveapp_remember");
        const remembered = r === "true";
        setRememberFlag(remembered);
        if (remembered) {
          const last = await AsyncStorage.getItem("raveapp_last_email");
          if (last) setEmail(last);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Helper: can submit
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !loading,
    [email, password, loading]
  );

  // Login tradicional
  async function handleLogin() {
    if (!canSubmit) return;
    try {
      setLoading(true);
      // Llamamos al login del contexto para que además de autenticar, setee el user en el AuthContext
      const user = await authLogin(email.trim(), password);
      if (!user) {
        Alert.alert("Error", "Usuario o contraseña incorrectos.");
        return;
      }

      // Persistir preferencia recordarme
      try {
        await AsyncStorage.setItem(
          "raveapp_remember",
          rememberFlag ? "true" : "false"
        );
        if (rememberFlag)
          await AsyncStorage.setItem("raveapp_last_email", email.trim());
        else await AsyncStorage.removeItem("raveapp_last_email");
      } catch {}

      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
    } catch (err) {
      Alert.alert("Error", "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  // Botón Google para móvil usando expo-auth-session (se pasa como socialNode)
  function GoogleMobileButton() {
    const [request, response, promptAsync] =
      Google.useAuthRequest(googleConfig);

    async function handlePress() {
      try {
        setLoading(true);
        if (!request) {
          Alert.alert(
            "Cargando",
            "Preparando Google Sign-In, intenta de nuevo en unos segundos."
          );
          return;
        }
        const res = await (promptAsync as any)({ useProxy: true });
        if (res?.type !== "success") return;
        const idToken = res?.params?.id_token as string | undefined;
        if (!idToken) {
          Alert.alert("Error", "No se recibió id_token de Google");
          return;
        }
        // Firebase/social login handling removed — notify the user
        Alert.alert(
          "Info",
          "Google Sign-In no está configurado en esta aplicación."
        );
      } catch (e) {
        Alert.alert("Error", "No se pudo iniciar sesión con Google");
      } finally {
        setLoading(false);
      }
    }

    return (
      <Button
        mode="outlined"
        onPress={handlePress}
        icon="google"
        contentStyle={{ height: 50 }}
        style={{
          borderRadius: 25,
          height: 50,
          justifyContent: "center",
          width: "100%",
        }}
        labelStyle={{ color: "#111827", fontWeight: "700" }}
        disabled={loading}
      >
        Ingresar con Google
      </Button>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 64 })}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={140}
        contentContainerStyle={styles.containerScroll}
        keyboardShouldPersistTaps="always"
      >
        <LoginUserImageAppComponent />
        <LoginUserWelcomeComponent />

        <LoginUserInfoUserComponent
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          secure={secure}
          setSecure={setSecure}
          loading={loading}
          rememberFlag={rememberFlag}
          setRememberFlag={setRememberFlag}
          onLogin={handleLogin}
          socialNode={
            googleConfig.androidClientId ||
            googleConfig.iosClientId ||
            googleConfig.expoClientId ||
            googleConfig.webClientId ? (
              <GoogleMobileButton />
            ) : (
              <Button
                mode="outlined"
                onPress={() =>
                  Alert.alert(
                    "Configuración requerida",
                    "Faltan Client IDs de Google en app.json (extra). Define EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID y/o EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID."
                  )
                }
                icon="google"
                disabled={loading}
                contentStyle={{ height: 50 }}
                style={{
                  borderRadius: 25,
                  height: 50,
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                Ingresar con Google
              </Button>
            )
          }
        />

        <LoginUserWhyRaveAppComponent />
        <LoginUserStaffComponent />

        {/* Términos y privacidad (componente reutilizable) */}
        <InfoTyc />
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================================================
// estilos al final
// ==================================================
const styles = StyleSheet.create({
  containerScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  termsRow: {
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  termsText: { color: "#6b7280" },
  termsLink: { color: "#0f172a", fontWeight: "600" },
});
