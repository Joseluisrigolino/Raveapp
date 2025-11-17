// Componente simple para mostrar iconos sociales del artista
import React from "react";
import { View, TouchableOpacity, Alert, StyleSheet, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";

type SocialItem = { key: string; icon: string; color: string; field: string };

type Props = {
  // un solo item visual (ej: {key, icon, color, field})
  item: SocialItem;
  // url ya resuelta desde la pantalla (puede ser undefined)
  url?: string | null;
  // tamaño opcional del icono
  size?: number;
  // estilo opcional
  style?: any;
};

// Componente botón social simple. Recibe el item visual y la url.
export default function SocialArtist({ item, url, size = 22, style }: Props) {
  const openLink = (raw?: string) => {
    if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
      Alert.alert("Enlace no disponible");
      return;
    }
    const link = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    Linking.openURL(link).catch(() => Alert.alert("No se pudo abrir el enlace"));
  };

  const hasUrl = typeof url === "string" && url.trim().length > 0;
  const color = hasUrl ? item.color : COLORS.textSecondary;

  return (
    <TouchableOpacity
      key={item.key}
      style={[styles.iconWrap, style]}
      activeOpacity={hasUrl ? 0.7 : 1}
      onPress={() => (hasUrl ? openLink(url) : Alert.alert("Enlace no disponible"))}
    >
      <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
