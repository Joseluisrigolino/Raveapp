import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface Props {
  visible: boolean;
  username?: string;
  onClose: () => void;
}

// Popup que muestra confirmación de eliminación exitosa
// Comentarios en español, internals en inglés
export default function CreateUserControllerPopupEliminateUserOk({ visible, username, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Usuario eliminado</Text>
          <Text style={styles.subtitle}>
            {username ? (
              <>
                El usuario "<Text style={styles.bold}>{username}</Text>" fue eliminado correctamente.
              </>
            ) : (
              "El usuario fue eliminado correctamente."
            )}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
              <Text style={styles.btnPrimaryText}>Cerrar</Text>
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
  actions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%", marginTop: 12 },
  btnPrimary: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.card, backgroundColor: COLORS.textPrimary, alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 100 },
  btnPrimaryText: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.button, color: COLORS.backgroundLight },
  bold: { fontWeight: "700" },
});
