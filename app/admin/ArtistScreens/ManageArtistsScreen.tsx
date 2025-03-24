// screens/admin/ManageArtistsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getAllArtists, searchArtistsByName } from "@/utils/artists/artistHelpers";
import { Artist } from "@/interfaces/Artist";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageArtistsScreen() {
  const router = useRouter();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchText, setSearchText] = useState("");

  // Carga inicial
  useEffect(() => {
    loadArtists();
  }, []);

  // Función para recargar todos
  const loadArtists = () => {
    const data = getAllArtists();
    setArtists(data);
  };

  // Filtra artistas
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      loadArtists();
    } else {
      const results = searchArtistsByName(text);
      setArtists(results);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/ArtistScreens/EditArtistScreen?id=${id}`);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este artista?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            console.log("Eliminar artista con ID:", id);
            // Lógica real de eliminar
          },
        },
      ]
    );
  };

  // Nuevo: Botón "Crear artista"
  const handleCreateArtist = () => {
    router.push("/admin/ArtistScreens/CreateArtistScreen");
  };

  const renderItem = ({ item }: { item: Artist }) => (
    <View style={styles.tableRow}>
      {/* Imagen o placeholder */}
      <View style={[styles.cell, styles.imageCell]}>
        {/* Podrías mostrar la imagen con <Image> si deseas */}
        <Text>IMG</Text>
      </View>

      {/* Nombre del artista */}
      <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>
        {item.name}
      </Text>

      {/* Fecha de creación (si existe) */}
      <Text style={[styles.cell, styles.dateCell]}>
        {item.creationDate || "23/02/2025"}
      </Text>

      {/* Botones Editar/Eliminar */}
      <View style={[styles.cell, styles.actionCell]}>
        <IconButton
          icon="pencil"
          size={20}
          iconColor="#fff"
          style={[styles.actionIcon, { backgroundColor: "#6a1b9a" }]}
          onPress={() => handleEdit(item.id!)}
        />
        <IconButton
          icon="delete"
          size={20}
          iconColor="#fff"
          style={[styles.actionIcon, { backgroundColor: "#d32f2f" }]}
          onPress={() => handleDelete(item.id!)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Botón "Crear artista" arriba, estilo similar a ManageNewsScreen */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateArtist}>
          <Text style={styles.createButtonText}>Crear artista</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Modificar artistas:</Text>

        {/* Barra de búsqueda */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artistas"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* Cabecera de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.imageCell]}> </Text>
          <Text style={[styles.headerCell, styles.nameCell]}>Artista</Text>
          <Text style={[styles.headerCell, styles.dateCell]}>Fecha de creación</Text>
          <Text style={[styles.headerCell, styles.actionCell]}>Acción</Text>
        </View>

        <FlatList
          data={artists}
          keyExtractor={(item) => item.id?.toString() ?? "0"}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { flex: 1, padding: 16 },

  // Botón "Crear artista"
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  createButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "flex-end",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 200,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  cell: {
    fontSize: 14,
  },
  imageCell: {
    flex: 1,
    alignItems: "center",
  },
  nameCell: {
    flex: 2,
  },
  dateCell: {
    flex: 2,
  },
  actionCell: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  listContent: {
    paddingBottom: 20,
  },
  actionIcon: {
    marginHorizontal: 4,
    borderRadius: 4,
  },
});
