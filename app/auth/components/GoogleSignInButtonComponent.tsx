// app/auth/components/GoogleSignInButtonComponent.tsx

import React, { useState } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { signInWithGoogleNative } from "@/app/auth/services/googleNativeSignIn";
import { GOOGLE_CONFIG } from "@/app/auth/googleConfig";

type Props = {
  expoClientId?: string;
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  useProxy?: boolean;
  onLogin: (idToken: string, profile?: any) => Promise<any> | any;
  onSuccess?: () => void;
  children: React.ReactNode;
};

export default function GoogleSignInButton({
  expoClientId,
  webClientId,
  androidClientId,
  iosClientId,
  useProxy = true,
  onLogin,
  onSuccess,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);
  // Resolvemos client IDs: preferir props, luego GOOGLE_CONFIG
  const resolvedExpoClientId = expoClientId || GOOGLE_CONFIG.expoClientId || "";
  const resolvedWebClientId = webClientId || GOOGLE_CONFIG.webClientId || "";
  const resolvedAndroidClientId = androidClientId || GOOGLE_CONFIG.androidClientId || "";
  const resolvedIosClientId = iosClientId || GOOGLE_CONFIG.iosClientId || "";

  // Nota: los client IDs quedan disponibles en GOOGLE_CONFIG si necesitás fallback.

  async function handlePress() {
    try {
      setLoading(true);
      const result: any = await signInWithGoogleNative(onLogin);

      // If native helper returned a structured failure (environmental), show it.
      if (result && result.success === false) {
        if (result.reason === 'native-module-missing') {
          Alert.alert('Entorno', 'La sign-in nativa de Google no está disponible en Expo Go. Usa un dev-client o prebuild.');
        } else if (result.reason === 'cancelled') {
          // Usuario canceló: no alert necesario
        } else if (result.reason === 'in-progress') {
          Alert.alert('Espere', 'Ya hay un inicio de sesión en curso.');
        } else if (result.reason === 'play-services-not-available') {
          // ya mostrado desde helper
        }
        return;
      }

      // Si el callback onLogin devolvió un valor falsy, consideramos que no
      // se completó el flujo de login/creación en el backend. Evitamos
      // navegar y mostramos un mensaje genérico.
      if (!result) {
        Alert.alert('Error', 'No se pudo completar el inicio de sesión. Intenta nuevamente.');
        return;
      }

      // Si todo OK, llamamos al handler de éxito (navegación)
      onSuccess?.();
    } catch (err) {
      console.error("[GoogleSignInButton] native sign-in error", err);

      // Intentamos extraer un mensaje útil del error (axios, fetch, etc.)
      const serverMessage = err?.response?.data?.message || err?.message;
      if (serverMessage) {
        Alert.alert('Error', String(serverMessage));
      } else {
        Alert.alert(
          'Error',
          'Ocurrió un problema al iniciar sesión con Google. Intentalo más tarde.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      mode="outlined"
      icon="google"
      onPress={handlePress}
      loading={loading}
      disabled={loading}
      contentStyle={{ height: 50 }}
      style={{
        borderRadius: 25,
        height: 50,
        justifyContent: "center",
        width: "100%",
      }}
    >
      {children}
    </Button>
  );
}
