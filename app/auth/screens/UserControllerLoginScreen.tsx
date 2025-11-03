import React from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ROUTES from "@/routes";
import { loginControllerUser } from "@/app/auth/apis/user-controller/controllerApi";

export default function UserControllerLogin() {
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [secure, setSecure] = React.useState(true);
	// Eliminado 'Recordar mis credenciales'

	const canSubmitBase = username.trim().length > 0 && password.length > 0;
	const [submitting, setSubmitting] = React.useState(false);
	const canSubmit = canSubmitBase && !submitting;

	const router = useRouter();

		const handleSubmit = async () => {
			if (!canSubmitBase) return;
			try {
				setSubmitting(true);
				const ok = await loginControllerUser(username.trim(), password);
				if (!ok) {
					Alert.alert("Acceso denegado", "Usuario o contraseña inválidos para controlador.");
					return;
				}
				router.replace({ pathname: ROUTES.CONTROLLER.SCANNER, params: { user: username.trim() } });
			} catch (e: any) {
				Alert.alert("Error", "No se pudo validar las credenciales del controlador.");
			} finally {
				setSubmitting(false);
			}
		};

	return (
		<KeyboardAvoidingView
			behavior={Platform.select({ ios: "padding", android: undefined })}
			style={{ flex: 1 }}
		>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
				{/* Card principal */}
				<View style={styles.card}>
					<Text style={styles.title}>Acceso de Controlador</Text>

					{/* Badge */}
					<View style={styles.badgeRow}>
						<View style={styles.badge}>
							<Icon name="verified-user" size={18} color="#0f172a" />
							<Text style={styles.badgeText}> Solo personal autorizado</Text>
						</View>
					</View>

					{/* Usuario */}
					<Text style={styles.label}>Nombre de Usuario</Text>
					<TextInput
						mode="outlined"
						placeholder="usuario.controlador"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						value={username}
						onChangeText={setUsername}
						left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
						style={styles.input}
						outlineStyle={{ borderRadius: 14 }}
					/>

					{/* Password */}
					<Text style={styles.label}>Contraseña</Text>
					<TextInput
						mode="outlined"
						placeholder="••••••••"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						secureTextEntry={secure}
						value={password}
						onChangeText={setPassword}
						left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
						right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} color="#6b7280" onPress={() => setSecure((s) => !s)} />}
						style={styles.input}
						outlineStyle={{ borderRadius: 14 }}
					/>

								{/* (Recordar mis credenciales) Quitado */}

					{/* Botón */}
								<Button
						mode="contained"
						onPress={handleSubmit}
						disabled={!canSubmit}
						style={styles.submitButton}
									contentStyle={{ height: 50 }}
												labelStyle={{ fontWeight: "700", color: "#ffffff" }}
												loading={submitting}
					>
						Acceder como Controlador
					</Button>

					{/* ¿Olvidaste tu contraseña? */}
					<Pressable onPress={() => { /* Recuperación próximamente */ }}> 
						<Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
					</Pressable>
				</View>

				{/* Información de Seguridad */}
				<View style={styles.infoCard}>
					<View style={styles.infoHeader}>
						<Icon name="info" size={18} color="#0f172a" />
						<Text style={styles.infoTitle}> Información de Seguridad</Text>
					</View>

								<View style={styles.infoRow}>
									<View style={styles.infoIconCircle}><Icon name="schedule" size={18} color="#0f172a" /></View>
									<Text style={styles.infoText}>Sesión válida hasta terminar el evento</Text>
								</View>
					<View style={styles.infoRow}>
						<View style={styles.infoIconCircle}><Icon name="fact-check" size={18} color="#0f172a" /></View>
						<Text style={styles.infoText}>Actividad monitoreada y registrada</Text>
					</View>
								{/* Soporte 24/7 quitado */}
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerMuted}>Sistema de Control Autorizado v2.1.5</Text>
					<View style={styles.footerLinksRow}>
						<Pressable onPress={() => Alert.alert("Manual de Usuario", "Próximamente.")}> 
							<Text style={styles.footerLink}>Manual de Usuario</Text>
						</Pressable>
						<Text style={styles.footerDivider}>  •  </Text>
						<Pressable onPress={() => Alert.alert("Soporte Técnico", "+1-800-RAVE-HELP")}> 
							<Text style={styles.footerLink}>Soporte Técnico</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 16,
		backgroundColor: "#f5f6fa",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: "#e6e9ef",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 4,
	},
	title: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
	badgeRow: { flexDirection: "row", marginBottom: 12 },
	badge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f3f4f6",
		borderWidth: 1,
		borderColor: "#e6e9ef",
		borderRadius: 10,
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	badgeText: { color: "#111827", fontWeight: "600" },
	label: { color: "#6b7280", marginBottom: 6, marginTop: 8 },
	input: { marginBottom: 8, backgroundColor: "#fff" },
	rememberRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
	rememberText: { color: "#374151" },
	submitButton: {
		borderRadius: 12,
		backgroundColor: "#0f172a",
		marginTop: 6,
		marginBottom: 10,
	},
	forgot: { color: "#0f172a", fontWeight: "600", textAlign: "center" },

	infoCard: {
		marginTop: 16,
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: "#e6e9ef",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 4,
	},
	infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
	infoTitle: { fontWeight: "700", color: "#111827" },
	infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
	infoIconCircle: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#eef2ff",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
		borderWidth: 1,
		borderColor: "#e6e9ef",
	},
	infoText: { color: "#374151" },

	footer: { alignItems: "center", marginTop: 16, marginBottom: 8 },
	footerMuted: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
	footerLinksRow: { flexDirection: "row", alignItems: "center" },
	footerLink: { color: "#0f172a", fontWeight: "600", fontSize: 12 },
	footerDivider: { color: "#9ca3af", fontSize: 12 },
});

