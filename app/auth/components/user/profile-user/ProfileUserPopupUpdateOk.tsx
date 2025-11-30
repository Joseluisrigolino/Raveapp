// Popup simple para mostrar que el perfil se actualizó correctamente
// Comentarios en español, código en inglés

import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Props para el popup de actualización de perfil
interface ProfileUserPopupUpdateOkProps {
  visible: boolean;
  userName?: string;
  loading?: boolean;
  onClose: () => void;
}

// Popup simple para mostrar que el perfil se actualizó correctamente
export default function ProfileUserPopupUpdateOk({ visible, userName, loading = false, onClose }: ProfileUserPopupUpdateOkProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Perfil actualizado</Text>
          <Text style={styles.subtitle}>
            {userName ? (
              <>
                Los datos de <Text style={styles.bold}>{userName}</Text> se actualizaron correctamente.
              </>
            ) : (
              "Tus datos se actualizaron correctamente."
            )}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity disabled={loading} style={styles.okBtn} onPress={onClose}>
              {loading ? (
                <ActivityIndicator color={COLORS.backgroundLight} />
              ) : (
                <Text style={styles.okText}>Aceptar</Text>
              )}
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
    alignItems: "center",
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  actions: { width: "100%", marginTop: 8 },
  okBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  okText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
  bold: { fontWeight: "700" },
});
