import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import { COLORS } from "@/styles/globalStyles";

type ScanStatus = "ok" | "error";

export default function ResponseScannerScreen() {
	const router = require("expo-router").useRouter();
	const params = useLocalSearchParams<{
		status?: string | string[];
		message?: string | string[];
		eventName?: string | string[];
		ticketType?: string | string[];
		ticketId?: string | string[];
		price?: string | string[];
		customerName?: string | string[];
		customerEmail?: string | string[];
		dateTime?: string | string[];
		customerAvatarUrl?: string | string[];
	}>();

	// Log de params crudos para debugging
	console.debug('[ResponseScannerScreen] raw params', params);

	// Helpers internos para normalizar y formatear
	const asSingle = (value?: string | string[]): string | undefined => {
		return Array.isArray(value) ? value[0] : value;
	};

	const formatPriceForDisplay = (value?: string): string => {
		if (!value) return "";
		let txt = value.trim();
		// Remover USD en cualquier posición/case
		txt = txt.replace(/usd/gi, "").trim();
		// Mantener si ya empieza con $
		if (/^\$/.test(txt)) return txt;
		// Si empieza con número, anteponer $
		if (/^\d/.test(txt)) return `$${txt}`;
		// Fallback
		return txt;
	};

	// Normalizar parámetros
	const rawStatus = asSingle(params.status);
	const status: ScanStatus = rawStatus === "error" ? "error" : "ok"; // default ok salvo error
	const isOk = status === "ok";

	const baseMessage =
		asSingle(params.message) ||
		(isOk
			? "El ticket ha sido validado correctamente"
			: "El ticket no es válido o ya fue utilizado");

	const dateTime = asSingle(params.dateTime) || "";
	const eventName = asSingle(params.eventName) || "Evento sin nombre";
	const ticketType = asSingle(params.ticketType) || "Tipo de entrada no informado";
	const ticketId = asSingle(params.ticketId) || "";
	const rawPrice = asSingle(params.price);
	const price = formatPriceForDisplay(rawPrice);
	const customerNameParam =
		asSingle(params.customerName) ||
		asSingle((params as any).clientName) ||
		asSingle((params as any).nombreCliente) ||
		asSingle((params as any).usuarioNombre) ||
		"";
	const customerName = customerNameParam || "Cliente desconocido";
	const customerAvatarUrl = asSingle(params.customerAvatarUrl);
	const hasAvatar = !!(customerAvatarUrl && customerAvatarUrl.trim().length > 0);

	// Lectura de customerEmail
	const customerEmail = asSingle(params.customerEmail) || "";

	// Log de info resuelta para debugging
	console.debug('[ResponseScannerScreen] resolved customer info', {
		customerName,
		customerEmail,
		customerAvatarUrl,
	});

	return (
		<SafeAreaView style={styles.container}>
			<Header />

			<ScrollView contentContainerStyle={styles.content}>
				{/* Encabezado: estado del escaneo */}
				<View style={styles.headerBox}>
					<View style={[styles.statusIconCircle, { backgroundColor: isOk ? "#e8f5e9" : "#ffebee" }]}> 
						<MaterialCommunityIcons name={isOk ? "check" : "close"} size={28} color={isOk ? "#2e7d32" : "#c62828"} />
					</View>
					<Text style={[styles.title, { color: isOk ? COLORS.textPrimary : COLORS.negative }]}>
						{isOk ? "Entrada Válida" : "Entrada Inválida"}
					</Text>
					<Text style={styles.subtitle}>{baseMessage}</Text>
				</View>

				{isOk ? (
					// Caso válido: mostrar detalles completos
					<View style={styles.card}>
						{/* Información de Escaneo */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Información de Escaneo</Text>
							<View style={styles.rowLine}>
								<MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSecondary} />
								<Text style={styles.rowText}>{dateTime}</Text>
							</View>
						</View>

						{/* Detalles del Evento */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Detalles del Evento</Text>
							<View style={styles.rowLine}>
								<MaterialCommunityIcons name="information-outline" size={18} color={COLORS.textSecondary} />
								<Text style={styles.rowText}>{eventName}</Text>
							</View>
							<View style={styles.rowLine}>
								<MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color={COLORS.textSecondary} />
								<Text style={styles.rowText}>{ticketType}</Text>
							</View>
						</View>

						{/* Información del Ticket */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Información del Ticket</Text>
							<View style={styles.rowLine}>
								<MaterialCommunityIcons name="pound" size={18} color={COLORS.textSecondary} />
								<Text style={styles.rowText}>{ticketId}</Text>
							</View>
							<View style={styles.rowLine}>
								<MaterialCommunityIcons name="cash" size={18} color={COLORS.textSecondary} />
								<Text style={styles.rowText}>{price || "Precio no informado"}</Text>
							</View>
						</View>

						{/* Información del Cliente removida en caso válido por requerimiento */}
					</View>
				) : (
					// Caso inválido: mostrar solo motivo del rechazo
					<View style={styles.reasonCard}>
						<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
							<MaterialCommunityIcons name="information" size={18} color={COLORS.textSecondary} />
							<Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Motivo del Rechazo</Text>
						</View>
						<Text style={styles.rowText}>{baseMessage}</Text>
					</View>
				)}

				{/* Acción: Escanear otro ticket */}
				<TouchableOpacity style={styles.scanAgainBtn} activeOpacity={0.9} onPress={() => router.back()}>
					<MaterialCommunityIcons name="qrcode-scan" size={18} color="#fff" />
					<Text style={styles.scanAgainText}>Escanear Otro Ticket</Text>
				</TouchableOpacity>
			</ScrollView>

		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.backgroundLight },
	content: { padding: 16, paddingBottom: 24 },

	headerBox: { alignItems: "center", marginTop: 8, marginBottom: 16 },
	statusIconCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	title: { fontSize: 20, fontWeight: "700" },
	subtitle: { marginTop: 6, color: COLORS.textSecondary, textAlign: "center" },

	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 1,
	},
	reasonCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#e5e7eb",
	},
	section: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
	sectionTitle: { color: COLORS.textPrimary, fontWeight: "700", marginBottom: 8 },
	rowLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
	rowText: { color: COLORS.textSecondary },
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#e5e7eb",
	},

	scanAgainBtn: {
		marginTop: 16,
		backgroundColor: COLORS.textPrimary,
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	scanAgainText: { color: "#fff", fontWeight: "700" },
});

