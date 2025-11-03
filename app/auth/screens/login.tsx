// app/login/Login.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Link, useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/app/auth/AuthContext";
import { apiClient, login as apiLogin } from "@/app/apis/apiConfig";
import { getProfile, updateUsuario, createUsuario, getEntradasUsuario } from "@/app/auth/userHelpers";
import AsyncStorage from '@react-native-async-storage/async-storage';
// Google Cloud config removed; we rely on Firebase when Google is enabled.

export default function LoginScreen() {
  // Checkbox cuadrado personalizado
  const SquareCheckbox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}
      >
        {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
      </View>
    </Pressable>
  );
  const router = useRouter();
  const { login, loginWithGoogle, loginWithGooglePopup } = useAuth();
  const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};
  const USE_FIREBASE = !!EX.EXPO_PUBLIC_USE_FIREBASE_AUTH;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);

  // Completar sesiones OAuth de navegador (requerido por expo-auth-session en móvil)
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Cargar estado de "Recordarme" y último email
  useEffect(() => {
    (async () => {
      try {
        const r = await AsyncStorage.getItem('raveapp_remember');
        const remembered = r === 'true';
        setRemember(remembered);
        if (remembered) {
          const last = await AsyncStorage.getItem('raveapp_last_email');
          if (last) setUsername(last);
        }
      } catch {}
    })();
  }, []);

  const isExpoGo = Constants.appOwnership === "expo";

  // Google via Firebase: web usa popup; móvil usa expo-auth-session (requiere clientIds)
  const isWeb = Platform.OS === "web";
  const isMobile = !isWeb;

  // Client IDs (provistos por Firebase/Google)
  const expoClientId = EX.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || EX.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;
  const iosClientId = EX.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const androidClientId = EX.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
  const webClientId = EX.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;

  const googleConfig: any = {
    expoClientId,
    iosClientId,
    androidClientId,
    webClientId,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  };

  const hasAnyClientId = !!(iosClientId || androidClientId || expoClientId);

  // Helper para sincronizar con API después del login con Google
  const syncWithApiAfterGoogle = async (u: any) => {
    if (!u) return false;
    try {
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;
      const correo = (u as any)?.username || "";
      const displayName = `${(u as any)?.nombre ?? ""} ${(u as any)?.apellido ?? ""}`.trim();
      const [nombreFB, ...restFB] = displayName.split(" ");
      const apellidoFB = restFB.join(" ").trim();

      try {
        const perfil = await getProfile(correo);
        const payload = {
          idUsuario: perfil.idUsuario,
          nombre: nombreFB || perfil.nombre,
          apellido: apellidoFB || perfil.apellido,
          correo: perfil.correo,
          dni: perfil.dni || "",
          telefono: perfil.telefono || "",
          cbu: perfil.cbu || "",
          nombreFantasia: perfil.nombreFantasia || "",
          bio: perfil.bio || "",
          dtNacimiento: perfil.dtNacimiento || new Date().toISOString(),
          domicilio: perfil.domicilio || {
            localidad: { nombre: "", codigo: "" },
            municipio: { nombre: "", codigo: "" },
            provincia: { nombre: "", codigo: "" },
            direccion: "",
            latitud: 0,
            longitud: 0,
          },
          cdRoles: perfil.cdRoles || [],
          socials: perfil.socials || {
            idSocial: "",
            mdInstagram: "",
            mdSpotify: "",
            mdSoundcloud: "",
          },
        } as const;
        await updateUsuario(payload as any);
      } catch (err: any) {
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const [nombre, ...rest] = (displayName || "").split(" ");
        const apellido = rest.join(" ").trim();
        const createPayload = {
          domicilio: {
            localidad: { nombre: "", codigo: "" },
            municipio: { nombre: "", codigo: "" },
            provincia: { nombre: "", codigo: "" },
            direccion: "",
            latitud: 0,
            longitud: 0,
          },
          nombre: nombre || "",
          apellido: apellido || "",
          correo,
          cbu: "",
          dni: "",
          telefono: "",
          nombreFantasia: "",
          bio: "0",
          password: randomPassword,
          socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
          dtNacimiento: new Date().toISOString(),
        };
        await createUsuario(createPayload as any);
      }
      return true;
    } catch (syncErr) {
      console.error("Google sync error:", syncErr);
      Alert.alert("Atención", "Iniciaste sesión con Google pero no se pudo sincronizar con la base de datos.");
      return false;
    }
  };

  // Subcomponente: sólo en móvil con clientId disponibles
  const GoogleMobileButton = () => {
    const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);
    return (
      <Button
        mode="outlined"
        onPress={async () => {
          try {
            setSubmitting(true);
            if (!request) {
              Alert.alert("Cargando", "Preparando Google Sign-In, intenta de nuevo en unos segundos.");
              return;
            }
            const res = await (promptAsync as any)({ useProxy: isExpoGo });
            if (res.type !== "success") return;
            const idToken = res.authentication?.idToken || (res.params?.id_token as string | undefined);
            const accessToken = res.authentication?.accessToken as string | undefined;
            const tokenToUse = idToken || (accessToken ? `access:${accessToken}` : undefined);
            if (!tokenToUse) {
              Alert.alert("Error", "No se recibió id_token de Google");
              return;
            }
            const u = await loginWithGoogle(tokenToUse);
            if (!u) {
              Alert.alert("Error", "No se pudo iniciar sesión con Google (Firebase)");
              return;
            }
            // Loggear id de usuario para debugging (Google móvil)
            try {
              const uid = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? 'unknown';
              console.log('Usuario logueado (Google) - id:', uid);
            } catch (e) {
              console.log('Usuario logueado (Google) - id: (no disponible)');
            }
            // Obtener entradas del usuario y loguearlas para depuración
            try {
              const idForEntries = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? (u as any)?.uid ?? null;
              if (idForEntries) {
                const entradas = await getEntradasUsuario(String(idForEntries));
                console.log('[login] entradas para usuario', String(idForEntries), entradas);
              } else {
                console.log('[login] id de usuario no disponible para getEntradasUsuario');
              }
            } catch (err) {
              console.error('[login] error obteniendo entradas del usuario:', err);
            }
            const ok = await syncWithApiAfterGoogle(u);
            if (ok) nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
          } catch (e) {
            Alert.alert("Error", "No se pudo iniciar sesión con Google");
          } finally {
            setSubmitting(false);
          }
        }}
        icon="google"
        contentStyle={styles.googleButtonContent}
        style={[styles.googleButton, styles.socialBtn]}
        labelStyle={{ color: "#111827", fontWeight: "700" }}
        disabled={submitting}
      >
        Ingresar con Google
      </Button>
    );
  };

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && !submitting,
    [username, password, submitting]
  );

  // Login clásico con usuario/contraseña
  const handleLogin = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const u = await login(username.trim(), password);
      if (!u) {
        Alert.alert("Error", "Usuario o contraseña incorrectos.");
        return;
      }
      // Loggear id de usuario para debugging
      try {
        const uid = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? 'unknown';
        console.log('Usuario logueado - id:', uid);
      } catch (e) {
        console.log('Usuario logueado - id: (no disponible)');
      }
      // Obtener entradas del usuario y loguearlas para depuración
      try {
        const idForEntries = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? (u as any)?.uid ?? null;
        if (idForEntries) {
          const entradas = await getEntradasUsuario(String(idForEntries));
          console.log('[login] entradas para usuario', String(idForEntries), entradas);
        } else {
          console.log('[login] id de usuario no disponible para getEntradasUsuario');
        }
      } catch (err) {
        console.error('[login] error obteniendo entradas del usuario:', err);
      }
      // Persistir preferencia de recordarme y email
      try {
        await AsyncStorage.setItem('raveapp_remember', remember ? 'true' : 'false');
        if (remember) await AsyncStorage.setItem('raveapp_last_email', username.trim());
        else await AsyncStorage.removeItem('raveapp_last_email');
      } catch {}
      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  // Sin mensajes de Google Cloud; sólo Firebase popup en web

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: globalStyles.COLORS.backgroundLight }}
        contentContainerStyle={styles.containerScroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
          {/* Header con logo y tagline */}
          <View style={styles.headerBox}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../../assets/images/raveapplogo/logo1.jpeg')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            <Text style={styles.brandTitle}>RaveApp</Text>
            <Text style={styles.brandSubtitle}>Tu puerta al mejor entretenimiento</Text>
          </View>

          {/* Card del formulario */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            <TextInput
              mode="outlined"
              label="Email"
              placeholder="tu@email.com"
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
              activeOutlineColor="#0f172a"
              outlineStyle={{ borderRadius: 16 }}
              left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
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
              activeOutlineColor="#0f172a"
              outlineStyle={{ borderRadius: 16 }}
              right={
                <TextInput.Icon
                  icon={secure ? "eye" : "eye-off"}
                  color="#6b7280"
                  onPress={() => setSecure((s) => !s)}
                  forceTextInputFocus={false}
                />
              }
              left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
            />

            {/* Recordarme + ¿Olvidaste tu contraseña? (misma fila) */}
            <View style={styles.rowBetween}>
              <View style={styles.rememberRow}>
                <SquareCheckbox checked={remember} onPress={() => setRemember((r) => !r)} />
                <Pressable onPress={() => setRemember((r) => !r)}>
                  <Text style={styles.rememberText}>Recordarme</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => Alert.alert('Recuperar contraseña', 'Esta función estará disponible próximamente.') }>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            {/* El botón social se muestra más abajo (sólo Google) */}

            {/* Botón principal */}
            <Button
              mode="contained"
              onPress={handleLogin}
              contentStyle={styles.buttonContent}
              style={styles.loginButton}
              labelStyle={{ fontWeight: "700", color: "#ffffff" }}
              disabled={!canSubmit}
              loading={submitting}
            >
              Iniciar Sesión
            </Button>

            {/* Divider */}
          {/* Divider fuera del card */}
          <View style={styles.dividerRowOutside}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Socials: Google y Apple (lado a lado) */}
          <View style={styles.socialRow}>
            {isWeb ? (
              <Button
                mode="outlined"
                onPress={async () => {
                  try {
                    setSubmitting(true);
                    const u = await loginWithGooglePopup?.();
                    if (!u) {
                      Alert.alert("Error", "No se pudo iniciar sesión con Google (Firebase)");
                      return;
                    }
                    // Loggear id de usuario para debugging (Google web/popup)
                    try {
                      const uid = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? 'unknown';
                      console.log('Usuario logueado (Google web) - id:', uid);
                    } catch (e) {
                      console.log('Usuario logueado (Google web) - id: (no disponible)');
                    }
                    // Obtener entradas del usuario y loguearlas para depuración
                    try {
                      const idForEntries = (u as any)?.id ?? (u as any)?.idUsuario ?? (u as any)?.userId ?? (u as any)?.uid ?? null;
                      if (idForEntries) {
                        const entradas = await getEntradasUsuario(String(idForEntries));
                        console.log('[login] entradas para usuario', String(idForEntries), entradas);
                      } else {
                        console.log('[login] id de usuario no disponible para getEntradasUsuario');
                      }
                    } catch (err) {
                      console.error('[login] error obteniendo entradas del usuario:', err);
                    }
                    const ok = await syncWithApiAfterGoogle(u);
                    if (ok) nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
                  } catch (e) {
                    Alert.alert("Error", "No se pudo iniciar sesión con Google");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                icon="google"
                contentStyle={styles.socialBtnContent}
                style={[styles.googleButton, styles.socialBtn]}
                labelStyle={{ color: "#111827", fontWeight: "700" }}
                disabled={submitting}
              >
                Ingresar con Google
              </Button>
            ) : hasAnyClientId ? (
              <GoogleMobileButton />
            ) : (
              <Button
                mode="outlined"
                onPress={() =>
                  Alert.alert(
                    "Configuración requerida",
                    "Faltan clientIds de Google en app.json (EXPO_PUBLIC_GOOGLE_*) para usar Google en móvil."
                  )
                }
                icon="google"
                contentStyle={styles.socialBtnContent}
                style={[styles.googleButton, styles.socialBtn]}
                labelStyle={{ color: "#111827", fontWeight: "700" }}
                disabled={submitting}
              >
                Ingresar con Google
              </Button>
            )}
          </View>

          {/* Link a registro (fuera del card) - toda la frase es clickable */}
          <View style={styles.linksRowOutside}>
            <Link href={ROUTES.LOGIN.REGISTER} asChild>
              <Pressable accessibilityRole="link">
                <Text variant="bodySmall" style={styles.linkText}>
                  ¿No tienes cuenta? Regístrate aquí
                </Text>
              </Pressable>
            </Link>
          </View>

          </View>

          {/* Sección de beneficios */}
          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>¿Por qué RaveApp?</Text>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconCircle}><Icon name="confirmation-number" size={20} color="#0f172a" /></View>
              <Text style={styles.benefitText}>Entradas verificadas al instante</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconCircle}><Icon name="verified-user" size={20} color="#0f172a" /></View>
              <Text style={styles.benefitText}>Compra 100% segura</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconCircle}><Icon name="event" size={20} color="#0f172a" /></View>
              <Text style={styles.benefitText}>Los mejores eventos cerca de ti</Text>
            </View>
          </View>

          {/* Términos y privacidad */}
          <View style={styles.termsRow}>
            <Text style={styles.termsText}>Al continuar, aceptas nuestros </Text>
            <Pressable onPress={() => Alert.alert('Términos de Servicio', 'Próximamente.')}><Text style={styles.termsLink}>Términos de Servicio</Text></Pressable>
            <Text style={styles.termsText}>  </Text>
            <Pressable onPress={() => Alert.alert('Política de Privacidad', 'Próximamente.') }><Text style={styles.termsLink}>Política de Privacidad</Text></Pressable>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// GoogleButton via expo-auth-session removed. Using Firebase popup on web only.

const styles = StyleSheet.create({
  containerScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  brandSubtitle: {
    color: '#6b7280',
    marginBottom: 12,
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
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'left',
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { color: '#374151', marginLeft: 4, marginRight: 12 },
  forgotText: { color: '#0f172a', fontWeight: '600' },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0f172a',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0f172a',
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
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
    backgroundColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContent: { height: 50 },
  linksRow: { marginTop: 12, alignItems: "center" },
  linkText: { color: globalStyles.COLORS.primary },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerRowOutside: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 12,
  },
  linksRowOutside: { marginTop: 8, alignItems: 'center' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 8, color: '#6b7280' },
  benefitsBox: {
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e9ef',
  },
  benefitsTitle: { fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e6e9ef',
  },
  benefitText: { color: '#374151' },
  socialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  socialBtn: { flex: 1 },
  socialBtnContent: { height: 50 },
  termsRow: { marginTop: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  termsText: { color: '#6b7280' },
  termsLink: { color: '#0f172a', fontWeight: '600' },
});
