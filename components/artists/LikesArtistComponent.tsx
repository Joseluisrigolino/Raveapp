import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";


interface Props {
  likedByImages: string[];
  likedByIds: string[];
  isLiked: boolean;
  onToggleLike: () => void;
  avatarMarginLeft?: number;
}

const LikesArtistComponent: React.FC<Props> = ({ likedByImages, likedByIds, isLiked, onToggleLike, avatarMarginLeft = -4 }) => (
  <View style={styles.likesRow}>
    <TouchableOpacity onPress={onToggleLike}>
      <IconButton
        icon={isLiked ? "heart" : "heart-outline"}
        size={28}
        iconColor={isLiked ? COLORS.negative : COLORS.textPrimary}
      />
    </TouchableOpacity>
    <View style={[styles.avatars, { marginLeft: 0 }] }>
      {likedByImages.map((uri, idx) => (
        <Avatar.Image
          key={uri + idx}
          source={{ uri }}
          size={32}
          style={[styles.avatar, { marginLeft: idx === 0 ? 0 : avatarMarginLeft }]}
        />
      ))}
    </View>
    <Text style={[styles.likeText, { marginLeft: likedByImages.length ? 8 : 0 }] }>
      A {likedByIds.length} persona{likedByIds.length !== 1 ? "s" : ""} le gusta esto
    </Text>
  </View>
);

const styles = StyleSheet.create({
  likesRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatars: { flexDirection: "row" },
  avatar: { borderWidth: 2, borderColor: COLORS.cardBg },
  likeText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
});

export default LikesArtistComponent;
