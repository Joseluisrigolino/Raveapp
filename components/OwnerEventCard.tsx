// components/OwnerEventCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type ID = string | number;

interface OwnerEventCardProps {
  item: OwnerEventItem & {
    /** Si ya traés desde la API */
    statusCode?: number; // 0..6
    statusLabel?: string; // "Por Aprobar" | "Aprobado" | ...
  };
  onTicketsSold: (id: ID) => void;
  onModify: (id: ID) => void;
  onCancel: (id: ID) => void;
}

/** Mapa por cdEstado (0..6) */
const CODE_META: Record<
  number,
  { label: string; color: string; dimImage?: boolean }
> = {
  0: { label: "Por Aprobar", color: COLORS.info },
  1: { label: "Aprobado", color: COLORS.alternative },
  2: { label: "En venta", color: COLORS.positive },
  3: { label: "Fin Venta", color: COLORS.info },
  4: { label: "Finalizado", color: COLORS.textSecondary, dimImage: true },
  5: { label: "Cancelado", color: COLORS.negative, dimImage: true },
  6: { label: "Rechazado", color: COLORS.negative, dimImage: true },
};

/** Mapa por texto del estado (por si llega dsEstado) */
const LABEL_META: Record<string, { color: string; dimImage?: boolean }> = {
  "por aprobar": { color: COLORS.info },
  aprobado: { color: COLORS.alternative },
  "en venta": { color: COLORS.positive },
  "fin venta": { color: COLORS.info },
  finalizado: { color: COLORS.textSecondary, dimImage: true },
  cancelado: { color: COLORS.negative, dimImage: true },
  rechazado: { color: COLORS.negative, dimImage: true },
};

/** Compat con los labels “legacy” de la app */
function legacyMeta(legacy?: string) {
  switch (legacy) {
    case "vigente":
      return { label: "En venta", color: COLORS.positive };
    case "pendiente":
      return { label: "Por Aprobar", color: COLORS.info };
    case "finalizado":
      return {
        label: "Finalizado",
        color: COLORS.textSecondary,
        dimImage: true,
      };
    default:
      return { label: legacy || "", color: COLORS.textPrimary };
  }
}

/** Resuelve label/color priorizando: code → statusLabel (dsEstado) → legacy */
function resolveStatus(item: OwnerEventCardProps["item"]) {
  // 1) Si viene el código 0..6
  if (typeof item.statusCode === "number" && CODE_META[item.statusCode]) {
    const base = CODE_META[item.statusCode];
    const label =
      item.statusLabel && item.statusLabel.trim()
        ? item.statusLabel
        : base.label;
    return { label, color: base.color, dimImage: base.dimImage };
  }

  // 2) Si viene el texto del estado (dsEstado)
  if (item.statusLabel && item.statusLabel.trim()) {
    const key = item.statusLabel.trim().toLowerCase();
    const meta = LABEL_META[key];
    if (meta) return { label: item.statusLabel.trim(), ...meta };
  }

  // 3) Fallback a los estados “legacy” de la app
  return legacyMeta((item as any).status);
}

export default function OwnerEventCard({
  item,
  onTicketsSold,
  onModify,
  onCancel,
}: OwnerEventCardProps) {
  const status = resolveStatus(item);

  // Reglas de acciones por estado (usando code si existe)
  const code = item.statusCode;

  // Entradas vendidas: En venta (2), Fin Venta (3), Finalizado (4) o legacy vigente/finalizado
  const canSeeSold =
    (typeof code === "number" && [2, 3, 4].includes(code)) ||
    (item as any).status === "vigente" ||
    (item as any).status === "finalizado";

  // Bloqueos: Finalizado (4), Cancelado (5), Rechazado (6) o legacy finalizado
  const isLocked =
    (typeof code === "number" && [4, 5, 6].includes(code)) ||
    (item as any).status === "finalizado";

  const canModify = !isLocked;
  const canCancel = !isLocked;

  // Fallback si no hay imagen
  const hasImage = !!item.imageUrl;
  const initials = (item.eventName || "")
    .split(" ")
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const imageStyle = [styles.eventImage, status.dimImage && styles.dimmedImage];

  return (
    <View style={styles.cardContainer}>
      {/* Estado + imagen/fallback */}
      <View style={styles.headerRow}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>

        {hasImage ? (
          <Image source={{ uri: item.imageUrl }} style={imageStyle} />
        ) : (
          <View
            style={[
              styles.imageFallback,
              status.dimImage && styles.dimmedImage,
            ]}
          >
            <Text style={styles.fallbackText}>{initials || "EV"}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={styles.dateText}>
        Fecha del evento: {item.date || "-"}
        {item.timeRange ? `  •  ${item.timeRange}` : ""}
      </Text>
      <Text style={styles.nameText}>{item.eventName}</Text>

      {/* Acciones */}
      <View style={styles.buttonsRow}>
        {canSeeSold && (
          <TouchableOpacity
            style={[styles.button, styles.soldTicketsButton]}
            onPress={() => onTicketsSold(item.id as ID)}
          >
            <Text style={styles.buttonText}>Entradas vendidas</Text>
          </TouchableOpacity>
        )}

        {canModify && (
          <TouchableOpacity
            style={[styles.button, styles.modifyButton]}
            onPress={() => onModify(item.id as ID)}
          >
            <Text style={styles.buttonText}>Modificar</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => onCancel(item.id as ID)}
          >
            <Text style={styles.buttonText}>Cancelar evento</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const IMG_SIZE = 60;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  eventImage: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: RADIUS.card,
    resizeMode: "cover",
  },
  imageFallback: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  dimmedImage: {
    opacity: 0.45,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
    marginBottom: 4,
  },
  nameText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  button: {
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  soldTicketsButton: {
    backgroundColor: COLORS.info,
  },
  modifyButton: {
    backgroundColor: COLORS.alternative,
  },
  cancelButton: {
    backgroundColor: COLORS.negative,
  },
  buttonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.smallText,
    fontWeight: "bold",
  },
});
