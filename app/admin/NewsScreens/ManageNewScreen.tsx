// src/screens/admin/NewsScreens/ManageNewsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter, usePathname } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";

import { getNews, deleteNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function ManageNewsScreen() {
  const router = useRouter();
  const path = usePathname(); // p.ej. "/admin/NewsScreens/ManageNewsScreen"

  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await getNews();
        setNewsData(all);
      } catch (err) {
        console.error("Error al cargar las noticias:", err);
        setError("Error al cargar las noticias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tabs = [
    {
      label: "Adm Noticias",
      route: "/admin/NewsScreens/ManageNewsScreen",
      isActive: path === "/admin/NewsScreens/ManageNewsScreen",
    },
    {
      label: "Adm Artistas",
      route: "/admin/ArtistScreens/ManageArtistsScreen",
      isActive: path === "/admin/ArtistScreens/ManageArtistsScreen",
    },
    {
      label: "Noticias",
      route: "/main/NewsScreens/NewsScreen",
      isActive: path === "/main/NewsScreens/NewsScreen",
    },
    {
      label: "Artistas",
      route: "/main/ArtistsScreens/ArtistsScreen",
      isActive: path === "/main/ArtistsScreens/ArtistsScreen",
    },
  ];

  const handleCreate = () => {
    router.push("/admin/NewsScreens/CreateNewScreen");
  };

  const handleEdit = (idNoticia: string) => {
    router.push(`/admin/NewsScreens/EditNewScreen?id=${idNoticia}`);
  };

  const handleDelete = (idNoticia: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Seguro que quieres eliminar esta noticia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNews(idNoticia);
              setNewsData((prev) =>
                prev.filter((n) => n.idNoticia !== idNoticia)
              );
            } catch {
              Alert.alert("Error al eliminar la noticia");
            }
          },
        },
      ]
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
            >
              <Text style={styles.createButtonText}>Crear noticia</Text>
            </TouchableOpacity>

            <Text style={styles.screenTitle}>Modificar noticias:</Text>

            <FlatList
              data={newsData}
              keyExtractor={(item) => item.idNoticia}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dateText}>
                        <Text style={styles.label}>Publicado: </Text>
                        {new Date(item.dtPublicado).toLocaleDateString()}
                      </Text>
                      <Text style={styles.titleText}>
                        <Text style={styles.label}>Título: </Text>
                        {item.titulo}
                      </Text>
                    </View>
                    {item.imagen ? (
                      <Image
                        source={{ uri: item.imagen }}
                        style={styles.thumbnail}
                      />
                    ) : (
                      <View style={[styles.thumbnail, styles.noImage]}>
                        <Text style={styles.noImageText}>Sin imagen</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionsRow}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#fff"
                      style={[styles.actionIcon, styles.editIcon]}
                      onPress={() => handleEdit(item.idNoticia)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#fff"
                      style={[styles.actionIcon, styles.deleteIcon]}
                      onPress={() => handleDelete(item.idNoticia)}
                    />
                  </View>
                </View>
              )}
            />
          </View>
        )}

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
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
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
  },
  screenTitle: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dateText: {
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
  },
  titleText: {
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.card,
    marginLeft: 8,
  },
  noImage: {
    backgroundColor: COLORS.borderInput,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  actionIcon: {
    marginHorizontal: 4,
    borderRadius: 4,
  },
  editIcon: {
    backgroundColor: "#6a1b9a",
  },
  deleteIcon: {
    backgroundColor: "#d32f2f",
  },
  errorText: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
  },
});
