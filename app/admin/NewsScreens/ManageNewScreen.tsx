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
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { getAllNews } from "@/utils/news/newsHelpers";
import { NewsItem } from "@/interfaces/NewsProps";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageNewsScreen() {
  const router = useRouter();
  const [newsData, setNewsData] = useState<NewsItem[]>([]);

  useEffect(() => {
    const data = getAllNews();
    setNewsData(data);
  }, []);

  // Navegar a EditNewsScreen
  const handleEdit = (itemId: number) => {
    console.log("Editar noticia con ID:", itemId);
    router.push(`/admin/NewsScreens/EditNewScreen?id=${itemId}`);
  };

  // Eliminar (con confirmación)
  const handleDelete = (itemId: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta noticia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            console.log("Eliminar noticia con ID:", itemId);
            // Aquí tu lógica real para eliminar la noticia (API, etc.)
          },
        },
      ]
    );
  };

  // Renderiza cada noticia
  const renderItem = ({ item }: { item: NewsItem }) => {
    // Fecha simulada (si no la tienes en NewsItem)
    const fakeDate = "23/02/2025";

    return (
      <View style={styles.cardContainer}>
        {/* Cabecera: texto (fecha/título) a la izquierda, imagen a la derecha */}
        <View style={styles.cardHeader}>
          {/* Bloque de texto (fecha y título) */}
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              <Text style={styles.label}>Fecha de creación: </Text>
              {fakeDate}
            </Text>

            <Text style={styles.titleText}>
              <Text style={styles.label}>Título de la noticia: </Text>
              {item.title}
            </Text>
          </View>

          {/* Imagen pequeña (thumbnail) a la derecha */}
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        {/* Fila de acciones: Editar / Eliminar */}
        <View style={styles.actionsRow}>
          <IconButton
            icon="pencil"
            size={20}
            iconColor="#fff"
            style={[styles.actionIcon, styles.editIcon]}
            onPress={() => handleEdit(item.id)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#fff"
            style={[styles.actionIcon, styles.deleteIcon]}
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </View>
    );
  };

  // Botón "Crear noticia"
  const handleCreateNews = () => {
    router.push("/admin/NewsScreens/CreateNewScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Botón "Crear noticia" arriba de la lista */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
          <Text style={styles.createButtonText}>Crear noticia</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Modificar noticias:</Text>

        <FlatList
          data={newsData}
          keyExtractor={(item) => item.id.toString()}
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
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Cabecera de la tarjeta: texto + thumbnail
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

  actionsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  actionIcon: {
    marginHorizontal: 4,
    borderRadius: 4,
  },
  editIcon: {
    backgroundColor: "#6a1b9a", // Morado
  },
  deleteIcon: {
    backgroundColor: "#d32f2f", // Rojo
  },
});
