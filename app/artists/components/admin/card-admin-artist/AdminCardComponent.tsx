// AdminCardComponent: tarjeta simple para un artista (JR)
// Comentarios en español, código en inglés

import React from "react";
import { View, StyleSheet } from "react-native";
import { Artist } from "@/app/artists/types/Artist";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import ArtistImage from "@/app/artists/components/ArtistImageComponent";
import AdminCardInfoComponent from "./AdminCardInfoComponent";
import AdminCardBtnComponent from "./AdminCardBtnComponent";

type Props = {
  // artista a mostrar
  artist: Artist;
  // callbacks para acciones
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

// helper: no requerido aquí; se maneja dentro del Info component

export default function AdminCardComponent({ artist, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      {/* fila con imagen + info */}
      <View style={styles.row}>
        <ArtistImage imageUrl={artist.image} size={72} />
        <AdminCardInfoComponent name={artist.name} creationDate={artist.creationDate} />
      </View>

      {/* acciones */}
      <View style={styles.btnRow}>
        <AdminCardBtnComponent
          label="Editar"
          variant="edit"
          onPress={() => onEdit(artist.idArtista)}
        />
        <AdminCardBtnComponent
          label="Eliminar"
          variant="delete"
          onPress={() => onDelete(artist.idArtista)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // tarjeta base
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // fila superior
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  // botones
  btnRow: { flexDirection: "row", gap: 8, marginTop: 8 },
});
