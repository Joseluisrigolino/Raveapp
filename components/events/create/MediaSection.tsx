import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";

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
  onDeletePhoto,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        Foto <Text style={{ color: COLORS.negative }}>(obligatoria)</Text>
      </Text>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <TouchableOpacity
          testID="select-button"
          style={[styles.fileBtn, isChecking && styles.fileBtnDisabled]}
          onPress={onSelectPhoto}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator testID="select-loading" color="#fff" />
          ) : (
            <Text style={styles.fileBtnText}>Seleccionar imagen</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.fileName}>
          {photoFile ? "Archivo seleccionado" : "Ninguno…"}
        </Text>
      </View>
      <Text style={styles.hint}>
        La imagen debe pesar menos de 2MB y ser JPG, JPEG o PNG
      </Text>

      <View style={{ marginTop: 10 }}>
        <Text style={styles.label}>Previsualización:</Text>
        {photoTooLarge ? (
          <View style={[styles.previewImage, styles.previewTooLarge]}>
            <Text style={styles.tooLargeText}>
              La imagen seleccionada pesa más de 2MB ({photoFileSize ? `${Math.round(photoFileSize/1024)} KB` : ""}).
            </Text>
            <Text style={styles.tooLargeSub}>Seleccioná otra imagen más liviana.</Text>
          </View>
        ) : photoFile ? (
          <>
            <Image source={{ uri: photoFile }} style={styles.previewImage} />
            {onDeletePhoto ? (
              <TouchableOpacity style={styles.deleteButton} onPress={onDeletePhoto}>
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <View style={[styles.previewImage, styles.previewEmpty]} />
        )}
      </View>

      <InputText
        label="Video (opcional)"
        value={videoLink}
        isEditing={true}
        onBeginEdit={() => {}}
        onChangeText={onChangeVideo}
        placeholder="Pega el link de YouTube aquí"
        keyboardType="url"
        labelStyle={{ width: "100%" }}
        inputStyle={{ width: "100%" }}
      />

      <InputText
        label="Música (SoundCloud – opcional)"
        value={musicLink}
        isEditing={true}
        onBeginEdit={() => {}}
        onChangeText={onChangeMusic}
        placeholder="Pega el link de SoundCloud aquí"
        keyboardType="url"
        labelStyle={{ width: "100%", marginTop: 12 }}
        inputStyle={{ width: "100%" }}
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
  fileBtn: {
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.card,
  },
  fileBtnText: { color: "#fff", fontWeight: "700" },
  fileName: { color: COLORS.textSecondary },
  fileBtnDisabled: { opacity: 0.7 },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.card,
    resizeMode: "cover",
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewEmpty: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
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
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
});
