// app/auth/screens/LoginScreen.tsx (o login.tsx si mantenés el nombre actual)

import React, { useEffect, useMemo, useState } from "react"; // Hooks básicos de React
import {
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"; // Componentes y utilidades base de RN
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"; // Scroll que se adapta al teclado
import { Text, Button } from "react-native-paper"; // UI components de react-native-paper
import { useRouter } from "expo-router"; // Navegación basada en Expo Router
import * as WebBrowser from "expo-web-browser"; // Para completar sesiones de auth web (Google/etc)
import Constants from "expo-constants"; // Info del entorno Expo (appOwnership, extra, etc.)

import { GOOGLE_CONFIG } from "@/app/auth/googleConfig"; // Config centralizada de Google OAuth
import { useAuth } from "@/app/auth/AuthContext"; // Contexto de autenticación global
// AsyncStorage removed: we no longer persist "recordarme"

// Componentes de UI específicos del flujo de login de usuario
import LoginUserWelcomeComponent from "@/app/auth/components/user/login-user/LoginUserWelcomeComponent";
import LoginUserImageAppComponent from "@/app/auth/components/user/login-user/LoginUserImageAppComponent";
import LoginUserInfoUserComponent from "@/app/auth/components/user/login-user/LoginUserInfoUserComponent";
import LoginUserWhyRaveAppComponent from "@/app/auth/components/user/login-user/LoginUserWhyRaveAppComponent";
import LoginUserStaffComponent from "@/app/auth/components/user/login-user/LoginUserStaffComponent";

// Botón reutilizable para login con Google
import GoogleSignInButton from "@/app/auth/components/GoogleSignInButtonComponent";

import * as nav from "@/utils/navigation"; // Helpers propios para navegar (replace, push, etc.)
import ROUTES from "@/routes"; // Mapa central de rutas de la app
import InfoTyc from "@/components/infoTyc"; // Componente con Términos y Condiciones y Política de Privacidad

/**
 * Screen principal de Login de usuario.
 * - Login tradicional (email + contraseña)
 * - Login con Google
 * - Recordar email
 * - Info de qué es Raveapp y staff
 */
export default function LoginScreen() {
  // Hook de navegación de expo-router
  const router = useRouter();

  // Obtenemos funciones de autenticación desde el contexto global
  const {
    login: authLogin, // login clásico con email/password
    loginOrCreateWithGoogleIdToken, // login/registro a partir de id_token de Google
  } = useAuth();

  /**
   * Estado local del formulario
   */
  const [email, setEmail] = useState(""); // email del usuario
  const [password, setPassword] = useState(""); // password del usuario
  const [secure, setSecure] = useState(true); // flag para mostrar/ocultar password
  const [loading, setLoading] = useState(false); // flag de loading para evitar doble submit
  // Ya no usamos la funcionalidad 'recordarme'

  /**
   * Datos de entorno / configuración de Google
   */
  const isExpoGo = Constants.appOwnership === "expo"; // true cuando corrés en Expo Go
  const { expoClientId, iosClientId, androidClientId, webClientId } = GOOGLE_CONFIG; // IDs de cliente de Google

  /**
   * Completa la sesión de auth en navegadores integrados.
   * Recomendado por expo-auth-session para cerrar ciclos de login.
   */
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  /**
   * Al montar la pantalla:
   * - cargamos si el usuario marcó "recordarme"
   * - si estaba marcado, traemos también el último email usado
   */
  // Ya no usamos la funcionalidad 'recordarme'

  /**
   * Flag derivado para saber si el formulario está en condiciones de enviar.
   * - email no vacío
   * - password no vacía
   * - no estar cargando
   */
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !loading,
    [email, password, loading]
  );

  /**
   * Helper para persistir la preferencia de "recordarme" y el último email usado.
   */
  // persistRememberMeState removed because we don't offer 'recordarme' anymore

  /**
   * Handler del login tradicional (email + password).
   * - Valida canSubmit
   * - Llama al login del AuthContext
   * - Maneja errores y persistencia de "recordarme"
   * - Navega al menú principal de eventos si todo sale bien
   */
  async function handleLogin() {
    // Si todavía no se puede enviar el form, salimos
    if (!canSubmit) return;

    try {
      setLoading(true);

      // Llamamos a login del contexto: esto se encarga de hablar con la API,
      // setear el usuario global y persistirlo en AsyncStorage (via AuthContext).
      const user = await authLogin(email.trim(), password);

      // Si login devolvió null, el usuario o la contraseña son incorrectos
      if (!user) {
        Alert.alert("Error", "Usuario o contraseña incorrectos.");
        return;
      }

      // Ya no persistimos "recordarme"

      // Navegamos al menú principal de eventos, reemplazando la screen actual
      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
    } catch (err) {
      // Cualquier error no controlado cae acá
      Alert.alert("Error", "No se pudo iniciar sesión.");
    } finally {
      // Siempre apagamos el loading al terminar
      setLoading(false);
    }
  }

  /**
   * Node de UI para el botón de Google:
   * - Si hay al menos un clientId configurado, mostramos el botón real
   * - Si no, mostramos un botón que avisa que falta configuración
   */
  const googleButtonNode = useMemo(() => {
    const hasAnyClientId =
      !!androidClientId || !!iosClientId || !!expoClientId || !!webClientId;

    // Caso sin configuración de Google: botón que explica qué falta
    if (!hasAnyClientId) {
      return (
        <Button
          mode="outlined"
          onPress={() =>
            Alert.alert(
              "Configuración requerida",
              "Faltan Client IDs de Google en la configuración. Definí EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID y/o EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID."
            )
          }
          icon="google"
          disabled={loading}
          contentStyle={{ height: 50 }}
          style={styles.googleFallbackButton}
        >
          Ingresar con Google
        </Button>
      );
    }

    // Caso con configuración de Google: usamos el componente reutilizable
    return (
      <GoogleSignInButton
        expoClientId={expoClientId}
        iosClientId={iosClientId}
        androidClientId={androidClientId}
        webClientId={webClientId}
        useProxy={isExpoGo} // en Expo Go, normalmente se usa proxy de auth
        onLogin={loginOrCreateWithGoogleIdToken} // callback que recibe el id_token y loguea/crea el usuario
        onSuccess={() => nav.replace(router, ROUTES.MAIN.EVENTS.MENU)} // si todo va bien, navegamos al menú principal
      >
        Ingresar con Google
      </GoogleSignInButton>
    );
  }, [
    androidClientId,
    iosClientId,
    expoClientId,
    webClientId,
    isExpoGo,
    loginOrCreateWithGoogleIdToken,
    loading,
    router,
  ]);

  /**
   * Render principal de la screen:
   * - envuelta en KeyboardAvoidingView para levantar el contenido con el teclado
   * - Scroll-aware para formularios largos
   * - Layout dividido en secciones (imagen, welcome, formulario, por qué Rave, staff, TyC)
   */
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })} // comportamiento distinto según plataforma
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 64 })} // offset para no pisar el header/nav
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={140} // margen extra para que el teclado no tape los inputs
        contentContainerStyle={styles.containerScroll}
        keyboardShouldPersistTaps="always" // deja que los taps en inputs funcionen aunque el teclado esté abierto
      >
        {/* Sección de imagen / branding de la app */}
        <LoginUserImageAppComponent />

        {/* Mensaje de bienvenida / copy principal */}
        <LoginUserWelcomeComponent />

        {/* Formulario principal de login (email, password, recordarme, botón login, botón Google) */}
        <LoginUserInfoUserComponent
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          secure={secure}
          setSecure={setSecure}
          loading={loading}
          onLogin={handleLogin}
          socialNode={googleButtonNode} // acá inyectamos el botón de Google ya resuelto
        />

        {/* Sección explicando por qué usar Raveapp */}
        <LoginUserWhyRaveAppComponent />

        {/* Sección del staff / equipo detrás de la app */}
        <LoginUserStaffComponent />

        {/* Términos y Condiciones y Política de Privacidad (componente reutilizable) */}
        <InfoTyc />
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Estilos locales de la pantalla de login.
 */
const styles = StyleSheet.create({
  containerScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  googleFallbackButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: "100%",
  },
});
