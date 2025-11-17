import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean;
  username?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Popup para confirmar eliminación de un usuario controlador
// Comentarios en español, internals en inglés
export default function CreateUserControllerPopupEliminateUserComponent({ visible, username, loading = false, onCancel, onConfirm }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Eliminar usuario</Text>
          <Text style={styles.subtitle}>
            {username ? (
              <>
                Vas a eliminar "
                <Text style={styles.bold}>{username}</Text>
                ".
              </>
            ) : (
              "Vas a eliminar este usuario."
            )}
            {"\n"}Esta acción no se puede deshacer.
          </Text>

          <View style={styles.actions}>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 16 },
  card: { width: "100%", maxWidth: 380, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.card, padding: 16 },
  title: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle, color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.smallText, color: COLORS.textSecondary, marginBottom: 12 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 12, columnGap: 10 },
  btnGhost: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.borderInput, alignItems: "center", justifyContent: "center", minHeight: 44, flex: 1 },
  btnGhostText: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.button, color: COLORS.textPrimary },
  btnPrimary: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.card, backgroundColor: COLORS.textPrimary, alignItems: "center", justifyContent: "center", minHeight: 44, flex: 1 },
  btnPrimaryText: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.button, color: COLORS.backgroundLight },
  bold: { fontWeight: "700" },
});
