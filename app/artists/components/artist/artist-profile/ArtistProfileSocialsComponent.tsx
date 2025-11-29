// app/artists/components/artist/artist-profile/ArtistProfileSocialsComponent.tsx
// Botón de red social del artista (Spotify, SoundCloud, Instagram, etc.)

import React from "react";
import {
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/styles/globalStyles";

type SocialItem = {
  key: string;   // identificador interno (spotify, soundcloud, instagram, etc.)
  icon: string;  // nombre del icono en MaterialCommunityIcons
  color: string; // color principal de esa red
  field: string; // campo asociado en el artista (no se usa acá, pero lo mantiene genérico)
};

type Props = {
  item: SocialItem;              // Config visual de la red
  url?: string | null;           // URL de la red para este artista
  size?: number;                 // Tamaño del icono
  style?: StyleProp<ViewStyle>;  // Estilo opcional para el wrapper
};

export default function SocialArtist({
  item,
  url,
  size = 22,
  style,
}: Props) {
  // Abre el link en el navegador / app correspondiente
  const openLink = (raw?: string) => {
    // Si no hay URL válida, avisamos y salimos
    if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
      Alert.alert("Enlace no disponible");
      return;
    }

    // Si no viene con http/https, le agregamos https por defecto
    const link = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    Linking.openURL(link).catch(() =>
      Alert.alert("No se pudo abrir el enlace")
    );
  };

  // Si no hay URL, usamos un color gris para indicar que está deshabilitado
  const hasUrl = typeof url === "string" && url.trim().length > 0;
  const iconColor = hasUrl ? item.color : COLORS.textSecondary;

  return (
    <TouchableOpacity
      key={item.key}
      style={[styles.iconWrap, style]}
      activeOpacity={hasUrl ? 0.7 : 1}
      onPress={() => (hasUrl ? openLink(url) : Alert.alert("Enlace no disponible"))}
    >
      <MaterialCommunityIcons
        name={item.icon as any}
        size={size}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
