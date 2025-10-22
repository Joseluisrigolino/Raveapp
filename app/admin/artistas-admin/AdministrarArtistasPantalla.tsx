// src/screens/admin/ManageArtistsScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";
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
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

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
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.EDIT, params: { id: idArtista } });
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
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.NEW });
  };

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Adm Artistas",
            route: ROUTES.ADMIN.ARTISTS.MANAGE,
            isActive: path === ROUTES.ADMIN.ARTISTS.MANAGE,
          },
        ]
      : []),
    {
      label: "Artistas",
      route: ROUTES.MAIN.ARTISTS.LIST,
      isActive: path === ROUTES.MAIN.ARTISTS.LIST,
    },
  ];

  const formatDateEs = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const day = d.getDate().toString().padStart(2, "0");
      const month = d.toLocaleString("es-ES", { month: "long" });
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const year = d.getFullYear();
      return `${day} ${capMonth} ${year}`;
    } catch {
      return iso;
    }
  };

  const renderItem = ({ item }: { item: Artist }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image source={{ uri: item.image }} style={styles.avatar} resizeMode="cover" />
        <View style={styles.infoCol}>
          <Text style={styles.nameText}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-blank" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Creado: {formatDateEs(item.creationDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.fullButton, styles.editBtn]}
          onPress={() => handleEdit(item.idArtista)}
        >
          <Text style={[styles.editBtnText, { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.smallText }]}>Modificar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fullButton, styles.deleteBtn]}
          onPress={() => handleDelete(item.idArtista)}
        >
          <Text style={styles.deleteBtnText}>Eliminar</Text>
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
          <MaterialCommunityIcons name="music-note-outline" size={16} color={COLORS.cardBg} style={{ marginRight: 6 }} />
          <Text style={styles.createText}>Crear artista</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Gestionar Artistas</Text>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artista..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

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
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flexDirection: "row",
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
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
    borderRadius: RADIUS.card,
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
    paddingVertical: 10,
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  editBtnText: {
    color: COLORS.textPrimary,
  },
  deleteBtn: {
    backgroundColor: COLORS.textSecondary,
  },
  deleteBtnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
  },
});
