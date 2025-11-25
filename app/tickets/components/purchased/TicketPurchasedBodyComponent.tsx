import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { UiUserEntry } from "@/app/tickets/services/useTicketPurchasedScreen";

type Props = {
	eventData: any;
	ticketsCount?: number;
	entries: UiUserEntry[];
	addressDisplay?: string;
	allControlled?: boolean;
	allPendingForSelection?: boolean;
	allCanceledForSelection?: boolean;
	fiestaIdForReview?: string | null;
	userReview?: any | null;
	showReview?: boolean;
	setShowReview?: (v: boolean) => void;
	rating?: number;
	setRating?: (n: number) => void;
	comment?: string;
	setComment?: (s: string) => void;
	submitting?: boolean;
	deleting?: boolean;
	readOnlyReview?: boolean;
	setReadOnlyReview?: (v: boolean) => void;
	handleSubmitReview?: () => Promise<void>;
	showRefund?: boolean;
	setShowRefund?: (v: boolean) => void;
	refundChecked?: boolean;
	setRefundChecked?: (v: boolean) => void;
	refundBlockedReason?: string | null;
	refundSubmitting?: boolean;
	showRefundSuccess?: boolean;
	setShowRefundSuccess?: (v: boolean) => void;
	refundAmount?: number | null;
	handleRefundStart?: () => void;
	handleRefundConfirm?: () => Promise<void>;
	handleDownloadAll?: (qrRefs: React.MutableRefObject<Record<string, any>>) => void;
	openMapsDirections?: () => void;
	formatDateEs?: (s?: string | null) => string;
	formatTicketCode?: (n: number) => string;
	isCanceledEntry?: (ds?: string, cd?: number) => boolean;
	qrRefs?: React.MutableRefObject<Record<string, any>>;
};

export default function TicketPurchasedBody(props: Props) {
	const { eventData, entries, handleDownloadAll, qrRefs, openMapsDirections, formatDateEs } = props;

	return (
		<View style={styles.root}>
			<Text style={styles.title}>{eventData?.title ?? "Evento"}</Text>
			{eventData?.date ? (
				<Text style={styles.sub}>{formatDateEs ? formatDateEs(eventData.date) : eventData.date}</Text>
			) : null}

			{eventData?.address ? (
				<TouchableOpacity onPress={() => openMapsDirections && openMapsDirections()}>
					<Text style={styles.address}>{props.addressDisplay}</Text>
				</TouchableOpacity>
			) : null}

			<View style={styles.list}>
				{entries && entries.length ? (
					entries.map((e) => (
						<View key={e.idEntrada} style={styles.item}>
							{e.qrImageUrl ? (
								<Image source={{ uri: e.qrImageUrl }} style={styles.qr} />
							) : (
								<View style={styles.qrPlaceholder}><Text style={styles.qrText}>{e.mdQR || "QR"}</Text></View>
							)}
							<View style={styles.itemInfo}>
								<Text style={styles.itemTitle}>{props.formatTicketCode ? props.formatTicketCode(e.nroEntrada ?? 0) : `Entrada ${e.nroEntrada ?? ""}`}</Text>
								<Text style={styles.itemSmall}>{e.tipoDs ?? "-"} • {e.precio ? `$${e.precio}` : "-"}</Text>
								<Text style={styles.itemSmall}>{e.dtInsert ?? ""}</Text>
							</View>
						</View>
					))
				) : (
					<Text style={styles.empty}>No hay entradas para mostrar.</Text>
				)}
			</View>

			<View style={styles.actionsRow}>
				<TouchableOpacity style={styles.button} onPress={() => handleDownloadAll && handleDownloadAll(qrRefs!)}>
					<Text style={styles.buttonText}>Descargar / Imprimir</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { width: "100%", padding: 16 },
	title: { fontSize: 20, fontFamily: FONTS.titleBold, color: COLORS.textPrimary, marginBottom: 6 },
	sub: { color: COLORS.textSecondary, marginBottom: 8 },
	address: { color: COLORS.primary, textDecorationLine: "underline", marginBottom: 12 },
	list: { gap: 12 },
	item: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 10, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.borderInput },
	qr: { width: 76, height: 76, borderRadius: 6, marginRight: 12 },
	qrPlaceholder: { width: 76, height: 76, borderRadius: 6, marginRight: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
	qrText: { color: COLORS.textSecondary },
	itemInfo: { flex: 1 },
	itemTitle: { fontFamily: FONTS.subTitleMedium, fontSize: 16, color: COLORS.textPrimary },
	itemSmall: { color: COLORS.textSecondary, fontSize: FONT_SIZES.smallText },
	empty: { color: COLORS.textSecondary, textAlign: "center", marginTop: 12 },
	actionsRow: { marginTop: 16, flexDirection: "row", justifyContent: "center" },
	button: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
	buttonText: { color: "#fff", fontFamily: FONTS.subTitleMedium },
});
