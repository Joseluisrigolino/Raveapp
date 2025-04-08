// src/screens/admin/ManageArtistsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getAllArtists, searchArtistsByName } from "@/utils/artists/artistHelpers";
import { Artist } from "@/interfaces/Artist";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageArtistsScreen() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchText, setSearchText] = useState("");

  // Función para cargar artistas (desde la API o mock)
  const loadArtists = () => {
    const data = getAllArtists();
    setArtists(data);
  };

  // Carga inicial
  useEffect(() => {
    loadArtists();
  }, []);

  // Recargar artistas cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      loadArtists();
    }, [])
  );

  // Filtrar artistas al escribir en el buscador
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      loadArtists();
    } else {
      const results = searchArtistsByName(text);
      setArtists(results);
    }
  };

  // Navegar a EditArtistScreen
  const handleEdit = (id: number) => {
    router.push(`/admin/ArtistScreens/EditArtistScreen?id=${id}`);
  };

  // Eliminar con confirmación
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
            // Aquí deberías llamar a la función para eliminar el artista (API, etc.)
          },
        },
      ]
    );
  };

  // Botón para crear artista
  const handleCreateArtist = () => {
    router.push("/admin/ArtistScreens/NewArtistScreen");
  };

  // Renderiza cada artista como una “card”, estilo similar a ManageNewsScreen
  const renderItem = ({ item }: { item: Artist }) => {
    // Fecha simulada si no existe
    const fakeDate = "23/02/2025";

    return (
      <View style={styles.cardContainer}>
        {/* Cabecera: texto (fecha y nombre) a la izquierda, imagen a la derecha */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              <Text style={styles.label}>Fecha de creación: </Text>
              {item.creationDate || fakeDate}
            </Text>
            <Text style={styles.titleText}>
              <Text style={styles.label}>Nombre del artista: </Text>
              {item.name}
            </Text>
          </View>
          {/* Imagen circular del artista */}
          <Image
            source={{ uri: item.image }}
            style={styles.artistImage}
            resizeMode="cover"
          />
        </View>

        {/* Fila de acciones: editar / eliminar */}
        <View style={styles.actionsRow}>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Botón "Crear artista" al inicio */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateArtist}>
          <Text style={styles.createButtonText}>Crear artista</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Modificar artistas:</Text>

        {/* Barra de búsqueda */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artistas"
            value={searchText}
            onChangeText={handleSearch}
          />
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
  screenTitle: {
    fontSize: FONT_SIZES.subTitle,
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
  listContent: { paddingBottom: 20 },
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontWeight: "bold", color: COLORS.textPrimary },
  dateText: { color: COLORS.textSecondary, marginBottom: 4 },
  titleText: { color: COLORS.textPrimary, marginBottom: 8 },
  actionsRow: { flexDirection: "row", marginTop: 8 },
  actionIcon: { marginHorizontal: 4, borderRadius: 4 },
  artistImage: { width: 40, height: 40, borderRadius: 20 },
});
