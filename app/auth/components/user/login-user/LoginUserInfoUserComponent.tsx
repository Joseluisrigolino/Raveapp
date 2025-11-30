import { View, StyleSheet, Pressable, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { Link, useRouter } from "expo-router";



// Props para el formulario de login
interface LoginUserInfoUserComponentProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  secure: boolean;
  setSecure: (v: boolean) => void;
  loading: boolean;
  onLogin: () => void;
  socialNode?: React.ReactNode;
}

// Sección del formulario de inicio de sesión (inputs, recordar, botones)
export default function LoginUserInfoUserComponent({
  email,
  setEmail,
  password,
  setPassword,
  secure,
  setSecure,
  loading,
  onLogin,
  socialNode,
}: LoginUserInfoUserComponentProps) {
  const router = useRouter();

  // Validamos si se puede enviar el formulario
  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>Iniciar Sesión</Text>

      {/* Campo de email */}
      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        textColor={"#0f172a"}
        placeholderTextColor={"#4b5563"}
        selectionColor={"#0f172a"}
        outlineColor={"#e6e9ef"}
        activeOutlineColor="#0f172a"
        outlineStyle={{ borderRadius: 16 }}
        left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
      />

      {/* Campo de contraseña */}
      <TextInput
        mode="outlined"
        label="Contraseña"
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
        right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} color="#6b7280" onPress={() => setSecure(!secure)} forceTextInputFocus={false} />}
        left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
      />

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Pressable onPress={() => nav.push(router, ROUTES.LOGIN.RECOVER as any)} accessibilityRole="link">
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>
      </View>

      <Button mode="contained" onPress={onLogin} contentStyle={styles.buttonContent} style={styles.loginButton} labelStyle={{ fontWeight: "700", color: "#ffffff" }} disabled={!canSubmit} loading={loading}>
        Iniciar Sesión
      </Button>

      <View style={styles.dividerRowOutside}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>O continúa con</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>{socialNode}</View>

      <View style={styles.linksRowOutside}>
        <Link href={ROUTES.LOGIN.REGISTER as any} asChild>
          <Pressable accessibilityRole="link">
            <Text variant="bodySmall" style={styles.linkText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, backgroundColor: "#fff", borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: "#e6e9ef" },
  formTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12, textAlign: "left" },
  input: { marginBottom: 14, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", height: 56, paddingHorizontal: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  rememberText: { color: "#374151", marginLeft: 4, marginRight: 12 },
  forgotText: { color: "#0f172a", fontWeight: "600" },
  checkboxBox: { width: 20, height: 20, borderWidth: 2, borderColor: "#0f172a", borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  checkboxBoxChecked: { backgroundColor: "#0f172a" },
  checkboxTick: { color: "#ffffff", fontSize: 14, lineHeight: 14, fontWeight: "700" },
  googleButton: { borderRadius: 25, borderColor: "#d1d5db", marginBottom: 12, height: 50, justifyContent: "center", backgroundColor: "#fff" },
  googleButtonContent: { height: 50 },
  loginButton: { borderRadius: 25, height: 50, justifyContent: "center", backgroundColor: "#0f172a" },
  buttonContent: { height: 50 },
  dividerRowOutside: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 12, marginHorizontal: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { marginHorizontal: 8, color: "#6b7280" },
  socialRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 12 },
  linksRowOutside: { marginTop: 8, alignItems: "center" },
  linkText: { color: "#2563eb" },
});
