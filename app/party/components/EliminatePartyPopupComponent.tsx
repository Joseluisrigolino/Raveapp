// Popup de confirmación para eliminar una fiesta
// Comentarios en español, código en inglés donde aplica

import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  visible: boolean;
  partyName?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function EliminatePartyPopupComponent({ visible, partyName, loading = false, onCancel, onConfirm }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Eliminar fiesta</Text>

          <Text style={styles.subtitle}>
            {partyName ? (
              <>
                Vas a eliminar "
                <Text style={styles.bold}>{partyName}</Text>
                ".
              </>
            ) : (
              "Vas a eliminar esta fiesta."
            )}
            {"\n"}Esta acción no se puede deshacer.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity disabled={loading} style={styles.btnGhost} onPress={onCancel}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={loading} style={styles.btnPrimary} onPress={onConfirm}>
              {loading ? <ActivityIndicator color={COLORS.backgroundLight} /> : <Text style={styles.btnPrimaryText}>Eliminar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  title: {
    fontSize: FONT_SIZES.subTitle ?? 18,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZES.smallText ?? 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
    gap: 10,
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
    fontSize: FONT_SIZES.button ?? 14,
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
    fontSize: FONT_SIZES.button ?? 14,
    color: COLORS.backgroundLight,
    fontWeight: "700",
  },
  bold: { fontWeight: "700" },
});
