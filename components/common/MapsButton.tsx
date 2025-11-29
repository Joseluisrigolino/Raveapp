import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { COLORS, FONTS } from "@/styles/globalStyles";

type Props = {
  query?: string;
  onPress?: () => void;
  disabled?: boolean;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export default function MapsButton({ query, onPress, disabled, title = "Cómo llegar", style }: Props) {
  const handlePress = () => {
    if (disabled) return;
    if (onPress) return onPress();
    if (!query) return;
    const destination = String(query || "").trim();
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      try {
        const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
        Linking.openURL(fallback);
      } catch {}
    });
  };

  return (
    <TouchableOpacity
      style={[{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 }, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <MaterialCommunityIcons name="map-marker" size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={{ color: '#fff', fontFamily: FONTS.subTitleMedium, fontSize: 16, textAlign: 'center' }}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontFamily: FONTS.subTitleMedium,
  },
});
