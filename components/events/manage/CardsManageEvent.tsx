// components/events/manage/CardsManageEvent.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { ESTADO_CODES } from "@/utils/events/eventApi";

/** Tipo de item esperado por la card (lo mismo que mostrás en ManageEvents) */
export type ManageEventCardItem = {
  id: string | number;
  eventName: string;
  date: string;            // "dd/mm/yyyy"
  timeRange?: string;      // "23hs a 06hs"
  imageUrl?: string;       // URL absoluta (o vacía)
  statusLabel: string;     // etiqueta ya resuelta desde la API (p.ej. "Fin Venta")
  statusCode: number;      // 0..6
  address?: string;
  type?: string;
};

type Props = {
  item: ManageEventCardItem;
  onTicketsSold?: (id: string | number) => void;
  onModify?: (id: string | number) => void;
  onCancel?: (id: string | number) => void;
  containerStyle?: ViewStyle;
};

/** Colores sugeridos por estado (ajustá si tu paleta define algo propio) */
const STATUS_COLOR: Record<number, string> = {
  0: "#f59e0b", // Por Aprobar
  1: "#16a34a", // Aprobado
  2: "#f59e0b", // En venta
  3: "#f59e0b", // Fin Venta
  4: "#6b7280", // Finalizado
  5: "#ef4444", // Cancelado
  6: "#dc2626", // Rechazado
};

const CardsManageEvent: React.FC<Props> = ({
  item,
  onTicketsSold,
  onModify,
  onCancel,
  containerStyle,
}) => {
  const statusColor = STATUS_COLOR[item.statusCode] ?? COLORS.textPrimary;
  const isCanceled = item.statusCode === ESTADO_CODES.CANCELADO;

  return (
    <View style={[styles.card, containerStyle]}>
      {/* Cabecera con estado como chip y miniatura a la derecha */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{item.eventName}</Text>
          <Text style={styles.metaText}>
            <Text style={{ color: COLORS.textSecondary }}>Fecha del evento: </Text>
            <Text style={styles.metaStrong}>{item.date || "—"}</Text>
            {!!item.timeRange && (
              <Text style={{ color: COLORS.textSecondary }}>{"  •  "}{item.timeRange}</Text>
            )}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={[styles.statusChip, { backgroundColor: statusColor + '22', borderColor: statusColor }]}> 
            <Text style={[styles.statusChipText, { color: statusColor }]}>{item.statusLabel}</Text>
          </View>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        {onTicketsSold && (
          <TouchableOpacity style={[styles.actionBtn]} onPress={() => onTicketsSold(item.id)}>
            <Text style={styles.actionText}>Entradas vendidas</Text>
          </TouchableOpacity>
        )}
        {onModify && (
          <TouchableOpacity style={[styles.actionBtn]} onPress={() => onModify(item.id)}>
            <Text style={styles.actionText}>Modificar</Text>
          </TouchableOpacity>
        )}
        {!isCanceled && onCancel && (
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => onCancel(item.id)}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: "flex-end",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 80,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: FONT_SIZES.caption ?? 12,
    fontWeight: "700",
    textAlign: "center",
  },
  cover: {
    width: 90,
    height: 68,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#E9E9E9",
  },
  coverPlaceholder: {
    backgroundColor: "#E9E9E9",
  },
  metaText: {
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: FONT_SIZES.caption ?? 12,
  },
  metaStrong: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: FONT_SIZES.body,
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    minWidth: 80,
    alignItems: "center",
  },
  actionText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONT_SIZES.caption ?? 12,
    textAlign: "center",
  },
  cancelBtn: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.negative,
    borderWidth: 1,
    minWidth: 80,
  },
  cancelText: {
    color: COLORS.negative,
    fontWeight: "700",
    textAlign: "center",
    fontSize: FONT_SIZES.caption ?? 12,
  },
});

export default CardsManageEvent;
