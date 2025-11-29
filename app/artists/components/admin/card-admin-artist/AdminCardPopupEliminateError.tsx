// app/artists/components/admin/card-admin-artist/AdminCardPopupEliminateError.tsx

// Popup que se muestra si falla la eliminación de un artista.

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean; // Controla visibilidad del modal
  artistName?: string; // Nombre del artista para mostrar en el mensaje
  onClose: () => void; // Cerrar el popup
}

export default function AdminCardPopupEliminateError({
  visible,
  artistName,
  onClose,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>No se puede eliminar</Text>

          <Text style={styles.modalSubtitle}>
            {artistName ? (
              <>
                No se pudo eliminar "
                <Text style={styles.bold}>{artistName}</Text>
                ".
              </>
            ) : (
              "No se pudo eliminar este artista."
            )}
          </Text>

          {/* Acción única: cerrar el modal */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhostFull} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Fondo oscuro detrás del modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  // Tarjeta principal del modal
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  modalTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  // Contenedor del botón de cerrar
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
    columnGap: 10,
  },
  // Botón único para cerrar
  btnGhostFull: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    width: "60%",
  },
  btnGhostText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.textPrimary,
  },
  // Para resaltar el nombre del artista
  bold: {
    fontWeight: "700",
  },
});
