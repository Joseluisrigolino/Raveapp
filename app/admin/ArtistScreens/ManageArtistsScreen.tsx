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
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getAllArtists, searchArtistsByName } from "@/utils/artistHelpers";
import { Artist } from "@/interfaces/Artist";

export default function ManageArtistsScreen() {
  const router = useRouter();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = () => {
    const data = getAllArtists();
    setArtists(data);
  };

  // Filtra artistas al cambiar el texto de búsqueda
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      loadArtists(); // Si está vacío, recarga todos
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
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
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
