// Popup para aviso de artista creado
// Comentarios en español, internals en inglés
import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean;
  artistName?: string;
  loading?: boolean;
  onClose: () => void;
}

export default function AdminPopupNewArtist({ visible, artistName, loading = false, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Artista creado</Text>
          <Text style={styles.modalSubtitle}>
            {artistName ? (
              <>
                Se creó el artista "
                <Text style={styles.bold}>{artistName}</Text>
                ".
              </>
            ) : (
              "Se creó el artista correctamente."
            )}
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity disabled={loading} style={styles.btnPrimary} onPress={onClose}>
              {loading ? <ActivityIndicator color={COLORS.backgroundLight} /> : <Text style={styles.btnPrimaryText}>Aceptar</Text>}
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
  bold: {
    fontWeight: "700",
  },
});
