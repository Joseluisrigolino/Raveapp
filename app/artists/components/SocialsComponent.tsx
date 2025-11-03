import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { IconButton } from "react-native-paper";
import { COLORS } from "@/styles/globalStyles";

interface Props {
  instagramURL?: string;
  spotifyURL?: string;
  soundcloudURL?: string;
}

const SocialsComponent: React.FC<Props> = ({ instagramURL, spotifyURL, soundcloudURL }) => (
  <View style={styles.socialRow}>
    <IconButton
      icon="spotify"
      size={24}
      iconColor={spotifyURL ? "#1DB954" : COLORS.textSecondary}
      onPress={() => spotifyURL && Linking.openURL(spotifyURL)}
      disabled={!spotifyURL}
    />
    <IconButton
      icon="soundcloud"
      size={24}
      iconColor={soundcloudURL ? "#FF5500" : COLORS.textSecondary}
      onPress={() => soundcloudURL && Linking.openURL(soundcloudURL)}
      disabled={!soundcloudURL}
    />
    <IconButton
      icon="instagram"
      size={24}
      iconColor={instagramURL ? "#C13584" : COLORS.textSecondary}
      onPress={() => instagramURL && Linking.openURL(instagramURL)}
      disabled={!instagramURL}
    />
  </View>
);

const styles = StyleSheet.create({
  socialRow: { flexDirection: "row" },
});

export default SocialsComponent;
