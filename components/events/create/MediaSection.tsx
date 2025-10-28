import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/styles/globalStyles";

interface Props {
  photoFile: string | null;
  videoLink: string;
  musicLink: string;
  onSelectPhoto: () => void;
  onDeletePhoto?: () => void;
  onChangeVideo: (t: string) => void;
  onChangeMusic: (t: string) => void;
  isChecking?: boolean;
  photoTooLarge?: boolean;
  photoFileSize?: number | null;
  // Máximo permitido en bytes (para mostrar mensajes consistentes con el límite real)
  maxImageBytes?: number;
}

export default function MediaSection({
  photoFile,
  videoLink,
  musicLink,
  onSelectPhoto,
  onChangeVideo,
  onChangeMusic,
  isChecking = false,
  photoTooLarge = false,
  photoFileSize = null,
  maxImageBytes = 1 * 1024 * 1024,
}: Props) {
  const fmtBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    if (bytes >= 1024 * 1024) {
      const mb = bytes / (1024 * 1024);
      const val = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10;
      return `${val} MB`;
    }
    const kb = bytes / 1024;
    const val = kb >= 10 ? Math.round(kb) : Math.round(kb * 10) / 10;
    return `${val} KB`;
  };
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Imagen del evento</Text>

      {photoTooLarge ? (
        <View style={[styles.uploadArea, styles.previewTooLarge]}>
          <Text style={styles.tooLargeText}>
            La imagen seleccionada supera {fmtBytes(maxImageBytes)}
            {photoFileSize ? ` (${Math.round(photoFileSize/1024)} KB).` : "."}
          </Text>
          <Text style={styles.tooLargeSub}>Seleccioná otra imagen más liviana.</Text>
        </View>
      ) : (
        <TouchableOpacity
          testID="select-button"
          style={[styles.uploadArea, isChecking && styles.fileBtnDisabled]}
          onPress={onSelectPhoto}
          disabled={isChecking}
          activeOpacity={0.8}
        >
          {isChecking ? (
            <ActivityIndicator testID="select-loading" color={COLORS.textSecondary} />
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.previewEmptyText}>Toca para subir imagen</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Vista previa (si hay imagen se muestra aquí) */}
      <View style={styles.previewBox}>
        {photoFile ? (
          <Image source={{ uri: photoFile }} style={styles.previewBoxImage} />
        ) : (
          <View style={styles.previewBoxEmpty}>
            <Text style={styles.previewBoxEmptyText}>Vista previa</Text>
          </View>
        )}
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Enlaces multimedia</Text>

      <TextInput
        style={styles.textInput}
        value={videoLink}
        onChangeText={onChangeVideo}
        keyboardType="url"
        placeholder="Enlace de YouTube"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.textInput}
        value={musicLink}
        onChangeText={onChangeMusic}
        keyboardType="url"
        placeholder="Enlace de SoundCloud"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center" },
  fileBtnDisabled: { opacity: 0.7 },
  uploadArea: {
    width: "100%",
    height: 160,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderStyle: 'dashed',
    borderRadius: RADIUS.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  previewEmptyText: { color: COLORS.textSecondary, marginTop: 8 },
  previewBox: {
    marginTop: 12,
    backgroundColor: '#e9ecef',
    height: 140,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBoxImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewBoxEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  previewBoxEmptyText: { color: COLORS.textSecondary },
  previewTooLarge: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  tooLargeText: {
    color: COLORS.negative,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  tooLargeSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    width: "100%",
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 14,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    color: COLORS.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
});
