import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { getAllNews } from "@/utils/news/newsHelpers";
import { NewsItem } from "@/interfaces/NewsProps";

// Importa tus estilos globales si deseas
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageNewsScreen() {
  const router = useRouter();

  const [newsData, setNewsData] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Cargamos las noticias desde el helper (mock).
    const data = getAllNews();
    setNewsData(data);
  }, []);

  // Editar -> Navegar a EditNewsScreen con el ID
  const handleEdit = (itemId: number) => {
    console.log("Editar noticia con ID:", itemId);
    router.push(`/admin/NewsScreens/EditNewScreen?id=${itemId}`);
  };

  // Eliminar -> Muestra popup de confirmación
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

  // Renderiza cada noticia como una “card”
  const renderItem = ({ item }: { item: NewsItem }) => {
    // Supongamos que no tenemos fecha en NewsItem,
    // por demo usaremos un valor estático “23/02/2025”
    const fakeDate = "23/02/2025";

    return (
      <View style={styles.cardContainer}>
        {/* Fecha de creación (ficticia) */}
        <Text style={styles.dateText}>
          <Text style={styles.label}>Fecha de creación: </Text>
          {fakeDate}
        </Text>

        {/* Título de la noticia */}
        <Text style={styles.titleText}>
          <Text style={styles.label}>Título de la noticia: </Text>
          {item.title}
        </Text>

        {/* Acciones: editar / eliminar */}
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

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
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
  screenTitle: {
    fontSize: FONT_SIZES.subTitle, // 18-20
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },

  // CARD
  cardContainer: {
    backgroundColor: COLORS.cardBg, // Ej. "#fff"
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,

    // Sombra suave (opcional)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

  actionsRow: {
    flexDirection: "row",
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
