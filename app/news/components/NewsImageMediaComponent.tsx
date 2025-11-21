// src/screens/admin/NewsScreens/components/NewsImageMediaComponent.tsx
// Bloque de imagen reutilizable para crear / editar noticias

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  label?: string;
  imageUri: string | null;
  onSelectImage: () => void;
  onDeleteImage?: () => void; // si viene, muestra botón "Eliminar"
};

export default function NewsImageMediaComponent({
  label = "Imagen",
  imageUri,
  onSelectImage,
  onDeleteImage,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewBoxImage} />
        ) : (
          <View style={[styles.previewBox, styles.imageFallback]}>
            <MaterialCommunityIcons
              name="image-outline"
              size={40}
              color={COLORS.textSecondary}
            />
            <Text style={styles.imagePreviewText}>
              Vista previa de la imagen
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.selectImageButtonLight}
          onPress={onSelectImage}
          activeOpacity={0.85}
        >
          <Text style={styles.selectImageButtonLightText}>
            Seleccionar imagen
          </Text>
        </TouchableOpacity>

        {imageUri && onDeleteImage && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDeleteImage}
          >
            <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.imageNotice}>
          Se permiten imágenes JPG, JPEG o PNG. Peso máximo: 2MB
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
  },
  imageFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  previewBox: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.borderInput,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  previewBoxImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: COLORS.borderInput,
  },
  imagePreviewText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontFamily: FONTS.bodyRegular,
  },
  selectImageButtonLight: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9ef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  selectImageButtonLightText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  imageNotice: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    textAlign: "center",
  },
});
