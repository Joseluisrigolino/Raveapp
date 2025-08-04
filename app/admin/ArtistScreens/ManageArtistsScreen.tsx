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
  ActivityIndicator,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter, usePathname } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import Header from "@/components/layout/HeaderComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import Footer from "@/components/layout/FooterComponent";
import {
  fetchArtistsFromApi,
  deleteArtistFromApi,
} from "@/utils/artists/artistApi";
import { mediaApi } from "@/utils/mediaApi";
import { Artist } from "@/interfaces/Artist";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function ManageArtistsScreen() {
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
  const isAdmin = roles.includes("admin");

  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await fetchArtistsFromApi();

      const sorted = data.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );

      setArtists(sorted);
    } catch (error) {
      console.error("Error al cargar artistas:", error);
      Alert.alert("Error", "No se pudieron cargar los artistas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadArtists();
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleEdit = (idArtista: string) => {
    router.push({
      pathname: "/admin/ArtistScreens/EditArtistScreen",
      params: { id: idArtista },
    });
  };

  const handleDelete = (idArtista: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Seguro que deseas eliminar este artista?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const media = await mediaApi.getByEntidad(idArtista);
              if (media?.media?.length > 0) {
                for (const m of media.media) {
                  await mediaApi.delete(m.idMedia);
                }
              }

              await deleteArtistFromApi(idArtista);

              setArtists((prev) =>
                prev.filter((a) => a.idArtista !== idArtista)
              );
              Alert.alert("Éxito", "Artista eliminado.");
            } catch (err) {
              console.error("Error al eliminar artista o media:", err);
              Alert.alert("Error", "No se pudo eliminar el artista.");
            }
          },
        },
      ]
    );
  };

  const handleCreateArtist = () => {
    router.push("/admin/ArtistScreens/NewArtistScreen");
  };

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Adm Artistas",
            route: "/admin/ArtistScreens/ManageArtistsScreen",
            isActive: path === "/admin/ArtistScreens/ManageArtistsScreen",
          },
        ]
      : []),
    {
      label: "Artistas",
      route: "/main/ArtistsScreens/ArtistsScreen",
      isActive: path === "/main/ArtistsScreens/ArtistsScreen",
    },
  ];

  const renderItem = ({ item }: { item: Artist }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          <Text style={styles.label}>Creado:</Text>
          <Text style={styles.dateText}>{item.creationDate}</Text>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.titleText}>{item.name}</Text>
        </View>
        <Image
          source={{ uri: item.image }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.fullButton, { backgroundColor: COLORS.primary }]}
          onPress={() => handleEdit(item.idArtista)}
        >
          <Text style={styles.fullButtonText}>Modificar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fullButton, { backgroundColor: COLORS.negative }]}
          onPress={() => handleDelete(item.idArtista)}
        >
          <Text style={styles.fullButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabMenuComponent tabs={tabs} />

      <View style={styles.content}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateArtist}>
          <Text style={styles.createText}>+ Crear artista</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Gestionar Artistas</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchText}
          onChangeText={handleSearch}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.idArtista}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  createText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
  },
  screenTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  list: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  dateText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  titleText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: RADIUS.sm,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  fullButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6, // más bajo
    alignItems: "center",
    
  },
  fullButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.bodyRegular, // menos pesado
    fontSize: FONT_SIZES.smallText, // más chico
  },
});
