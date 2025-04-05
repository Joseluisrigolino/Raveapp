// screens/NewsScreens/ManageNewsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { getNews, deleteNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageNewsScreen() {
  const router = useRouter();
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de noticias
  useEffect(() => {
    fetchAllNews();
  }, []);

  async function fetchAllNews() {
    try {
      const data = await getNews();
      setNewsData(data);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Error al cargar las noticias");
    } finally {
      setLoading(false);
    }
  }

  // Navegar a EditNewsScreen
  const handleEdit = (itemId: string) => {
    console.log("Editar noticia con ID:", itemId);
    router.push(`/admin/NewsScreens/EditNewScreen?id=${itemId}`);
  };

  // Eliminar (con confirmación)
  const handleDelete = (itemId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta noticia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Llamada a la API para eliminar la noticia
              await deleteNews(itemId);
              console.log("Noticia eliminada con ID:", itemId);
              // Refrescar la lista local
              setNewsData((prev) => prev.filter((n) => n.idNoticia !== itemId));
            } catch (err) {
              console.error("Error deleting news:", err);
              Alert.alert("Error al eliminar la noticia");
            }
          },
        },
      ]
    );
  };

  // Renderiza cada noticia
  const renderItem = ({ item }: { item: NewsItem }) => {
    // Fecha simulada (si no se dispone de la fecha en la noticia)
    const fakeDate = "23/02/2025";

    return (
      <View style={styles.cardContainer}>
        {/* Cabecera: Texto (fecha y título) a la izquierda, imagen a la derecha */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              <Text style={styles.label}>Fecha de creación: </Text>
              {fakeDate}
            </Text>
            <Text style={styles.titleText}>
              <Text style={styles.label}>Título de la noticia: </Text>
              {item.titulo}
            </Text>
          </View>

          {/* Si existe imagen, la muestra; de lo contrario, un recuadro "Sin imagen" */}
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.noImage]}>
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
        </View>

        {/* Fila de acciones: Editar / Eliminar */}
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
    );
  };

  // Botón "Crear noticia"
  const handleCreateNews = () => {
    router.push("/admin/NewsScreens/CreateNewScreen");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Botón "Crear noticia" */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
          <Text style={styles.createButtonText}>Crear noticia</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Modificar noticias:</Text>

        <FlatList
          data={newsData}
          keyExtractor={(item) => item.idNoticia}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
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
  listContent: {
    paddingBottom: 20,
  },
  // CARD
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
  label: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  dateText: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  titleText: {
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.card,
    marginLeft: 8,
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
  },
  noImageText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.small,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
