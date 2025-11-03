import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "@/styles/globalStyles";

interface Props {
  value?: string | null;
  onChange?: (uri: string | null) => void;
  maxBytes?: number;
  allowedExts?: string[];
  label?: string;
}

export default function ImagePickerComponent({
  value,
  onChange,
  maxBytes = 2 * 1024 * 1024,
  allowedExts = ["jpg", "jpeg", "png"],
  label = "Imagen",
}: Props) {
  const [isPicking, setIsPicking] = useState(false);

  const isAllowedExt = useCallback(
    (nameOrUri?: string | null) => {
      if (!nameOrUri) return false;
      const cleaned = String(nameOrUri).split("?")[0].split("#")[0];
      const parts = cleaned.split(".");
      if (parts.length < 2) return false;
      const ext = parts.pop()!.toLowerCase();
      return allowedExts.includes(ext);
    },
    [allowedExts]
  );

  const handleSelectImage = useCallback(async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permiso denegado", "Se requiere permiso para acceder a la galería.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // Validar tamaño
      let size = 0;
      try {
        const info: any = await getInfoAsync(uri);
        if (info && typeof info.size === "number") size = info.size;
      } catch {}

      if (size && size > maxBytes) {
        Alert.alert("Error", `La imagen supera los ${Math.round(maxBytes / 1024 / 1024)}MB permitidos.`);
        return;
      }

      // Validar extensión
      const fileName = (asset.fileName as string) || uri.split("/").pop() || "image.jpg";
      const allowed = isAllowedExt(fileName) || isAllowedExt(uri);
      if (!allowed) {
        Alert.alert("Formato no soportado", "La imagen debe ser JPG, JPEG o PNG.");
        return;
      }

      onChange && onChange(uri);
    } catch (e) {
      console.error("ImagePickerComponent - select error", e);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setIsPicking(false);
    }
  }, [isPicking, maxBytes, isAllowedExt, onChange]);

  const handleDelete = useCallback(() => {
    onChange && onChange(null);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.imageContainer}>
        {value ? (
          <Image source={{ uri: value }} style={styles.previewBoxImage} />
        ) : (
          <View style={[styles.previewBox, styles.imageFallback]}>
            <MaterialCommunityIcons name="image-outline" size={40} color={COLORS.textSecondary} />
            <Text style={styles.imagePreviewText}>Vista previa de la imagen</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.selectImageButton, isPicking && { opacity: 0.6 }]}
          onPress={handleSelectImage}
          disabled={isPicking}
          activeOpacity={0.85}
        >
          {isPicking ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.selectImageButtonText}>{value ? "Cambiar imagen" : "Seleccionar imagen"}</Text>
          )}
        </TouchableOpacity>

        {value && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.imageNotice}>
          Se permiten {allowedExts.join(", ")} - Máx {Math.round(maxBytes / 1024 / 1024)}MB
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  label: { fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary, marginBottom: 8 },
  imageContainer: {
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
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
  previewBoxImage: { width: "100%", height: 200, borderRadius: 16, marginBottom: 12, backgroundColor: COLORS.borderInput },
  imageFallback: { justifyContent: "center", alignItems: "center" },
  imagePreviewText: { fontFamily: FONTS.bodyRegular, color: COLORS.textSecondary, fontSize: 16 },
  selectImageButton: {
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
  selectImageButtonText: { color: COLORS.textPrimary, fontFamily: FONTS.subTitleMedium },
  deleteButton: { backgroundColor: COLORS.negative, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.card, marginBottom: 12 },
  deleteButtonText: { color: "#fff", fontFamily: FONTS.bodyRegular },
  imageNotice: { marginTop: 6, fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, textAlign: "center" },
});
