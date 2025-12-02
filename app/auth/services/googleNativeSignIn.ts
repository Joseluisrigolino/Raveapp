import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";

export async function signInWithGoogleNative(
  onLogin: (idToken: string, profile?: any) => Promise<any>
) {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Forzamos el selector de cuentas intentando un signOut previo.
    // Esto evita que se seleccione automáticamente la cuenta previa.
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // no hacemos nada si falla; seguimos al signIn
    }

    const userInfo: any = await GoogleSignin.signIn();
    console.log("[GoogleNativeSignIn] userInfo:", JSON.stringify(userInfo, null, 2));

    let idToken: string | null = (userInfo as any)?.idToken ?? null;

    if (!idToken) {
      // Fallback a getTokens
      try {
        const tokens: any = await GoogleSignin.getTokens();
        console.log("[GoogleNativeSignIn] tokens:", tokens);
        idToken = tokens?.idToken ?? null;
      } catch (e) {
        console.warn("[GoogleNativeSignIn] getTokens fallback failed:", e);
      }
    }

    if (!idToken) {
      Alert.alert(
        "Error",
        "No se pudo obtener el token de Google.\n\nReintentá más tarde."
      );
      return;
    }

    const profile = {
      email: userInfo?.user?.email,
      fullName: userInfo?.user?.name,
      givenName: userInfo?.user?.givenName,
      familyName: userInfo?.user?.familyName,
      photo: userInfo?.user?.photo,
      id: userInfo?.user?.id,
    };
    // Llamamos al callback del caller y devolvemos su resultado para que
    // el componente que llamó a este helper pueda actuar en consecuencia.
    const result = await onLogin(idToken, profile);
    return result;
  } catch (err: any) {
    console.log("[GoogleNativeSignIn] error:", err);

    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      return; // usuario canceló
    }

    if (err?.code === statusCodes.IN_PROGRESS) {
      return; // ya hay un login en curso
    }

    if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert(
        "Error",
        "Google Play Services no está disponible o está desactualizado."
      );
      return;
    }

    Alert.alert("Error", "No se pudo iniciar sesión con Google.");
  }
}
