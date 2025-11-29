// app/artists/components/admin/card-admin-artist/AdminCardPopupEliminate.tsx

// Popup de confirmación para eliminar un artista.

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean; // Muestra/oculta el modal
  artistName?: string; // Nombre del artista a mostrar en el mensaje
  loading?: boolean; // Si está borrando, deshabilita botones y muestra loader
  onCancel: () => void; // Cerrar sin borrar
  onConfirm: () => void; // Confirmar borrado
}

export default function AdminCardPopupEliminate({
  visible,
  artistName,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Eliminar artista</Text>

          <Text style={styles.modalSubtitle}>
            {artistName ? (
              <>
                Vas a eliminar "
                <Text style={styles.bold}>{artistName}</Text>
                ".
              </>
            ) : (
              "Vas a eliminar este artista."
            )}
            {"\n"}
            Esta acción no se puede deshacer.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              disabled={loading}
              style={styles.btnGhost}
              onPress={onCancel}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              style={styles.btnPrimary}
              onPress={onConfirm}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.backgroundLight} />
              ) : (
                <Text style={styles.btnPrimaryText}>Eliminar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Fondo semitransparente detrás del modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  // Tarjeta del modal
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
  // Fila de botones
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
    columnGap: 10,
  },
  // Botón secundario (cancelar)
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  btnGhostText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.textPrimary,
  },
  // Botón principal (eliminar)
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  btnPrimaryText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
  // Estilo para resaltar el nombre del artista
  bold: {
    fontWeight: "700",
  },
});
