// app/auth/components/GoogleSignInButtonComponent.tsx

import React, { useState } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { signInWithGoogleNative } from "@/app/auth/googleNativeSignIn";
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
      await signInWithGoogleNative(onLogin);
      onSuccess?.();
    } catch (err) {
      console.error("[GoogleSignInButton] native sign-in error", err);
      Alert.alert(
        "Error",
        "Ocurrió un problema al iniciar sesión con Google. Intentalo más tarde."
      );
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
