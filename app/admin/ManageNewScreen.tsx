import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";

// Si usas react-native-paper:
import { IconButton } from "react-native-paper";

// Ajusta estas importaciones según tu proyecto
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

interface NewsAdminItem {
  id: number;
  creationDate: string;
  title: string;
}

const mockNewsData: NewsAdminItem[] = [
  {
    id: 1,
    creationDate: "23/02/2025",
    title: "Lorem Ipsum is simply dummy text of the printing and typesetting",
  },
  {
    id: 2,
    creationDate: "23/02/2025",
    title: "Lorem Ipsum is simply dummy text of the printing and typesetting",
  },
  {
    id: 3,
    creationDate: "23/02/2025",
    title: "Lorem Ipsum is simply dummy text of the printing and typesetting",
  },
  {
    id: 4,
    creationDate: "23/02/2025",
    title: "Lorem Ipsum is simply dummy text of the printing and typesetting",
  },
  {
    id: 5,
    creationDate: "23/02/2025",
    title: "Lorem Ipsum is simply dummy text of the printing and typesetting",
  },
];

export default function ManageNewsScreen() {
  const handleEdit = (itemId: number) => {
    console.log("Editar noticia con ID:", itemId);
    // Navegar a pantalla de edición o tu lógica
  };

  const handleDelete = (itemId: number) => {
    console.log("Eliminar noticia con ID:", itemId);
    // Lógica para eliminar la noticia
  };

  // Renderiza cada fila de la “tabla”
  const renderItem = ({ item }: { item: NewsAdminItem }) => {
    return (
      <View style={styles.tableRow}>
        {/* Fecha de creación */}
        <Text style={[styles.cell, styles.dateCell]}>{item.creationDate}</Text>

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
  };

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

        {/* Lista de noticias */}
        <FlatList
          data={mockNewsData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  // Íconos de acción (editar/eliminar)
  actionIcon: {
    marginHorizontal: 4,
    borderRadius: 4,
  },
});
