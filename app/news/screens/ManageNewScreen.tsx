import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { on as onEvent, off as offEvent } from "@/utils/eventBus";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import SearchBarComponent from "@/components/common/SearchBarComponent";

import { getNews, deleteNews } from "@/app/news/apis/newsApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function ManageNewsScreen() {
  const router = useRouter();
  const path = usePathname();
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const isFocused = useIsFocused();
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Función reusable para cargar noticias
  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNews(data);
    } catch (e) {
      console.error("Error al cargar noticias:", e);
    } finally {
      setLoading(false);
    }
  };

  // Cargar noticias inicialmente y cuando la pantalla gane foco
  useEffect(() => {
    let mounted = true;
    if (mounted) loadNews();
    return () => {
      mounted = false;
    };
  }, []);

  // Volver a cargar cuando la pantalla reciba foco
  useEffect(() => {
    if (isFocused) {
      loadNews();
    }
  }, [isFocused]);

  // Suscribirse al eventBus para recargar cuando otra pantalla indique actualización
  useEffect(() => {
    const unsub = onEvent("news:updated", () => {
      console.log("event news:updated received: reloading list");
      // recargar y mostrar indicador breve
      (async () => {
        await loadNews();
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 1400);
      })();
    });
    return () => {
      unsub();
    };
  }, []);

  const handleEdit = (idNoticia: string) => {
    // Navegar a la pantalla de edición usando la constante ROUTES
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
        source={getSafeImageSource(item.imagen || PLACEHOLDER_IMAGE)}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{new Date(item.dtPublicado).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.modifyBtn]}
            onPress={() => handleEdit(item.idNoticia)}
          >
            <Text style={styles.modifyBtnText}>Modificar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.idNoticia)}
          >
            <Text style={styles.deleteBtnText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />
        <TabMenuComponent tabs={tabs} />
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => nav.push(router, { pathname: ROUTES.ADMIN.NEWS.CREATE })}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={20} color={COLORS.backgroundLight} />
            <Text style={styles.createButtonText}>Crear noticia</Text>
          </TouchableOpacity>

          <SearchBarComponent
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar noticias..."
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay noticias por mostrar</Text>
            </View>
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
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    height: 44,
    marginBottom: 12,
  },
  createButtonText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    marginVertical: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.borderInput,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modifyBtn: {
    backgroundColor: "#F1F5F9",
  },
  modifyBtnText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  deleteBtn: {
    backgroundColor: "#374151",
  },
  deleteBtnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
});
