// app/auth/googleNativeSignIn.ts
// Helper central para iniciar sesión con la librería nativa
// NOTA: después de integrar estos cambios, ejecutar localmente:
// npx expo prebuild --clean
// npx expo run:android
// (y para builds EAS: eas build -p android --profile <profile>)

import { Alert, NativeModules } from 'react-native';
import { GOOGLE_CONFIG } from '@/app/auth/googleConfig';

// Evitar importar el módulo nativo en tiempo de carga porque provoca
// errores en Expo Go/Metro cuando el módulo nativo no está presente.
// Usamos require dinámico dentro de las funciones para hacer lazy-load.

export function configureGoogleNative() {
  try {
    // Si el módulo nativo no está registrado en NativeModules, lo saltamos.
    if (!NativeModules?.RNGoogleSignin) {
      console.warn('configureGoogleNative skipped: RNGoogleSignin not registered in NativeModules');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');

    // @react-native-google-signin/google-signin no acepta `androidClientId`.
    // Proporcionamos únicamente `webClientId` (para id_token / server auth)
    // y opciones relevantes.
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId || undefined,
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  } catch (e) {
    console.warn('configureGoogleNative skipped (native module not available):', e?.message || e);
  }
}

export async function signInWithGoogleNative(
  onLogin: (idToken: string, profile?: any) => Promise<any>
) {
  try {
    // Si el módulo nativo no está presente, avisamos y no intentamos require.
    if (!NativeModules?.RNGoogleSignin) {
      console.warn('Native Google Signin module not available (NativeModules.RNGoogleSignin missing)');
      Alert.alert('Entorno', 'La sign-in nativa de Google no está disponible en Expo Go. Usa un dev-client o prebuild.');
      return;
    }

    // Cargamos el módulo nativo en tiempo de ejecución.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const userInfo: any = await GoogleSignin.signIn();

    const idToken = userInfo?.idToken;
    if (!idToken) {
      Alert.alert('Error', 'No se pudo obtener el token de Google.');
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

    // Delegate to the app's auth handler. If the backend rejects or throws,
    // we should let that error bubble up so the UI can show a useful message.
    await onLogin(idToken, profile);
    return { success: true };
  } catch (err: any) {
    // Si el require falla (módulo no disponible) o hay error nativo, lo manejamos.
    const message = err?.message || err;
    if (message && message.indexOf && message.indexOf('Cannot find module') !== -1) {
      console.warn('Native Google Signin module not available in this environment.');
      Alert.alert('Entorno', 'La sign-in nativa de Google no está disponible en Expo Go. Usa un dev-client o prebuild.');
      return { success: false, reason: 'native-module-missing' };
    }

    if (err?.code === (err?.statusCodes ?? {}).SIGN_IN_CANCELLED) {
      return { success: false, reason: 'cancelled' }; // usuario canceló
    }
    if (err?.code === (err?.statusCodes ?? {}).IN_PROGRESS) {
      return { success: false, reason: 'in-progress' }; // ya hay un sign-in en curso
    }
    if (err?.code === (err?.statusCodes ?? {}).PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Google Play Services no está disponible o desactualizado.');
      return { success: false, reason: 'play-services-not-available' };
    }

    // Si es un error lanzado por `onLogin` (p. ej. rechazada por el backend),
    // re-lanzamos para que el UI lo capture y muestre el mensaje detallado.
    console.warn('signInWithGoogleNative error', err);
    throw err;
  }
}
