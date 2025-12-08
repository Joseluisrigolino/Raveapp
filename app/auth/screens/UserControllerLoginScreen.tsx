import React, { useState } from "react";
// Librerías de terceros
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Modal } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
// Import absoluto del hook de login de controlador
import useLoginUserController from "@/app/auth/services/user-controllers/useLoginUserController";

// Helper para validar que una cadena no esté vacía
const isNotEmpty = (value: string) => value.trim().length > 0;

// Pantalla de login para usuarios tipo "Controlador"
export default function UserControllerLoginScreen() {
	// Estado para mostrar el popup de alerta
	const [popupVisible, setPopupVisible] = useState(false);
	const [popupTitle, setPopupTitle] = useState<string>("");
	const [popupMessage, setPopupMessage] = useState<string>("");

	// Función para mostrar el popup con título y mensaje
	const showPopup = (title: string, message: string) => {
		setPopupTitle(title);
		setPopupMessage(message);
		setPopupVisible(true);
	};

	// Estados para los campos del formulario
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(true);

	// Hook que maneja el login del controlador
	const { login, loading } = useLoginUserController();

	// Validamos si el formulario está listo para enviar
	const canSubmit = isNotEmpty(username) && isNotEmpty(password) && !loading;

	// Handler para el botón de login
	const handleLogin = () => {
		login(username, password);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.select({ ios: "padding", android: undefined })}
			style={{ flex: 1 }}
		>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
				{/* Tarjeta principal de login */}
				<View style={styles.card}>
					<Text style={styles.title}>Acceso de Controlador</Text>

					{/* Badge que indica acceso autorizado */}
					<View style={styles.badgeRow}>
						<View style={styles.badge}>
							<Icon name="verified-user" size={18} color="#0f172a" />
							<Text style={styles.badgeText}> Solo personal autorizado</Text>
						</View>
					</View>

					{/* Campo de usuario */}
					<Text style={styles.label}>Nombre de Usuario</Text>
					<TextInput
						mode="outlined"
						placeholder="usuario.controlador"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						value={username}
						onChangeText={setUsername}
						left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
						style={styles.input}
					/>

					{/* Campo de contraseña */}
					<Text style={styles.label}>Contraseña</Text>
					<TextInput
						mode="outlined"
						placeholder="••••••••"
						placeholderTextColor="rgba(107, 114, 128, 0.4)"
						secureTextEntry={showPassword}
						value={password}
						onChangeText={setPassword}
						left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
						right={
							<TextInput.Icon
								icon={showPassword ? "eye" : "eye-off"}
								color="#6b7280"
								onPress={() => setShowPassword(!showPassword)}
							/>
						}
						style={styles.input}
					/>

					{/* Botón para enviar el login */}
					<Button
						mode="contained"
						onPress={handleLogin}
						disabled={!canSubmit}
						style={styles.submitButton}
						contentStyle={{ height: 50 }}
						labelStyle={{ fontWeight: "700", color: "#ffffff" }}
						loading={loading}
					>
						Acceder como Controlador
					</Button>

					{/* Mensaje para recuperación de contraseña */}
					<Pressable onPress={() => { /* recuperación no disponible aquí */ }}>
						<Text style={styles.forgot}>
							Si olvidaste tu contraseña, solicítala al usuario organizador.
						</Text>
					</Pressable>
				</View>

				

				{/* Popup de alerta unificado */}
				<Modal
					transparent
					animationType="fade"
					visible={popupVisible}
					onRequestClose={() => setPopupVisible(false)}
				>
					<View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 16 }}>
						<View style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", borderRadius: 14, padding: 16 }}>
							<Text style={{ fontWeight: "700", fontSize: 18, color: "#111827", marginBottom: 6 }}>{popupTitle}</Text>
							<Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 16 }}>{popupMessage}</Text>
							<View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
								<Pressable
									style={{
										paddingVertical: 10,
										paddingHorizontal: 20,
										borderRadius: 14,
										backgroundColor: "#0f172a",
										alignItems: "center",
										justifyContent: "center",
										minHeight: 44,
									}}
									onPress={() => setPopupVisible(false)}
								>
									<Text style={{ fontWeight: "700", fontSize: 16, color: "#fff" }}>OK</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
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

