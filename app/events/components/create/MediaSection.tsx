import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import ImagePickerComponent from "@/components/common/ImagePickerComponent";
import { COLORS, RADIUS } from "@/styles/globalStyles";

interface Props {
  photoFile: string | { uri: string } | null;
  onChangePhoto?: (img: string | { uri: string } | null) => void;
  videoLink: string;
  musicLink: string;
  onSelectPhoto?: () => void; // legacy prop kept for compat
  onDeletePhoto?: () => void;
  onChangeVideo: (t: string) => void;
  onChangeMusic: (t: string) => void;
  isChecking?: boolean; // ignored: ImagePicker handles its own loading
  photoTooLarge?: boolean; // handled by parent if needed
  photoFileSize?: number | null;
  maxImageBytes?: number;
}

export default function MediaSection(props: Props) {
  const {
    photoFile,
    onChangePhoto,
    onChangeVideo,
    onChangeMusic,
    maxImageBytes = 1 * 1024 * 1024,
    videoLink,
    musicLink,
  } = props;

  return (
    <View style={styles.card}>
      <ImagePickerComponent
        value={typeof photoFile === 'object' && photoFile?.uri ? photoFile.uri : photoFile}
        onChange={(uri) => {
          if (onChangePhoto) {
            if (uri) {
              onChangePhoto({ uri });
            } else {
              onChangePhoto(null);
            }
          }
          if (uri === null && props.onDeletePhoto) props.onDeletePhoto();
          if (uri && props.onSelectPhoto) props.onSelectPhoto();
        }}
        maxBytes={maxImageBytes}
        allowedExts={["jpg", "jpeg", "png"]}
        label="Imagen del evento"
      />

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
  },
});
