// app/artists/components/admin/new-artist/AdminPopupNewArtist.tsx
// Popup sencillo que avisa que se creó un artista correctamente.

import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type AdminPopupNewArtistProps = {
  visible: boolean;        // controla si el modal está abierto
  artistName?: string;     // nombre del artista recién creado (opcional)
  loading?: boolean;       // por si querés bloquear mientras hacés algo extra
  onClose: () => void;     // acción al cerrar el popup
};

export default function AdminPopupNewArtist({
  visible,
  artistName,
  loading = false,
  onClose,
}: AdminPopupNewArtistProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Fondo semi-transparente para oscurecer el resto de la pantalla */}
      <View style={styles.modalBackdrop}>
        {/* Tarjeta central del popup */}
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Artista creado</Text>

          {/* Texto principal: si tenemos nombre lo mostramos en negrita */}
          <Text style={styles.modalSubtitle}>
            {artistName ? (
              <>
                Se creó el artista{" "}
                <Text style={styles.bold}>"{artistName}"</Text>.
              </>
            ) : (
              "Se creó el artista correctamente."
            )}
          </Text>

          {/* Fila de acciones (en este caso un solo botón Aceptar) */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              disabled={loading}
              style={styles.primaryButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.backgroundLight} />
              ) : (
                <Text style={styles.primaryButtonText}>Aceptar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // fondo oscuro detrás del popup
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  // tarjeta central del popup
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  // título del popup
  modalTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  // texto descriptivo
  modalSubtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  // contenedor de botones (acá solo hay uno, pero mantenemos la estructura)
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  // botón principal "Aceptar"
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  primaryButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
  // para resaltar el nombre del artista dentro del texto
  bold: {
    fontWeight: "700",
  },
});
