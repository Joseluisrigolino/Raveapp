// Componente para seleccionar y mostrar imagen de artista
// Comentarios en español, internals en inglés
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, RADIUS } from '@/styles/globalStyles';

type Props = {
  image: string | null;
  onPick: () => void | Promise<void>;
  onRemove: () => void;
  label?: string; // texto de etiqueta (en español)
  showNotice?: boolean;
  noticeText?: string; // texto del aviso (en español)
  deleteLabel?: string; // texto del botón eliminar (en español)
};

// Componente reutilizable para selección de imagen de artista
export default function SelectImageArtistComponent({
  image,
  onPick,
  onRemove,
  label = 'Foto del artista',
  showNotice = false,
  noticeText,
  deleteLabel = 'Eliminar imagen',
}: Props) {
  // Render simple: imagen si existe, sino preview
  return (
    <View>
      <Text style={localStyles.sectionLabel}>{label}</Text>
      <View style={localStyles.imageContainer}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={localStyles.artistImage} />
            <TouchableOpacity style={localStyles.deleteButton} onPress={onRemove}>
              <Text style={localStyles.deleteButtonText}>{deleteLabel}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={localStyles.previewCircle}>
            <MaterialCommunityIcons name="account" size={42} color={COLORS.textSecondary} />
            <Text style={localStyles.previewText}>Vista previa</Text>
          </View>
        )}

        <TouchableOpacity style={localStyles.selectImageButton} onPress={onPick}>
          <Text style={localStyles.selectImageButtonText}>Seleccionar imagen</Text>
        </TouchableOpacity>

        {showNotice && noticeText ? <Text style={localStyles.imageNotice}>{noticeText}</Text> : null}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  imageContainer: {
    alignItems: 'center',
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
    borderStyle: 'dashed',
    borderColor: '#c8cfd9',
    backgroundColor: '#dbe2ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewText: {
    marginTop: 6,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
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
    textAlign: 'center',
  },
});
