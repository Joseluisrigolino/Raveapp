import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";

interface Props {
  photoFile: string | null;
  videoLink: string;
  musicLink: string;
  onSelectPhoto: () => void;
  onChangeVideo: (t: string) => void;
  onChangeMusic: (t: string) => void;
  isChecking?: boolean;
}

export default function MediaSection({
  photoFile,
  videoLink,
  musicLink,
  onSelectPhoto,
  onChangeVideo,
  onChangeMusic,
  isChecking = false,
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
            <Text style={styles.fileBtnText}>SELECCIONAR ARCHIVO</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.fileName}>
          {photoFile ? "Archivo seleccionado" : "Ninguno…"}
        </Text>
      </View>
      <Text style={styles.hint}>
        La imagen debe pesar menos de 2MB y ser JPG, JPEG o PNG
      </Text>

      {photoFile && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Previsualización:</Text>
          <Image source={{ uri: photoFile }} style={styles.previewImage} />
        </View>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>Video (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Pega el link de YouTube aquí"
        value={videoLink}
        onChangeText={onChangeVideo}
      />

      <Text style={[styles.label, { marginTop: 12 }]}>
        Música (SoundCloud – opcional)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Pega el link de SoundCloud aquí"
        value={musicLink}
        onChangeText={onChangeMusic}
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
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
});
