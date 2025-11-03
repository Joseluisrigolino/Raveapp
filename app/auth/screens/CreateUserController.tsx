import React from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { Text, TextInput, Button, Divider } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import UCInfoAlert from "../components/user-controller/UCInfoAlert";
import UCUserRow from "../components/user-controller/UCUserRow";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import { createControllerUser, getControllerUsers } from "../apis/user-controller/controllerApi";
import { ControllerUser } from "@/app/auth/types/ControllerUser";

export default function CreateUserController() {
	const { user } = useAuth() as any;
	const [login, setLogin] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [secure, setSecure] = React.useState(true);
	const [users, setUsers] = React.useState<ControllerUser[]>([]);
	const [orgId, setOrgId] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState<boolean>(false);
	const [submitting, setSubmitting] = React.useState<boolean>(false);

	React.useEffect(() => {
		(async () => {
			try {
				if (!user?.username) return;
				const profile = await getProfile(user.username);
				const idUsuario = String(profile?.idUsuario ?? "");
				if (idUsuario) {
					setOrgId(idUsuario);
					setLoading(true);
						try {
							const apiUsers = await getControllerUsers(idUsuario);
							setUsers(apiUsers);
						} finally {
						setLoading(false);
					}
				}
			} catch (e) {
				// fallback: lista vacía
			}
		})();
	}, [user?.username]);

	const canCreate = login.trim().length > 0 && password.length >= 4 && !submitting;

		const handleCreate = async () => {
			const u = login.trim();
			if (!u) return;
			if (!orgId) {
				Alert.alert("Sin organización", "No se pudo determinar el ID de organizador.");
				return;
			}
			try {
				setSubmitting(true);
				await createControllerUser({ idUsuarioOrg: orgId, nombreUsuario: u, password });
				// refrescar lista
				const apiUsers = await getControllerUsers(orgId);
				setUsers(apiUsers);
				setLogin("");
				setPassword("");
			} catch (e: any) {
				Alert.alert("Error", "No se pudo crear el usuario controlador.");
			} finally {
				setSubmitting(false);
			}
		};

	const handleDelete = (u: string) => {
		Alert.alert("Eliminar", `¿Eliminar ${u}?`, [
			{ text: "Cancelar", style: "cancel" },
			{ text: "Eliminar", style: "destructive", onPress: () => setUsers((prev) => prev.filter((x) => x.username !== u)) },
		]);
	};

	return (
		<KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
				{/* Título y descripción */}
				<View style={styles.header}>
					<View style={styles.headerRow}>
						<View style={styles.headerIcon}><Icon name="security" size={18} color="#0f172a" /></View>
						<Text style={styles.headerTitle}>Usuarios Controladores</Text>
					</View>
					<Text style={styles.headerDesc}>
						Creá credenciales para el personal que controla entradas en la puerta. Podés generar tantos usuarios como necesites para tu equipo.
					</Text>
				</View>

				{/* Crear Nuevo Usuario */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Crear Nuevo Usuario</Text>

					<Text style={styles.label}>Nombre de Usuario (Login)</Text>
					<TextInput
						mode="outlined"
						placeholder="controlador.01"
						placeholderTextColor="rgba(107,114,128,0.4)"
						value={login}
						onChangeText={setLogin}
						left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
						style={styles.input}
						outlineStyle={{ borderRadius: 14 }}
					/>

					<Text style={styles.label}>Contraseña</Text>
					<TextInput
						mode="outlined"
						placeholder="••••••••"
						placeholderTextColor="rgba(107,114,128,0.4)"
						secureTextEntry={secure}
						value={password}
						onChangeText={setPassword}
						left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
						right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} color="#6b7280" onPress={() => setSecure((s) => !s)} />}
						style={styles.input}
						outlineStyle={{ borderRadius: 14 }}
					/>

					<Button
						mode="contained"
						onPress={handleCreate}
						disabled={!canCreate}
						style={styles.primaryBtn}
						contentStyle={{ height: 50 }}
						labelStyle={{ fontWeight: "700", color: "#ffffff" }}
						icon={({ size, color }) => <Icon name="person-add" size={size} color={color} />}
					>
						Crear Usuario Controlador
					</Button>
				</View>

				{/* Info */}
				<UCInfoAlert>
					Recordá: si alguien olvida la contraseña, tenés que eliminar ese usuario y crear uno nuevo. No existe recuperación de contraseña.
				</UCInfoAlert>

				{/* Lista de usuarios */}
				<View style={styles.cardList}>
					<Text style={styles.cardTitle}>Usuarios Creados</Text>
					<Divider style={styles.divider} />
								{users.map((u) => (
									<UCUserRow key={u.username} username={u.username} onDelete={() => handleDelete(u.username)} />
					))}

					<View style={styles.tipRow}>
						<View style={styles.tipIcon}><Icon name="info" size={16} color="#0f172a" /></View>
						<Text style={styles.tipText}>Si alguien se queda sin acceso, simplemente eliminálo y crea otro usuario nuevo con otra contraseña</Text>
					</View>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerMuted}>Sistema de Gestión de Controladores v2.1.5</Text>
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
	container: { flexGrow: 1, padding: 16, backgroundColor: "#f5f6fa" },
	header: { marginBottom: 10 },
	headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
	headerIcon: {
		width: 26,
		height: 26,
		borderRadius: 6,
		backgroundColor: "#eef2ff",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 8,
		borderWidth: 1,
		borderColor: "#e6e9ef",
	},
	headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
	headerDesc: { color: "#6b7280" },

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
		marginBottom: 12,
	},
	cardList: {
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
		marginTop: 12,
	},
	cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
	label: { color: "#6b7280", marginBottom: 6, marginTop: 8 },
	input: { marginBottom: 8, backgroundColor: "#fff" },
	primaryBtn: { borderRadius: 12, backgroundColor: "#0f172a", marginTop: 8 },
	divider: { marginVertical: 10, backgroundColor: "#e6e9ef" },

	tipRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
	tipIcon: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#eef2ff",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 8,
		borderWidth: 1,
		borderColor: "#e6e9ef",
	},
	tipText: { color: "#6b7280", flex: 1 },

	footer: { alignItems: "center", marginTop: 16, marginBottom: 8 },
	footerMuted: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
	footerLinksRow: { flexDirection: "row", alignItems: "center" },
	footerLink: { color: "#0f172a", fontWeight: "600", fontSize: 12 },
	footerDivider: { color: "#9ca3af", fontSize: 12 },
});
