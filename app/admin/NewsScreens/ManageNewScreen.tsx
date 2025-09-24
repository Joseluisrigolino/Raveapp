import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter, usePathname } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";

import { getNews, deleteNews } from "@/utils/news/newsApi";
import { mediaApi } from "@/utils/mediaApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function ManageNewsScreen() {
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? (user.roles as any[]) : user?.roles ? [user.roles] : [];
  const isAdmin = roles.includes("admin");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (e) {
        console.error("Error al cargar noticias:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEdit = (idNoticia: string) => {
    nav.push(router, { pathname: ROUTES.ADMIN.NEWS.EDIT, params: { id: idNoticia } });
  };

  const handleDelete = (idNoticia: string) => {
    Alert.alert("Confirmar", "¿Eliminar esta noticia?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const media = await mediaApi.getByEntidad(idNoticia);
            if (media?.media?.length > 0) {
              for (const m of media.media) {
                await mediaApi.delete(m.idMedia);
              }
            }

            await deleteNews(idNoticia);
            setNews((prev) => prev.filter((n) => n.idNoticia !== idNoticia));
          } catch (e) {
            console.error("Error al eliminar noticia:", e);
            Alert.alert("Error", "No se pudo eliminar.");
          }
        },
      },
    ]);
  };

  const tabs = [
    {
      label: "Administrar Noticias",
      route: ROUTES.ADMIN.NEWS.MANAGE,
      isActive: path === ROUTES.ADMIN.NEWS.MANAGE,
      visible: isAdmin,
    },
    {
      label: "Noticias",
      route: ROUTES.MAIN.NEWS.LIST,
      isActive: path === ROUTES.MAIN.NEWS.LIST,
      visible: true,
    },
  ].filter((t) => t.visible);

  const filtered = news.filter((n) =>
    n.titulo.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imagen || PLACEHOLDER_IMAGE }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Fecha publicación: </Text>
          {new Date(item.dtPublicado).toLocaleDateString()}
        </Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.fullButton, { backgroundColor: COLORS.primary }]}
            onPress={() => handleEdit(item.idNoticia)}
          >
            <Text style={styles.fullButtonText}>Modificar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fullButton, { backgroundColor: COLORS.negative }]}
            onPress={() => handleDelete(item.idNoticia)}
          >
            <Text style={styles.fullButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => nav.push(router, { pathname: ROUTES.ADMIN.NEWS.CREATE })}
          >
            <Text style={styles.createButtonText}>+ Crear noticia</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Gestionar Noticias</Text>

          <TextInput
            placeholder="Buscar por título"
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.idNoticia}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { flex: 1, padding: 16 },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  screenTitle: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  search: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: COLORS.borderInput,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  bold: {
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionIcon: {
    marginLeft: 8,
    borderRadius: RADIUS.card,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  fullButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: "center",
    
  },
  fullButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
