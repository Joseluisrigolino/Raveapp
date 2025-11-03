import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, BackHandler } from "react-native";
import { Text, Button, Divider, Chip } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import { getControllerUsers } from "@/app/auth/apis/user-controller/controllerApi";
import ROUTES from "@/routes";

export default function ScannerScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const params = useLocalSearchParams<{ user?: string }>();
	const { user, logout } = useAuth() as any;
	const loginParam = String(params?.user ?? "");
	const [controllerName, setControllerName] = React.useState<string>(loginParam || "Controlador");
	const [scanCount, setScanCount] = React.useState<number>(0); // reseteado a 0
	const [lastScans, setLastScans] = React.useState<any[]>([]); // vacío por ahora
	const allowExitRef = React.useRef(false);

	React.useEffect(() => {
		(async () => {
			try {
				if (!user?.username) {
					// si no hay usuario de app, mostramos el loginParam si vino
					if (loginParam) setControllerName(loginParam);
					return;
				}
				const profile = await getProfile(user.username);
				const orgId = String(profile?.idUsuario ?? "");
				if (!orgId) return;
				const controllers = await getControllerUsers(orgId);
				const match = controllers.find(c => c.username?.trim().toLowerCase() === loginParam.trim().toLowerCase());
				if (match?.username) setControllerName(match.username);
			} catch {
				// ignorar fallos; mantener nombre previo
			}
		})();
	}, [user?.username, loginParam]);

	// Bloquear vuelta atrás (hardware y gestos), salvo cuando hacemos logout explícito
	React.useEffect(() => {
		const onBack = () => true; // consumir back
		const subBack = BackHandler.addEventListener('hardwareBackPress', onBack);
		const subNav = navigation.addListener('beforeRemove', (e: any) => {
			if (!allowExitRef.current) {
				e.preventDefault();
			}
		});
		return () => {
			subBack.remove();
			subNav && (subNav as any)();
		};
	}, [navigation]);

	const handleActivateCamera = () => {
		Alert.alert("Escáner", "Activar Cámara (próximamente)");
	};

	const handleLogout = () => {
		try {
			allowExitRef.current = true; // permitir salir de esta pantalla
			logout && logout(); // cerrar sesión realmente (borra storage y estado)
		} finally {
			router.replace(ROUTES.LOGIN.LOGIN);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<View style={styles.headerBadge}>
						<Icon name="security" size={16} color="#e5e7eb" />
					</View>
					<View>
						<Text style={styles.headerTitle}>Panel Controlador</Text>
						<Text style={styles.headerSubtitle}>Control de Acceso QR</Text>
					</View>
				</View>
				<Pressable onPress={handleLogout}
					style={styles.headerRight}
				>
					<Icon name="logout" size={18} color="#e5e7eb" />
				</Pressable>
			</View>

			{/* Perfil */}
			<View style={styles.profileCard}>
				<View style={styles.profileLeft}>
					<View style={styles.avatar}>
						<Icon name="person" size={22} color="#0f172a" />
					</View>
					<View>
						<Text style={styles.profileName}>{controllerName}</Text>
					</View>
				</View>
			</View>

			{/* Stats */}
			<View style={styles.statsRow}>
				<View style={styles.statCard}>
					<View style={styles.statHeader}>
						<Icon name="qr-code-scanner" size={16} color="#6b7280" />
						<Chip compact style={styles.statPill} textStyle={{ fontSize: 12 }}>0</Chip>
					</View>
					<Text style={styles.statValue}>{scanCount}</Text>
					<Text style={styles.statLabel}>QRs Escaneados Hoy</Text>
				</View>
			</View>

			{/* Escáner QR */}
			<View style={styles.card}>
				<Text style={styles.cardTitle}>Escáner QR</Text>
				<View style={styles.scannerBox}>
					<View style={styles.scannerDashed}>
						<Icon name="qr-code-2" size={44} color="#9ca3af" />
						<Text style={styles.scannerHint}>Apunta la cámara al código QR</Text>
					</View>
				</View>
				<Button
					mode="contained"
					onPress={handleActivateCamera}
					style={styles.primaryBtn}
					contentStyle={{ height: 44 }}
					labelStyle={{ fontWeight: "700", color: "#ffffff" }}
				>
					Activar Cámara
				</Button>
				{/* Acciones extra removidas (Flash / Historial) */}
			</View>

			{/* Últimos Escaneos */}
			<View style={styles.card}>
				<View style={styles.listHeader}>
					<Text style={styles.cardTitle}>Últimos Escaneos</Text>
					<Pressable onPress={() => Alert.alert("Ver todos", "Próximamente")}> 
						<Text style={styles.link}>Ver todos</Text>
					</Pressable>
				</View>

				<Divider style={styles.divider} />

				{lastScans.length === 0 ? (
					<Text style={{ color: "#6b7280", textAlign: "center", marginVertical: 8 }}>No hay escaneos aún</Text>
				) : (
					lastScans.map((item, idx) => (
						<View key={idx} style={styles.listItem}>
							<View style={styles.itemLeft}>
								<View style={styles.itemIcon}><Icon name="confirmation-number" size={18} color="#0f172a" /></View>
								<View>
									<Text style={styles.itemTitle}>{item.title}</Text>
									<Text style={styles.itemSubtitle}>{item.subtitle}</Text>
								</View>
							</View>
							<Chip compact style={[styles.badge, item.valid ? styles.badgeValid : styles.badgeInvalid]} textStyle={{ color: item.valid ? "#065f46" : "#991b1b", fontWeight: "700" }}>
								{item.status}
							</Chip>
						</View>
					))
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16, backgroundColor: "#f5f6fa" },
	header: {
		backgroundColor: "#0f172a",
		borderRadius: 12,
		padding: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	headerLeft: { flexDirection: "row", alignItems: "center" },
	headerBadge: {
		width: 28,
		height: 28,
		borderRadius: 6,
		backgroundColor: "#111827",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
		borderWidth: 1,
		borderColor: "#1f2937",
	},
	headerTitle: { color: "#e5e7eb", fontWeight: "700" },
	headerSubtitle: { color: "#9ca3af", fontSize: 12 },
	headerRight: {
		width: 28,
		height: 28,
		borderRadius: 6,
		backgroundColor: "#111827",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#1f2937",
	},

	profileCard: {
		backgroundColor: "#0f172a",
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
	},
	profileLeft: { flexDirection: "row", alignItems: "center" },
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#f9fafb",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	profileName: { color: "#f9fafb", fontWeight: "700" },
		// Estado eliminado

	statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
	statCard: {
		flex: 1,
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#e6e9ef",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 3,
	},
	statHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	statPill: { backgroundColor: "#eef2ff", borderRadius: 8, height: 22 },
	statValue: { fontSize: 22, fontWeight: "800", color: "#111827", marginVertical: 6 },
	statLabel: { color: "#6b7280", fontSize: 12 },

	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: "#e6e9ef",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 3,
		marginBottom: 12,
	},
	cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
	scannerBox: { alignItems: "center", marginBottom: 10 },
	scannerDashed: {
		width: "100%",
		height: 140,
		borderRadius: 12,
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: "#e5e7eb",
		backgroundColor: "#f9fafb",
		alignItems: "center",
		justifyContent: "center",
	},
	scannerHint: { color: "#6b7280", marginTop: 8 },
	primaryBtn: { backgroundColor: "#0f172a", borderRadius: 10, marginTop: 8 },
	actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
	outlinedBtn: { borderColor: "#e6e9ef", borderRadius: 10, backgroundColor: "#fff" },

	listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	link: { color: "#0f172a", fontWeight: "700" },
	divider: { marginVertical: 8, backgroundColor: "#e6e9ef" },
	listItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
	itemLeft: { flexDirection: "row", alignItems: "center" },
	itemIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#eef2ff",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
		borderWidth: 1,
		borderColor: "#e6e9ef",
	},
	itemTitle: { fontWeight: "700", color: "#111827" },
	itemSubtitle: { color: "#6b7280", fontSize: 12 },
	badge: { borderRadius: 8, height: 24, justifyContent: "center" },
	badgeValid: { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" },
	badgeInvalid: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
});

