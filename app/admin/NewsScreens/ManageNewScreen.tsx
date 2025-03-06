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

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

import { getAllNews } from "@/utils/newsHelpers";
import { NewsItem } from "@/interfaces/NewsProps";

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

  const renderItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.tableRow}>
      {/* Para demo, no tenemos fecha en NewsItem, 
          podrías agregarla en la interfaz si quieres */}
      <Text style={[styles.cell, styles.dateCell]}>23/02/2025</Text>

      {/* Título de la noticia */}
      <Text style={[styles.cell, styles.titleCell]} numberOfLines={1}>
        {item.title}
      </Text>

      {/* Acciones con íconos */}
      <View style={[styles.cell, styles.actionCell]}>
        {/* Ícono de Editar (lapicito) */}
        <IconButton
          icon="pencil"
          size={20}
          iconColor="#fff"
          style={[styles.actionIcon, { backgroundColor: "#6a1b9a" }]}
          onPress={() => handleEdit(item.id)}
        />
        {/* Ícono de Eliminar (basura) */}
        <IconButton
          icon="delete"
          size={20}
          iconColor="#fff"
          style={[styles.actionIcon, { backgroundColor: "#d32f2f" }]}
          onPress={() => handleDelete(item.id)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.title}>Modificar noticias:</Text>

        {/* Cabecera de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCell]}>
            Fecha de creación
          </Text>
          <Text style={[styles.headerCell, styles.titleCell]}>
            Título de la noticia
          </Text>
          <Text style={[styles.headerCell, styles.actionCell]}>
            Acción
          </Text>
        </View>

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
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
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
  dateCell: {
    flex: 2,
  },
  titleCell: {
    flex: 4,
    marginHorizontal: 4,
  },
  actionCell: {
    flex: 3,
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
