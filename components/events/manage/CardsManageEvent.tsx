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
      {/* Cabecera con estado + imagen a la derecha */}
      <View style={styles.headerRow}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {item.statusLabel}
        </Text>

        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]} />
        )}
      </View>

      {/* Meta info (fecha · horario) */}
      <Text style={styles.metaText}>
        <Text style={{ color: COLORS.textSecondary }}>Fecha del evento: </Text>
        <Text style={styles.metaStrong}>{item.date || "—"}</Text>
        {!!item.timeRange && (
          <Text style={{ color: COLORS.textSecondary }}>
            {"  •  "}{item.timeRange}
          </Text>
        )}
      </Text>

      {/* Título */}
      <Text style={styles.title} numberOfLines={2}>
        {item.eventName}
      </Text>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.soldBtn]}
          onPress={() => onTicketsSold?.(item.id)}
        >
          <Text style={styles.actionText}>Entradas vendidas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.modifyBtn]}
          onPress={() => onModify?.(item.id)}
        >
          <Text style={styles.actionText}>Modificar</Text>
        </TouchableOpacity>
      </View>

      {/* Botón cancelar: oculto si ya está cancelado */}
      {!isCanceled && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel?.(item.id)}>
          <Text style={styles.cancelText}>Cancelar evento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CardsManageEvent;

/* ===================== estilos ===================== */
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 12,
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
    marginBottom: 6,
  },

  statusText: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "800",
    maxWidth: "58%",
  },

  cover: {
    width: 132,
    height: 96,
    borderRadius: 14,
    marginLeft: 12,
  },
  coverPlaceholder: {
    backgroundColor: "#E9E9E9",
  },

  metaText: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaStrong: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  title: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: FONT_SIZES.body,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    marginRight: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
  soldBtn: {
    backgroundColor: "#f59e0b",
  },
  modifyBtn: {
    backgroundColor: "#d946ef",
  },

  cancelBtn: {
    marginTop: 10,
    backgroundColor: COLORS.negative ?? "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "left",
  },
});
