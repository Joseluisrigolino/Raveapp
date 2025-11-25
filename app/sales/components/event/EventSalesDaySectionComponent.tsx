import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/styles/globalStyles";
import {
  computeItemDerived,
  computeDayTotals,
  formatMoney,
} from "../../services/useEventSalesReport";
import { ReporteVentasDia } from "@/app/events/apis/entradaApi";

type Props = {
  day: ReporteVentasDia;
  isAdmin: boolean;
};

export default function EventSalesDaySectionComponent({ day, isAdmin }: Props) {
  const totals = computeDayTotals(day);

  const items = Array.isArray(day.items)
    ? day.items.filter(
        (it) =>
          String(it?.tipo || "").trim().toUpperCase() !== "TOTAL"
      )
    : [];

  return (
    <View style={styles.daySection}>
      <Text style={styles.dayHeader}>
        Reporte de ventas: {day.fecha || "(sin fecha)"}
      </Text>

      {items.map((it, idx) => {
        const der = computeItemDerived(it);
        return (
          <View key={`${it.tipo}-${idx}`} style={styles.card}>
            <Text style={styles.cardTitle}>{it.tipo || "Tipo"}</Text>

            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Cantidad inicial</Text>
              <Text style={styles.value}>{der.cantidadInicial}</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Cantidad vendida</Text>
              <Text style={styles.value}>{der.cantidadVendida}</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Precio</Text>
              <Text style={styles.value}>{formatMoney(der.precioUnitario)}</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.muted}>
                {isAdmin ? "Subtotal" : "Total recaudado"}
              </Text>
              <Text style={styles.value}>{formatMoney(der.subtotal)}</Text>
            </View>

            {isAdmin && (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.muted}>Cargo por servicio</Text>
                  <Text style={styles.value}>
                    {formatMoney(der.cargoServicio)}
                  </Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.bold}>Total</Text>
                  <Text style={styles.bold}>{formatMoney(der.total)}</Text>
                </View>
              </>
            )}

            <View style={styles.stockPill}>
              <Text style={styles.stockText}>
                Aún en stock {der.stock}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Totales del día */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>
          Total del día {day.fecha}
        </Text>

        <View style={styles.rowBetween}>
          <Text style={styles.summaryText}>
            Total de entradas vendidas
          </Text>
          <Text style={styles.summaryText}>{totals.vendidos}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.summaryText}>
            Total recaudado (entradas)
          </Text>
          <Text style={styles.summaryText}>
            {formatMoney(totals.recEntradas)}
          </Text>
        </View>

        {isAdmin && (
          <View style={styles.rowBetween}>
            <Text style={styles.summaryText}>
              Total cargo por servicio
            </Text>
            <Text style={styles.summaryText}>
              {formatMoney(totals.cargo)}
            </Text>
          </View>
        )}

        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>
            {isAdmin
              ? "Total recaudado (entradas + servicio)"
              : "Total Recaudado"}
          </Text>
          <Text style={styles.summaryTotalValue}>
            {formatMoney(isAdmin ? totals.total : totals.recEntradas)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: {
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
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
    backgroundColor: "#1f2937",
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
});
