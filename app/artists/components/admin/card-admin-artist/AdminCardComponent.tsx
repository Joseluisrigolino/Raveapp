// app/artists/components/admin/card-admin-artist/AdminCardComponent.tsx

// Tarjeta de artista en modo admin: muestra datos básicos + botones de editar / eliminar.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Artist } from "@/app/artists/types/Artist";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import ArtistImage from "@/app/artists/components/ArtistImageComponent";
import AdminCardInfoComponent from "./AdminCardInfoComponent";
import AdminCardBtnComponent from "./AdminCardBtnComponent";

type Props = {
  artist: Artist; // Artista a mostrar en la tarjeta
  onEdit: (id: string) => void; // Callback cuando se toca "Editar"
  onDelete: (id: string) => void; // Callback cuando se toca "Eliminar"
};

export default function AdminCardComponent({
  artist,
  onEdit,
  onDelete,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Fila superior: imagen + información básica */}
      <View style={styles.row}>
        <ArtistImage imageUrl={artist.image} size={72} />
        <AdminCardInfoComponent
          name={artist.name}
          creationDate={artist.creationDate}
        />
      </View>

      {/* Fila de acciones: botones de editar y eliminar */}
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
  // Contenedor principal de la card
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
  // Fila de imagen + info
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  // Fila de botones
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
});
