// GoogleSignInButton: componente reutilizable para Google Sign-In
// Comentarios en español: explica de forma simple qué hace cada parte

import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "@/app/auth/AuthContext";

type Props = {
  expoClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  // useProxy normalmente true en Expo Go
  useProxy?: boolean;
  // callback opcional para que el caller maneje el idToken
  onLogin?: (idToken: string) => Promise<boolean> | boolean;
  // callback opcional cuando todo sale ok
  onSuccess?: () => void;
  children?: React.ReactNode;
};

// Comentarios en español: Componente simple que maneja el flujo de Google
export default function GoogleSignInButton({
  expoClientId,
  iosClientId,
  androidClientId,
  webClientId,
  useProxy = true,
  onLogin,
  onSuccess,
  children,
}: Props) {
  // completar sesiones si es necesario (expo-auth-session)
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // crear request con los clientIds provistos
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId,
    iosClientId,
    androidClientId,
    webClientId,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  } as any);

  const auth = useAuth() as any;
  const [loading, setLoading] = useState(false);

  // handler simple para el botón (comentario en español)
  const handlePress = async () => {
    try {
      setLoading(true);
      if (!request) {
        Alert.alert("Cargando", "Preparando Google Sign-In, intenta de nuevo en unos segundos.");
        return;
      }

      const result: any = await (promptAsync as any)({ useProxy });
      if (result?.type !== "success") return;

      const idToken = result?.authentication?.idToken || result?.params?.id_token;
      if (!idToken) {
        Alert.alert("Error", "No se recibió id_token de Google");
        return;
      }

      // si el caller provee onLogin, delegamos la verificación
      let ok = false;
      if (onLogin) {
        try {
          const res = await onLogin(idToken);
          ok = !!res;
        } catch {
          ok = false;
        }
      } else if (auth?.loginOrCreateWithGoogleIdToken) {
        // intento usar el método del AuthContext si existe
        try {
          ok = await auth.loginOrCreateWithGoogleIdToken(idToken);
        } catch {
          ok = false;
        }
      } else {
        // fallback informativo
        Alert.alert("Info", "Google Sign-In no está configurado en esta aplicación.");
        ok = false;
      }

      if (ok) {
        onSuccess?.();
      } else {
        Alert.alert("Error", "No se pudo registrar/iniciar con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      mode="outlined"
      // usamos el icono por nombre y forzamos el color vía labelStyle
      icon="google"
      onPress={handlePress}
      loading={loading}
      disabled={loading}
      // altura y ancho para que quede 'largo' por defecto
      contentStyle={{ height: 50, justifyContent: 'center' }}
      // estilo para ocupar todo el ancho del contenedor y texto negro
      style={{ borderRadius: 25, width: '100%', alignSelf: 'stretch' }}
      labelStyle={{ color: '#000', fontWeight: '700' }}
    >
      {children || "Iniciar con Google"}
    </Button>
  );
}
