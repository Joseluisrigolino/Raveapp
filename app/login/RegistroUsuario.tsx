// src/screens/login/RegisterUserScreen.tsx

import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button, useTheme, HelperText, Menu } from "react-native-paper";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
// Google Cloud oauth removed; using Expo Auth Session with Firebase client IDs
import { jwtDecode } from "jwt-decode";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../routes";

import globalStyles from "@/styles/globalStyles";
import { apiClient, login as apiLogin } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateUsuario, createUsuario } from "@/utils/auth/userHelpers";
// Google Cloud config removed; registration can be adapted to Firebase if needed.

export default function RegisterUserScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { loginWithGooglePopup, loginWithGoogle } = useAuth();
  // Google Cloud removed; keep only email/password registration
  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";
  const isExpoGo = Constants.appOwnership === "expo";
  const isWeb = Platform.OS === "web";
  const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};

  // Completar sesiones OAuth de navegador (requerido por expo-auth-session en móvil)
  React.useEffect(() => { WebBrowser.maybeCompleteAuthSession(); }, []);

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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    dni: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  
  // Estados para los selectores de fecha
  const [dateSelectors, setDateSelectors] = useState({
    day: "",
    month: "",
    year: "",
  });
  
  // Estados para controlar la visibilidad de los menús
  const [menuVisible, setMenuVisible] = useState({
    day: false,
    month: false,
    year: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [securePass, setSecurePass] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  // Generar opciones para los selectores
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  const setField = (key: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  // Función para actualizar la fecha completa cuando cambian los selectores
  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const formattedDate = `${year}-${month}-${day}`;
      setForm(prev => ({ ...prev, birthDate: formattedDate }));
    }
  };

  // Funciones para manejar los cambios en los selectores
  const handleDateSelectorChange = (type: 'day' | 'month' | 'year', value: string) => {
    const newSelectors = { ...dateSelectors, [type]: value };
    setDateSelectors(newSelectors);
    setMenuVisible(prev => ({ ...prev, [type]: false }));
    updateBirthDate(newSelectors.day, newSelectors.month, newSelectors.year);
  };

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

  const parseBirthDateToISO = (input: string) => {
    // El input ya viene en formato YYYY-MM-DD desde los selectores
    if (!input) return new Date().toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(input).toISOString();
    // Fallback para otros formatos por compatibilidad
    const parts = input.includes("/") ? input.split("/") : input.split("-");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return new Date(`${y}-${m}-${d}`).toISOString();
    }
    return new Date(input).toISOString();
  };

  const validateForm = () => {
    const { firstName, lastName, birthDate, dni, email, password, confirmPassword } = form;
    if (![firstName, lastName, birthDate, dni, email, password].every(Boolean)) {
      Alert.alert("Error", "Completa todos los campos obligatorios (*) antes de continuar.");
      return false;
    }
    if (!isEmailValid(email)) {
      Alert.alert("Error", "Ingresa un correo válido.");
      return false;
    }
    if (!isPasswordValid(password)) {
      Alert.alert("Contraseña débil", "La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  // Subcomponente para móvil: Google Auth con Expo Auth Session
  function GoogleMobileRegisterButton() {
    const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);
    return (
      <Button
        mode="outlined"
        icon="google"
        style={styles.googleButton}
        contentStyle={styles.googleButtonContent}
        onPress={async () => {
          try {
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
              Alert.alert("Error", "No se pudo registrar/iniciar con Google (Firebase)");
              return;
            }
            // Sincronizar con API (update o create)
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
                  bio: "",
                  password: randomPassword,
                  socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
                  dtNacimiento: new Date().toISOString(),
                };
                await createUsuario(createPayload as any);
              }
              nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
            } catch (syncErr) {
              console.error("Google register sync error:", syncErr);
              Alert.alert("Atención", "Te registraste con Google pero no se pudo sincronizar con la base de datos.");
            }
          } catch (e) {
            Alert.alert("Error", "No se pudo completar el registro con Google");
          }
        }}
      >
        Registrarse con Google
      </Button>
    );
  }

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      const payload = {
        domicilio: {
          localidad: { nombre: "", codigo: "" },
          municipio: { nombre: "", codigo: "" },
          provincia: { nombre: "", codigo: "" },
          direccion: "",
          latitud: 0,
          longitud: 0,
        },
        nombre: form.firstName.trim(),
        apellido: form.lastName.trim(),
        correo: form.email.trim(),
        cbu: "",
        dni: form.dni.trim(),
        telefono: form.phone.trim(),
        nombreFantasia: "",
        bio: "",
        password: form.password,
        socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
        dtNacimiento: parseBirthDateToISO(form.birthDate),
      };

      await apiClient.post("/v1/Usuario/CreateUsuario", payload, {
        headers: { "Content-Type": "application/json" },
      });

      Alert.alert("¡Éxito!", "Tu cuenta se ha registrado correctamente.");
      nav.replace(router, ROUTES.LOGIN.LOGIN);
    } catch (err: any) {
      console.error("Error CreateUsuario:", err);
      if (err.response?.data?.errors) {
        const msgs = Object.entries(err.response.data.errors)
          .map(([field, arr]: any) => `${field}: ${(arr as string[]).join(", ")}`)
          .join("\n");
        Alert.alert("Validación", msgs);
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              {/* Registro mediante Google (Firebase) y/o email/contraseña */}

              {isWeb ? (
                <Button
                  mode="outlined"
                  icon="google"
                  style={styles.googleButton}
                  contentStyle={styles.googleButtonContent}
                  onPress={async () => {
                    try {
                      const u = await loginWithGooglePopup?.();
                      if (!u) {
                        Alert.alert("Error", "No se pudo registrar/iniciar con Google (Firebase)");
                        return;
                      }
                      // Sincronizar con API: update si existe, si no create
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
                            bio: "",
                            password: randomPassword,
                            socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
                            dtNacimiento: new Date().toISOString(),
                          };
                          await createUsuario(createPayload as any);
                        }
                      } catch (syncErr) {
                        console.error("Google register sync error:", syncErr);
                        Alert.alert("Atención", "Te registraste con Google pero no se pudo sincronizar con la base de datos.");
                      }
                      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
                    } catch (e) {
                      Alert.alert("Error", "No se pudo completar el registro con Google");
                    }
                  }}
                >
                  Registrarse con Google
                </Button>
              ) : hasAnyClientId ? (
                <GoogleMobileRegisterButton />
              ) : (
                <Button
                  mode="outlined"
                  icon="google"
                  style={styles.googleButton}
                  contentStyle={styles.googleButtonContent}
                  onPress={() =>
                    Alert.alert(
                      "Configuración requerida",
                      "Faltan clientIds de Google en app.json (EXPO_PUBLIC_GOOGLE_*) para usar Google en móvil."
                    )
                  }
                >
                  Registrarse con Google
                </Button>
              )}

              <Text variant="headlineMedium" style={[styles.title, { color: globalStyles.COLORS.textPrimary }]}>
                Registrarse
              </Text>
              <Text style={styles.subtitle}>Completa tus datos para crear tu cuenta o regístrate con Google</Text>

              <TextInput
                mode="flat"
                label="Nombre*"
                placeholder="Juan"
                value={form.firstName}
                onChangeText={(t) => setField("firstName", t)}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Apellido*"
                placeholder="Pérez"
                value={form.lastName}
                onChangeText={(t) => setField("lastName", t)}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <Text style={styles.dateLabel}>Fecha de nacimiento*</Text>
              <View style={styles.dateContainer}>
                {/* Selector de Día */}
                <View style={styles.selectorContainer}>
                  <Menu
                    visible={menuVisible.day}
                    onDismiss={() => setMenuVisible(prev => ({ ...prev, day: false }))}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setMenuVisible(prev => ({ ...prev, day: true }))}
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {dateSelectors.day || "Día"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScrollView}>
                      {days.map((day) => (
                        <Menu.Item
                          key={day}
                          onPress={() => handleDateSelectorChange('day', day)}
                          title={day}
                          titleStyle={styles.menuItemTitle}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>

                {/* Selector de Mes */}
                <View style={styles.selectorContainer}>
                  <Menu
                    visible={menuVisible.month}
                    onDismiss={() => setMenuVisible(prev => ({ ...prev, month: false }))}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setMenuVisible(prev => ({ ...prev, month: true }))}
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {months.find(m => m.value === dateSelectors.month)?.label || "Mes"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScrollView}>
                      {months.map((month) => (
                        <Menu.Item
                          key={month.value}
                          onPress={() => handleDateSelectorChange('month', month.value)}
                          title={month.label}
                          titleStyle={styles.menuItemTitle}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>

                {/* Selector de Año */}
                <View style={styles.selectorContainer}>
                  <Menu
                    visible={menuVisible.year}
                    onDismiss={() => setMenuVisible(prev => ({ ...prev, year: false }))}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setMenuVisible(prev => ({ ...prev, year: true }))}
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {dateSelectors.year || "Año"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScrollView}>
                      {years.map((year) => (
                        <Menu.Item
                          key={year}
                          onPress={() => handleDateSelectorChange('year', year)}
                          title={year}
                          titleStyle={styles.menuItemTitle}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>
              </View>

              <TextInput
                mode="flat"
                label="DNI*"
                placeholder="12345678"
                value={form.dni}
                onChangeText={(t) => setField("dni", t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Correo*"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChangeText={(t) => setField("email", t)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={<TextInput.Icon icon="email-outline" color="#6b7280" />}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Celular"
                placeholder="(+54) 9 11 1234-5678"
                value={form.phone}
                onChangeText={(t) => setField("phone", t)}
                keyboardType="phone-pad"
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <TextInput
                mode="flat"
                label="Contraseña*"
                placeholder="●●●●●●●●"
                value={form.password}
                onChangeText={(t) => setField("password", t)}
                secureTextEntry={securePass}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={securePass ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setSecurePass((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <HelperText type="info" visible>
                La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.
              </HelperText>

              <TextInput
                mode="flat"
                label="Confirmar contraseña*"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChangeText={(t) => setField("confirmPassword", t)}
                secureTextEntry={secureConfirm}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={secureConfirm ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setSecureConfirm((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Registrarme
              </Button>

              <Text style={styles.smallText}>Al registrarte aceptas los términos y condiciones.</Text>
            </View>
            {/* Términos y privacidad (igual que login) */}
            <View style={styles.termsRow}
            >
              <Text style={styles.termsText}>Al continuar, aceptas nuestros </Text>
              <Text onPress={() => Alert.alert('Términos de Servicio', 'Próximamente.')} style={styles.termsLink}>Términos de Servicio</Text>
              <Text style={styles.termsText}>  </Text>
              <Text onPress={() => Alert.alert('Política de Privacidad', 'Próximamente.')} style={styles.termsLink}>Política de Privacidad</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// GoogleButton removed

const COLORS = {
  primary: "#7c3aed", // morado vibrante
  inputBg: "#ffffff", // modo claro: inputs blancos
  cardBg: "#ffffff", // fondo tarjeta claro
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 18,
    color: "#6b7280",
  },
  button: {
    marginTop: 8,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
  googleButton: {
    borderRadius: 25,
    borderColor: "#d1d5db",
    marginBottom: 12,
    height: 50,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleButtonTop: {
    borderRadius: 10,
    borderColor: "#d1d5db",
    marginBottom: 18,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleButtonContent: { height: 50 },
  buttonContent: {
    height: 48,
    justifyContent: "center",
  },
  smallText: {
    textAlign: "center",
    marginTop: 12,
    color: "#6b7280",
    fontSize: 12,
  },
  termsRow: { marginTop: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  termsText: { color: '#6b7280' },
  termsLink: { color: '#7c3aed', fontWeight: '600' },

  /* Copiado desde login.tsx: estilos de inputs mejorados */
  input: {
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    height: 56,
    paddingHorizontal: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 2,
  },

  /* Estilos para selectores de fecha */
  dateLabel: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  selectorContainer: {
    flex: 1,
  },
  dateSelector: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "#d1d5db",
    borderWidth: 1,
    minHeight: 48,
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Elevation para Android
    elevation: 1,
  },
  dateSelectorContent: {
    height: 48,
    justifyContent: 'center',
  },
  dateSelectorLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  menuContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 4,
  },
  menuScrollView: {
    maxHeight: 180,
  },
  menuItemTitle: {
    fontSize: 14,
    color: "#374151",
  },

});
