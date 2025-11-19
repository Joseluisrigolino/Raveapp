import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import useLoginUserController from "@/app/auth/services/user-controllers/useLoginUserController";

// helper: revisa si una cadena no está vacía
const isNotEmpty = (value: string) => value.trim().length > 0;

// Pantalla principal: versión simplificada con nombres en inglés
export default function ControllerLoginScreen() {
	// estados simples
	const [user, setUser] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(true);

	// usamos el hook que encapsula el login
	const { login, loading } = useLoginUserController();

	const canSubmit = user.trim().length > 0 && password.length > 0 && !loading;

	// al presionar el botón pedimos al hook que haga el login
	const onPressLogin = () => {
		login(user, password);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.select({ ios: "padding", android: undefined })}
			style={{ flex: 1 }}
		>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
				{/* tarjeta principal */}
				<View style={styles.card}>
					<Text style={styles.title}>Acceso de Controlador</Text>

					{/* badge que indica personal autorizado */}
					<View style={styles.badgeRow}>
						<View style={styles.badge}>
							<Icon name="verified-user" size={18} color="#0f172a" />
							<Text style={styles.badgeText}> Solo personal autorizado</Text>
						</View>
					</View>

					{/* campo de usuario */}
					<Text style={styles.label}>Nombre de Usuario</Text>
					<TextInput
						mode="outlined"
						placeholder="usuario.controlador"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						value={user}
						onChangeText={setUser}
						left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
						style={styles.input}
					/>

					{/* campo de contraseña */}
					<Text style={styles.label}>Contraseña</Text>
					<TextInput
						mode="outlined"
						placeholder="••••••••"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						secureTextEntry={showPassword}
						value={password}
						onChangeText={setPassword}
						left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
						right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} color="#6b7280" onPress={() => setShowPassword(!showPassword)} />}
						style={styles.input}
					/>

					{/* botón de envío simple */}
					<Button
						mode="contained"
						onPress={onPressLogin}
						disabled={!canSubmit}
						style={styles.submitButton}
						contentStyle={{ height: 50 }}
						labelStyle={{ fontWeight: "700", color: "#ffffff" }}
						loading={loading}
					>
						Acceder como Controlador
					</Button>

					{/* mensaje para recuperación de contraseña */}
					<Pressable onPress={() => { /* recuperación no disponible aquí */ }}>
						<Text style={styles.forgot}>Si olvidaste tu contraseña, solicítala al usuario organizador.</Text>
					</Pressable>
				</View>

				{/* footer simple */}
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
	submitButton: {
		borderRadius: 12,
		backgroundColor: "#0f172a",
		marginTop: 6,
		marginBottom: 10,
	},
	forgot: { color: "#9ca3af", textAlign: "center" },
	footer: { alignItems: "center", marginTop: 16, marginBottom: 8 },
	footerMuted: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
	footerLinksRow: { flexDirection: "row", alignItems: "center" },
	footerLink: { color: "#0f172a", fontWeight: "600", fontSize: 12 },
	footerDivider: { color: "#9ca3af", fontSize: 12 },
});

