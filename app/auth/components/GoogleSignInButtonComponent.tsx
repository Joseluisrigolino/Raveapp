// GoogleSignInButton: componente reutilizable para Google Sign-In
// Comentarios en español: explica de forma simple qué hace cada parte

import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

// Props para el botón de Google Sign-In
interface GoogleSignInButtonProps {
  expoClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  useProxy?: boolean;
  onLogin?: (idToken: string) => Promise<any> | any;
  onSuccess?: () => void;
  children: React.ReactNode;
}

// Componente principal para el botón de Google Sign-In
export default function GoogleSignInButton({
  expoClientId,
  iosClientId,
  androidClientId,
  webClientId,
  useProxy = true,
  onLogin,
  onSuccess,
  children,
}: GoogleSignInButtonProps) {
  // Completa la sesión de autenticación si viene de un redirect
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Hook de Google para obtener el id_token
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: expoClientId || androidClientId || iosClientId || webClientId,
    androidClientId,
    iosClientId,
    webClientId,
  });
  const [loading, setLoading] = useState(false);

  // Maneja la respuesta de Google y llama a los callbacks
  useEffect(() => {
    if (response?.type === "success" && response.params?.id_token) {
      setLoading(true);
      Promise.resolve(onLogin?.(response.params.id_token))
        .then(() => {
          onSuccess?.();
        })
        .catch((err) => {
          console.log("Google login error:", err);
          Alert.alert(
            "No se pudo iniciar sesión con Google.",
            "Revisa la configuración de Google Cloud o vuelve a intentar."
          );
        })
        .finally(() => setLoading(false));
    }
  }, [response]);

  // Handler para el botón
  const handlePress = () => {
    setLoading(true);
    promptAsync().catch((err) => {
      setLoading(false);
      console.log("Google prompt error:", err);
      Alert.alert(
        "No se pudo iniciar sesión con Google.",
        "Revisa la configuración de Google Cloud o vuelve a intentar."
      );
    });
  };

  return (
    <Button
      mode="outlined"
      icon="google"
      onPress={handlePress}
      loading={loading}
      disabled={!request || loading}
      contentStyle={{ height: 50, justifyContent: 'center' }}
      style={{ borderRadius: 25, width: '100%', alignSelf: 'stretch' }}
      labelStyle={{ color: '#000', fontWeight: '700' }}
    >
      {children}
    </Button>
  );
}
