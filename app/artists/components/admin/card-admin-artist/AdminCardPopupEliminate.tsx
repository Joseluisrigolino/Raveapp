// Popup de confirmación para eliminar artista
// Comentarios en español, código en inglés

import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean;
  artistName?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AdminCardPopupEliminate({ visible, artistName, loading = false, onCancel, onConfirm }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Eliminar artista</Text>
          <Text style={styles.modalSubtitle}>
            {artistName ? (
              // Mostrar el nombre del artista en negrita dentro de la frase
              <>
                Vas a eliminar "
                <Text style={styles.bold}>{artistName}</Text>
                ".
              </>
            ) : (
              "Vas a eliminar este artista."
            )}
            {"\n"}Esta acción no se puede deshacer.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity disabled={loading} style={styles.btnGhost} onPress={onCancel}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={loading} style={styles.btnPrimary} onPress={onConfirm}>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
    columnGap: 10,
  },
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
  // estilo para texto en negrita dentro de los subtítulos (nombre del artista)
  bold: {
    fontWeight: "700",
  },
});
