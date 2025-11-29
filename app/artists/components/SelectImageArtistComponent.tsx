// app/artists/components/SelectImageArtistComponent.tsx

// Componente para seleccionar y mostrar la imagen de un artista.
// La pantalla le pasa la URL/URI actual y callbacks para elegir o borrar.

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

// Props del componente: lo mantenemos simple y en español para los textos visibles.
type Props = {
  image: string | null; // URL/URI actual de la imagen (o null si no hay)
  onPick: () => void | Promise<void>; // callback para abrir el picker
  onRemove: () => void; // callback para borrar imagen (en backend o solo preview)
  label?: string; // texto sobre el campo (ej: "Foto del artista")
  showNotice?: boolean; // si queremos mostrar un aviso debajo
  noticeText?: string; // contenido del aviso (ej: "JPG / PNG hasta 2MB")
  deleteLabel?: string; // texto del botón de eliminar
  containerStyle?: StyleProp<ViewStyle>; // estilo opcional para el contenedor externo
};

// Componente reutilizable para selección de imagen de artista
const SelectImageArtistComponent: React.FC<Props> = ({
  image,
  onPick,
  onRemove,
  label = "Foto del artista",
  showNotice = false,
  noticeText,
  deleteLabel = "Eliminar imagen",
  containerStyle,
}) => {
  return (
    <View style={containerStyle}>
      {/* Etiqueta del campo */}
      <Text style={styles.sectionLabel}>{label}</Text>

      <View style={styles.imageContainer}>
        {/* Si hay imagen, la mostramos junto con el botón para eliminar */}
        {image ? (
          <>
            <Image source={getSafeImageSource(image)} style={styles.artistImage} />
            <TouchableOpacity style={styles.deleteButton} onPress={onRemove}>
              <Text style={styles.deleteButtonText}>{deleteLabel}</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Si no hay imagen, mostramos una “vista previa” con un ícono
          <View style={styles.previewCircle}>
            <MaterialCommunityIcons
              name="account"
              size={42}
              color={COLORS.textSecondary}
            />
            <Text style={styles.previewText}>Vista previa</Text>
          </View>
        )}

        {/* Botón para abrir el selector de imagen */}
        <TouchableOpacity style={styles.selectImageButton} onPress={onPick}>
          <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
        </TouchableOpacity>

        {/* Aviso opcional (por ejemplo: límites de tamaño o formatos) */}
        {showNotice && noticeText ? (
          <Text style={styles.imageNotice}>{noticeText}</Text>
        ) : null}
      </View>
    </View>
  );
};

export default SelectImageArtistComponent;

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  artistImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 12,
  },
  previewCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c8cfd9",
    backgroundColor: "#dbe2ea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  previewText: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
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
  selectImageButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  selectImageButtonText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
  },
  imageNotice: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    textAlign: "center",
  },
});
