import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import {
	ReporteVentasDia,
	ReporteVentasEvento,
	ReporteVentasItem,
	fetchReporteVentasEvento,
} from "@/utils/events/entradaApi";
import { fetchEventById } from "@/utils/events/eventApi";

const money = (n: number | undefined) =>
	typeof n === "number" && isFinite(n) ? `$${n.toFixed(2)}` : "$0.00";

const nowHuman = (d: Date) => {
	// Intentar usar Intl para respetar locale y zona del dispositivo
	try {
		const dateFmt = new Intl.DateTimeFormat(undefined, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
		const timeFmt = new Intl.DateTimeFormat(undefined, {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return `${dateFmt.format(d)} a las ${timeFmt.format(d)} hs`;
	} catch {
		// Fallback manual si Intl no está disponible
		const pad = (x: number) => String(x).padStart(2, "0");
		return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} a las ${pad(d.getHours())}:${pad(
			d.getMinutes()
		)} hs`;
	}
};

function computeItemDerived(i: ReporteVentasItem) {
	const cantidadInicial = i.cantidadInicial ?? 0;
	const cantidadVendida = i.cantidadVendida ?? 0;
	const precioUnitario = i.precioUnitario ?? 0;
	const cargoServicioUnitario = i.cargoServicioUnitario ?? 0;
	const subtotal =
		typeof i.subtotal === "number" ? i.subtotal : precioUnitario * cantidadVendida;
	const cargoServicio =
		typeof i.cargoServicio === "number"
			? i.cargoServicio
			: cargoServicioUnitario * cantidadVendida;
	const total = typeof i.total === "number" ? i.total : subtotal + cargoServicio;
	const stock =
		typeof i.stock === "number" ? i.stock : Math.max(0, cantidadInicial - cantidadVendida);
	return {
		cantidadInicial,
		cantidadVendida,
		precioUnitario,
		cargoServicioUnitario,
		subtotal,
		cargoServicio,
		total,
		stock,
	};
}

function computeDayTotals(d: ReporteVentasDia) {
	// Identificar línea TOTAL si existe
	const isTotal = (it: any) => String(it?.tipo || it?.entrada || "").trim().toUpperCase() === "TOTAL";
	const totalLine = Array.isArray(d.items) ? d.items.find(isTotal) : undefined;
	const baseItems = Array.isArray(d.items) ? d.items.filter((it) => !isTotal(it)) : [];

	// Preferir totales exactos del backend si vienen en la línea TOTAL
	if (totalLine) {
		const der = computeItemDerived(totalLine);
		const vendidos =
			typeof d.totalEntradasVendidas === "number"
				? d.totalEntradasVendidas
				: (typeof totalLine.cantidadVendida === "number" ? totalLine.cantidadVendida : baseItems.reduce((acc, it) => acc + (it.cantidadVendida ?? 0), 0));
		const recEntradas =
			typeof d.totalRecaudado === "number"
				? d.totalRecaudado
				: (typeof der.subtotal === "number" ? der.subtotal : baseItems.reduce((acc, it) => acc + computeItemDerived(it).subtotal, 0));
		const cargo =
			typeof d.totalCargoServicio === "number"
				? d.totalCargoServicio
				: (typeof der.cargoServicio === "number" ? der.cargoServicio : baseItems.reduce((acc, it) => acc + computeItemDerived(it).cargoServicio, 0));
		return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
	}

	// Si no hay línea TOTAL, sumamos sobre los items
	const vendidos =
		typeof d.totalEntradasVendidas === "number"
			? d.totalEntradasVendidas
			: baseItems.reduce((acc, it) => acc + (it.cantidadVendida ?? 0), 0);
	const recEntradas =
		typeof d.totalRecaudado === "number"
			? d.totalRecaudado
			: baseItems.reduce((acc, it) => acc + computeItemDerived(it).subtotal, 0);
	const cargo =
		typeof d.totalCargoServicio === "number"
			? d.totalCargoServicio
			: baseItems.reduce((acc, it) => acc + computeItemDerived(it).cargoServicio, 0);
	return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
}

export default function ReporteVentaEntradaEventoScreen() {
	const { id } = useLocalSearchParams<{ id?: string }>();
		const { user, hasRole } = useAuth();

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [report, setReport] = useState<ReporteVentasEvento>({ dias: [] });
	const [now, setNow] = useState<Date>(new Date());

	const idEvento = String(id ?? "");
		const baseUserId = String((user as any)?.id ?? (user as any)?.idUsuario ?? "");
		const isAdmin = !!hasRole?.("admin");

			const load = useCallback(async () => {
				if (!idEvento) {
					setError("Falta el id del evento.");
					setReport({ dias: [] });
					setLoading(false);
					return;
				}
				setError(null);
				setLoading(true);
				try {
					// 1) Traemos el evento para conocer el organizador real (necesario para admins)
					const ev = await fetchEventById(idEvento).catch(() => null as any);

					const pickOwnerId = (e: any): string | null => {
						return (
							(e?.ownerId && String(e.ownerId)) ||
							(e?.__raw?.propietario?.idUsuario && String(e.__raw.propietario.idUsuario)) ||
							(e?.__raw?.usuario?.idUsuario && String(e.__raw.usuario.idUsuario)) ||
							null
						);
					};

					const orgForReport = isAdmin ? pickOwnerId(ev) || baseUserId : baseUserId;
					if (!orgForReport) {
						setError("No se pudo determinar el organizador para este evento.");
						setReport({ dias: [] });
						setLoading(false);
						return;
					}

					// 2) Traemos el reporte con el organizador correcto
					const rep = await fetchReporteVentasEvento(idEvento, String(orgForReport));

					// 3) Map idFecha -> fecha formateada (dd/mm/yyyy)
					const idFechaToDate = new Map<string, string>();
					try {
						const pad = (n: number) => String(n).padStart(2, "0");
						const toDDMMYYYY = (iso?: string) => {
							if (!iso) return "";
							const d = new Date(iso);
							if (isNaN(d.getTime())) return "";
							return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
						};
						if (ev && Array.isArray(ev.fechas)) {
							for (const f of ev.fechas) {
								const label = toDDMMYYYY(f?.inicio);
								if (f?.idFecha) idFechaToDate.set(String(f.idFecha), label);
							}
						}
					} catch {}

					// 4) Reetiquetar fecha en función del idFecha del reporte
					const dias: ReporteVentasDia[] = (rep?.dias ?? []).map((d) => {
						const idF = (d as any).idFecha ?? d.items?.[0]?.idFecha;
						const label = (idF && idFechaToDate.get(String(idF))) || d.fecha || (d as any).numFecha || "";
						return { ...d, fecha: String(label || d.fecha || "") } as ReporteVentasDia;
					});

					const merged: ReporteVentasEvento = {
						...rep,
						evento: {
							idEvento,
							nombre: ev?.title || ev?.nombre || rep?.evento?.nombre || undefined,
							creadoPor: ev?.ownerName || rep?.evento?.creadoPor || undefined,
						},
						dias,
					};
					setReport(merged);
				} catch (e: any) {
					setError(e?.message || "No se pudo obtener el reporte.");
				} finally {
					setLoading(false);
				}
			}, [idEvento, baseUserId, isAdmin]);

	useEffect(() => {
		load();
	}, [load]);

	// Actualizar la hora mostrada cada 30 segundos para reflejar el tiempo del dispositivo
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await load();
		} finally {
			setRefreshing(false);
		}
	}, [load]);

	// Totales generales calculados por si el back no los manda
	const grand = useMemo(() => {
		const vendidos = report.dias.reduce((acc, d) => acc + computeDayTotals(d).vendidos, 0);
		const recEntradas = report.dias.reduce(
			(acc, d) => acc + computeDayTotals(d).recEntradas,
			0
		);
		const cargo = report.dias.reduce((acc, d) => acc + computeDayTotals(d).cargo, 0);
		return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
	}, [report]);

	return (
		<SafeAreaView style={styles.container}>
			<Header />

			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			>
				<Text style={styles.title}>Reporte de ventas de evento</Text>
				{report?.evento?.nombre ? (
					<Text style={styles.subtitle}>Evento: {report.evento.nombre}</Text>
				) : null}
				<Text style={styles.info}>Información al {nowHuman(now)}</Text>

				<View style={{ height: 8 }} />
				<TouchableOpacity style={styles.refreshBtn} onPress={load}>
					<Text style={styles.refreshBtnText}>Actualizar</Text>
				</TouchableOpacity>

				{loading ? (
					<View style={styles.loadingBox}>
						<ActivityIndicator />
						<Text style={styles.loadingText}>Cargando reporte…</Text>
					</View>
				) : error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : !report?.dias?.length ? (
					<Text style={styles.emptyText}>No hay información de ventas.</Text>
				) : (
					<>
												{report.dias.map((d, idx) => (
							<View key={`${d.fecha}-${idx}`} style={styles.daySection}>
								<Text style={styles.dayHeader}>Reporte de ventas: {d.fecha || "(sin fecha)"}</Text>

														{d.items
															.filter((it) => String(it?.tipo || "").toUpperCase() !== "TOTAL")
															.map((it, k) => {
									const der = computeItemDerived(it);
									return (
										<View key={`${it.tipo}-${k}`} style={styles.card}>
											<Text style={styles.cardTitle}>{it.tipo || "Tipo"}</Text>
																			<View style={styles.rowBetween}><Text style={styles.muted}>Cantidad inicial</Text><Text style={styles.value}>{der.cantidadInicial}</Text></View>
																			<View style={styles.rowBetween}><Text style={styles.muted}>Cantidad vendida</Text><Text style={styles.value}>{der.cantidadVendida}</Text></View>
																							<View style={styles.rowBetween}><Text style={styles.muted}>Precio</Text><Text style={styles.value}>{money(der.precioUnitario)}</Text></View>
																							<View style={styles.rowBetween}><Text style={styles.muted}>{isAdmin ? "Subtotal" : "Total recaudado"}</Text><Text style={styles.value}>{money(der.subtotal)}</Text></View>
																			{isAdmin ? (
																				<>
																					<View style={styles.rowBetween}><Text style={styles.muted}>Cargo por servicio</Text><Text style={styles.value}>{money(der.cargoServicio)}</Text></View>
																					<View style={styles.rowBetween}><Text style={styles.bold}>Total</Text><Text style={styles.bold}>{money(der.total)}</Text></View>
																				</>
																			) : null}
											<View style={styles.stockPill}><Text style={styles.stockText}>Aún en stock  {der.stock}</Text></View>
										</View>
									);
																})}

								{/* Totales por día */}
								<View style={styles.summaryCard}>
									<Text style={styles.summaryHeader}>Total del día {d.fecha}</Text>
									{(() => {
										const t = computeDayTotals(d);
										return (
											<>
												<View style={styles.rowBetween}><Text style={styles.summaryText}>Total de entradas vendidas</Text><Text style={styles.summaryText}>{t.vendidos}</Text></View>
																		<View style={styles.rowBetween}><Text style={styles.summaryText}>Total recaudado (entradas)</Text><Text style={styles.summaryText}>{money(t.recEntradas)}</Text></View>
																		{isAdmin ? (
																			<View style={styles.rowBetween}><Text style={styles.summaryText}>Total cargo por servicio</Text><Text style={styles.summaryText}>{money(t.cargo)}</Text></View>
																		) : null}
																		<View style={styles.summaryTotalRow}><Text style={styles.summaryTotalLabel}>{isAdmin ? "Total recaudado (entradas + servicio)" : "Total Recaudado"}</Text><Text style={styles.summaryTotalValue}>{money(isAdmin ? t.total : t.recEntradas)}</Text></View>
											</>
										);
									})()}
								</View>
							</View>
						))}

						{/* Totales generales del evento */}
						<View style={styles.grandCard}>
							<Text style={styles.grandHeader}>Total General del Evento</Text>
							<View style={styles.rowBetween}><Text style={styles.grandText}>Total entradas vendidas (ambos días)</Text><Text style={styles.grandText}>{grand.vendidos}</Text></View>
							<View style={styles.rowBetween}><Text style={styles.grandText}>Total recaudado entradas (ambos días)</Text><Text style={styles.grandText}>{money(grand.recEntradas)}</Text></View>
													{isAdmin ? (
														<View style={styles.rowBetween}><Text style={styles.grandText}>Total cargo por servicio (ambos días)</Text><Text style={styles.grandText}>{money(grand.cargo)}</Text></View>
													) : null}
													<View style={styles.totalPill}><Text style={styles.totalPillText}>{isAdmin ? "TOTAL RECAUDADO (ENTRADAS + SERVICIO)  " : "TOTAL RECAUDADO  "}{money(isAdmin ? grand.total : grand.recEntradas)}</Text></View>
						</View>
					</>
				)}
			</ScrollView>

			<Footer />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.backgroundLight },
	content: { padding: 16, paddingBottom: 24 },
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: COLORS.textPrimary,
	},
	subtitle: { marginTop: 4, color: COLORS.textSecondary },
	info: { marginTop: 8, color: COLORS.textSecondary },
	refreshBtn: {
		marginTop: 8,
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	refreshBtnText: { color: "#fff", fontWeight: "600" },
	loadingBox: { paddingVertical: 20, alignItems: "center" },
	loadingText: { marginTop: 8, color: COLORS.textSecondary },
		errorText: { color: COLORS.alert, marginTop: 16, textAlign: "center" },
	emptyText: { color: COLORS.textSecondary, marginTop: 16, textAlign: "center" },

	daySection: { marginTop: 16 },
		dayHeader: {
		fontSize: 16,
		fontWeight: "600",
			backgroundColor: COLORS.cardBg,
		color: COLORS.textPrimary,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 1,
	},
	cardTitle: { fontWeight: "600", marginBottom: 8, color: COLORS.textPrimary },
	rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
	muted: { color: COLORS.textSecondary },
	value: { color: COLORS.textPrimary, fontWeight: "500" },
	bold: { color: COLORS.textPrimary, fontWeight: "700" },
	stockPill: {
		marginTop: 10,
		backgroundColor: COLORS.backgroundLight,
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 10,
		alignSelf: "flex-start",
	},
	stockText: { color: COLORS.textSecondary, fontWeight: "600" },

	summaryCard: {
		backgroundColor: "#1f2937", // dark slate
		borderRadius: 12,
		padding: 12,
		marginBottom: 16,
	},
	summaryHeader: { color: "#fff", fontWeight: "700", marginBottom: 8 },
	summaryText: { color: "#d1d5db" },
	summaryTotalRow: {
		marginTop: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "#111827",
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
	},
	summaryTotalLabel: { color: "#cbd5e1", fontWeight: "700" },
	summaryTotalValue: { color: "#fff", fontWeight: "800" },

	grandCard: {
		backgroundColor: "#111827",
		borderRadius: 12,
		padding: 16,
		marginTop: 8,
		marginBottom: 24,
	},
	grandHeader: { color: "#fff", fontWeight: "800", marginBottom: 10, fontSize: 16 },
	grandText: { color: "#d1d5db" },
	totalPill: {
		marginTop: 14,
		backgroundColor: "#1f2937",
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 14,
	},
	totalPillText: { color: "#fff", fontWeight: "800", textAlign: "center" },
});

