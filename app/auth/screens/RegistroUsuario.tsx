// RegisterUserScreen (refactor simple, estilo JR)

// imports
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Portal,
  Modal,
  Menu,
} from "react-native-paper";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import GoogleSignInButton from "@/app/auth/components/GoogleSignInButtonComponent";

import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/app/auth/AuthContext";
import useVerifyEmail from "@/app/auth/services/user/useVerifyEmail";
import useCreateUser from "@/app/auth/services/user/useCreateUser";
import InfoTyc from "@/components/infoTyc";
import { parseBirthDateToISO } from "@/utils/formatDate";

// helpers (simples y en español para claridad)
// valida email básico
const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value);
// valida contraseña con requisitos mínimos
const isPasswordValid = (value: string) =>
  value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
// opciones fijas para día/mes/año
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);
const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) =>
  (CURRENT_YEAR - i).toString()
);
export default function RegisterUserScreen() {
  // componente principal
  const router = useRouter();
  const {
    loginWithGooglePopup,
    login,
    loginOrCreateWithGoogleIdToken,
    loginOrCreateWithGoogleProfile,
  } = useAuth() as any;

  // platform flags simples
  const isWeb = Platform.OS === "web";
  const isExpoGo = Constants.appOwnership === "expo";

  // completar sesión OAuth (requerido por expo-auth-session)
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // clientIds desde extra
  const EXTRA: any =
    (Constants as any)?.expoConfig?.extra ||
    (Constants as any)?.manifest2?.extra ||
    {};
  const expoClientId =
    EXTRA.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
    EXTRA.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    undefined;
  const iosClientId = EXTRA.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const androidClientId =
    EXTRA.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
  const webClientId = EXTRA.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;
  const hasAnyClientId = !!(iosClientId || androidClientId || expoClientId);

  // estado del formulario (nombres en inglés, UI en español)
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

  // partes de fecha de nacimiento (simple)
  const [birthParts, setBirthParts] = useState({
    day: "",
    month: "",
    year: "",
  });

  // menú abierto (un solo menú a la vez)
  const [openMenu, setOpenMenu] = useState<null | "day" | "month" | "year">(
    null
  );

  // otros estados
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(true);
  const [showConfirm, setShowConfirm] = useState(true);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // opciones de fecha (tomadas de helpers)
  const dayOptions = DAY_OPTIONS;
  const monthOptions = MONTH_OPTIONS;
  const yearOptions = YEAR_OPTIONS;

  // actualizar campo
  const setField = (key: keyof typeof form, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  // actualizar fecha de nacimiento desde selects
  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const formatted = `${year}-${month}-${day}`;
      setForm((s) => ({ ...s, birthDate: formatted }));
    }
  };

  // seleccionar opciones (cada una cierra su modal)
  const onSelectDay = (v: string) => {
    const next = { ...birthParts, day: v };
    setBirthParts(next);
    setOpenMenu(null);
    updateBirthDate(next.day, next.month, next.year);
  };
  const onSelectMonth = (v: string) => {
    const next = { ...birthParts, month: v };
    setBirthParts(next);
    setOpenMenu(null);
    updateBirthDate(next.day, next.month, next.year);
  };
  const onSelectYear = (v: string) => {
    const next = { ...birthParts, year: v };
    setBirthParts(next);
    setOpenMenu(null);
    updateBirthDate(next.day, next.month, next.year);
  };

  // validación del form
  const validateForm = () => {
    const {
      firstName,
      lastName,
      birthDate,
      dni,
      email,
      password,
      confirmPassword,
    } = form;
    if (
      ![firstName, lastName, birthDate, dni, email, password].every(Boolean)
    ) {
      Alert.alert(
        "Error",
        "Completa todos los campos obligatorios (*) antes de continuar."
      );
      return false;
    }
    if (!isEmailValid(email)) {
      Alert.alert("Error", "Ingresa un correo válido.");
      return false;
    }
    if (!isPasswordValid(password)) {
      Alert.alert(
        "Contraseña débil",
        "La contraseña debe tener al menos 8 caracteres, incluir una letra y un número."
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  // hooks para crear usuario y enviar verificacion
  const { creating, error: createError, createUser } = useCreateUser();
  const { sending, error: sendError, sendVerifyEmail } = useVerifyEmail();

  // registro (ahora delega en hooks)
  const onRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
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
        bio: "0",
        password: form.password,
        socials: {
          idSocial: "",
          mdInstagram: "",
          mdSpotify: "",
          mdSoundcloud: "",
        },
        dtNacimiento: parseBirthDateToISO(form.birthDate),
      };

      // crear usuario usando hook
      await createUser(payload);

      // enviar email de confirmación (best-effort) usando hook
      let mailOk = false;
      try {
        await sendVerifyEmail({
          to: form.email.trim(),
          name: form.firstName.trim(),
          confirmationUrl: "https://raveapp.com.ar/confirmacion-mail",
        });
        mailOk = true;
      } catch {}

      // auto login (best-effort)
      try {
        await login(form.email.trim(), form.password);
      } catch {}

      const emailStr = form.email.trim();
      const msg = mailOk
        ? `Tu registro se realizó con éxito. Te enviamos un correo a ${emailStr} para confirmar tu email. Si no lo ves, revisa la carpeta de spam/promociones.`
        : "Tu cuenta se ha registrado correctamente.";

      setSuccessMessage(msg);
      setSuccessVisible(true);
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        const msgs = Object.entries(err.response.data.errors)
          .map(
            ([field, arr]: any) => `${field}: ${(arr as string[]).join(", ")}`
          )
          .join("\n");
        Alert.alert("Validación", msgs);
      } else {
        const msg =
          createError ||
          sendError ||
          err?.message ||
          "No se pudo crear la cuenta. Intenta de nuevo.";
        Alert.alert("Error", String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* fondo claro consistente */}
      <SafeAreaView
        style={[
          styles.root,
          { backgroundColor: globalStyles.COLORS.backgroundLight },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{
              flex: 1,
              backgroundColor: globalStyles.COLORS.backgroundLight,
            }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* modal de éxito simple */}
            <Portal>
              <Modal
                visible={successVisible}
                onDismiss={() => {}}
                contentContainerStyle={styles.successModal}
              >
                <View style={styles.successHeaderIcon}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>¡Registro exitoso!</Text>
                <Text style={styles.successText}>{successMessage}</Text>
                <Button
                  mode="contained"
                  style={styles.successButton}
                  contentStyle={{ height: 48 }}
                  onPress={() => {
                    setSuccessVisible(false);
                    nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
                  }}
                >
                  Aceptar
                </Button>
              </Modal>

              {/* menús de selección (como antes) */}
            </Portal>

            <View style={styles.card}>
              {/* registro con Google o email/contraseña */}
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
                        Alert.alert(
                          "Error",
                          "No se pudo registrar/iniciar con Google (Firebase)"
                        );
                        return;
                      }
                      const email =
                        (u as any)?.username || (u as any)?.email || "";
                      const givenName =
                        (u as any)?.nombre || (u as any)?.displayName || "";
                      const familyName = (u as any)?.apellido || "";
                      const ok = await loginOrCreateWithGoogleProfile?.({
                        email,
                        givenName,
                        familyName,
                      });
                      if (!ok) {
                        Alert.alert(
                          "Atención",
                          "No se pudo sincronizar tu cuenta de Google con la base de datos."
                        );
                        return;
                      }
                      nav.replace(router, ROUTES.MAIN.EVENTS.MENU);
                    } catch {
                      Alert.alert(
                        "Error",
                        "No se pudo completar el registro con Google"
                      );
                    }
                  }}
                >
                  Registrarse con Google
                </Button>
              ) : hasAnyClientId ? (
                <GoogleSignInButton
                  expoClientId={expoClientId}
                  iosClientId={iosClientId}
                  androidClientId={androidClientId}
                  webClientId={webClientId}
                  useProxy={isExpoGo}
                  onLogin={loginOrCreateWithGoogleIdToken}
                  onSuccess={() => nav.replace(router, ROUTES.MAIN.EVENTS.MENU)}
                >
                  Registrarse con Google
                </GoogleSignInButton>
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

              {/* separador visual debajo del botón Google */}
              <View style={styles.socialSeparatorContainer}>
                <View style={styles.socialLine} />
                <Text style={styles.socialSeparatorText}>o regístrate debajo</Text>
                <View style={styles.socialLine} />
              </View>

              <Text
                variant="headlineMedium"
                style={[
                  styles.title,
                  { color: globalStyles.COLORS.textPrimary },
                ]}
              >
                Registrarse
              </Text>
              <Text style={styles.subtitle}>
                Completa tus datos para crear tu cuenta o regístrate con Google
              </Text>

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
                {/* Día */}
                <View style={styles.selectorContainer} collapsable={false}>
                  <Menu
                    visible={openMenu === "day"}
                    onDismiss={() => setOpenMenu(null)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() =>
                          setOpenMenu(openMenu === "day" ? null : "day")
                        }
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {birthParts.day || "Día"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScroll}>
                      {dayOptions.map((d) => (
                        <Menu.Item
                          key={d}
                          onPress={() => onSelectDay(d)}
                          title={d}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>

                {/* Mes */}
                <View style={styles.selectorContainer} collapsable={false}>
                  <Menu
                    visible={openMenu === "month"}
                    onDismiss={() => setOpenMenu(null)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() =>
                          setOpenMenu(openMenu === "month" ? null : "month")
                        }
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {monthOptions.find((m) => m.value === birthParts.month)
                          ?.label || "Mes"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScroll}>
                      {monthOptions.map((m) => (
                        <Menu.Item
                          key={m.value}
                          onPress={() => onSelectMonth(m.value)}
                          title={m.label}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>

                {/* Año */}
                <View style={styles.selectorContainer} collapsable={false}>
                  <Menu
                    visible={openMenu === "year"}
                    onDismiss={() => setOpenMenu(null)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() =>
                          setOpenMenu(openMenu === "year" ? null : "year")
                        }
                        style={styles.dateSelector}
                        contentStyle={styles.dateSelectorContent}
                        labelStyle={styles.dateSelectorLabel}
                      >
                        {birthParts.year || "Año"}
                      </Button>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScroll}>
                      {yearOptions.map((y) => (
                        <Menu.Item
                          key={y}
                          onPress={() => onSelectYear(y)}
                          title={y}
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
                secureTextEntry={showPass}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={showPass ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setShowPass((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <HelperText type="info" visible>
                La contraseña debe tener al menos 8 caracteres, incluir una
                letra y un número.
              </HelperText>

              <TextInput
                mode="flat"
                label="Confirmar contraseña*"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChangeText={(t) => setField("confirmPassword", t)}
                secureTextEntry={showConfirm}
                style={styles.input}
                textColor="#111827"
                placeholderTextColor="#6b7280"
                right={
                  <TextInput.Icon
                    icon={showConfirm ? "eye" : "eye-off"}
                    color="#6b7280"
                    onPress={() => setShowConfirm((s) => !s)}
                    forceTextInputFocus={false}
                  />
                }
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />

              <Button
                mode="contained"
                onPress={onRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Registrarme
              </Button>

              {/* aviso debajo del botón removido a pedido */}
            </View>

            <InfoTyc />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const COLORS = {
  // colores simples
  primary: "#7c3aed",
  inputBg: "#ffffff",
  cardBg: "#ffffff",
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // modal de éxito
  successModal: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  successHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eaf7ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  successCheck: {
    color: "#16a34a",
    fontSize: 24,
    fontWeight: "700",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  successText: {
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  successButton: {
    alignSelf: "stretch",
    borderRadius: 12,
    backgroundColor: "#0f172a",
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
    marginBottom: 20,
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
  termsRow: {
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  termsText: { color: "#6b7280" },
  termsLink: { color: "#7c3aed", fontWeight: "600" },

  // inputs simples
  input: {
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    height: 56,
    paddingHorizontal: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },

  // selectores de fecha
  dateLabel: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  dateSelectorContent: {
    height: 48,
    justifyContent: "center",
  },
  dateSelectorLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },

  // modales de selección
  pickModal: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    width: "90%",
    maxWidth: 380,
    alignSelf: "center",
    maxHeight: 360,
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  pickList: { maxHeight: 280 },
  pickItem: { alignSelf: "flex-start" },
  // menú rnp
  menuContent: {
    backgroundColor: "#fff",
    maxHeight: 240,
  },
  menuScroll: {
    maxHeight: 200,
  },
  socialSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  socialLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e6e9ef",
  },
  socialSeparatorText: {
    marginHorizontal: 12,
    color: "#6b7280",
    fontSize: 12,
  },
});
