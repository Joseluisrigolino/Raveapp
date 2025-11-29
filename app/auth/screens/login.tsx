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
import Constants from "expo-constants";
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
import GoogleSignInButton from "@/app/auth/components/GoogleSignInButtonComponent";

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

  const isExpoGo = Constants.appOwnership === "expo";
  const expoClientId = GOOGLE_CONFIG.expoClientId;
  const iosClientId = GOOGLE_CONFIG.iosClientId;
  const androidClientId = GOOGLE_CONFIG.androidClientId;
  const webClientId = GOOGLE_CONFIG.webClientId;
  const { loginOrCreateWithGoogleIdToken } = useAuth();

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

  // usamos componente reutilizable GoogleSignInButton

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
            androidClientId || iosClientId || expoClientId || webClientId ? (
              <GoogleSignInButton
                expoClientId={expoClientId}
                iosClientId={iosClientId}
                androidClientId={androidClientId}
                webClientId={webClientId}
                useProxy={isExpoGo}
                onLogin={loginOrCreateWithGoogleIdToken}
                onSuccess={() => nav.replace(router, ROUTES.MAIN.EVENTS.MENU)}
              >
                Ingresar con Google
              </GoogleSignInButton>
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
