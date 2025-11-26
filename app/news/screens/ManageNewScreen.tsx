// src/screens/admin/NewsScreens/ManageNewsScreen.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";

import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import { useAuth } from "@/app/auth/AuthContext";

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { NewsItem } from "@/interfaces/NewsProps";

import useManageNews from "../services/useManageNews";
import ManageNewsHeaderComponent from "../components/manage/ManageNewsHeaderComponent";
import ManageNewsCardComponent from "../components/manage/ManageNewsCardComponent";
import ManageNewsEmptyStateComponent from "../components/manage/ManageNewsEmptyStateComponent";
import NewsDeletePopupComponent from "../components/manage/NewsDeletePopupComponent";
import NewsSuccessPopupComponent from "../components/create/NewsSuccessPopupComponent";

export default function ManageNewsScreen() {
  const router = useRouter();
  const path = usePathname();

  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const { news, loading, deleteNewsWithMedia } = useManageNews();
  const [searchText, setSearchText] = useState("");

  // estado para popup de eliminación
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedNewsTitle, setSelectedNewsTitle] = useState<string>("");
  const [successVisible, setSuccessVisible] = useState(false);

  const tabs = useMemo(
    () =>
      [
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
      ].filter((t) => t.visible),
    [isAdmin, path]
  );

  const filteredNews = useMemo(
    () =>
      news.filter((n) =>
        n.titulo.toLowerCase().includes(searchText.toLowerCase())
      ),
    [news, searchText]
  );

  function handleCreate() {
    nav.push(router, { pathname: ROUTES.ADMIN.NEWS.CREATE });
  }

  function handleEdit(idNoticia: string) {
    nav.push(router, {
      pathname: ROUTES.ADMIN.NEWS.EDIT,
      params: { id: idNoticia },
    });
  }

  // abrir popup
  function handleAskDelete(idNoticia: string, title: string) {
    setSelectedNewsId(idNoticia);
    setSelectedNewsTitle(title);
    setDeleteVisible(true);
  }

  // confirmar eliminación
  async function handleConfirmDelete() {
    if (!selectedNewsId) return;

    try {
      setDeleteLoading(true);
      await deleteNewsWithMedia(selectedNewsId);
      setDeleteVisible(false);
      setSelectedNewsId(null);
      setSelectedNewsTitle("");
      // mostrar modal de éxito
      setSuccessVisible(true);
    } catch {
      Alert.alert("Error", "No se pudo eliminar la noticia.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const renderItem = ({ item }: { item: NewsItem }) => (
    <ManageNewsCardComponent
      item={item}
      onEdit={handleEdit}
      onDelete={() => handleAskDelete(item.idNoticia, item.titulo)}
    />
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />

        <View style={styles.content}>
          <ManageNewsHeaderComponent
            searchText={searchText}
            onChangeSearch={setSearchText}
            onCreatePress={handleCreate}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : filteredNews.length === 0 ? (
            <ManageNewsEmptyStateComponent />
          ) : (
            <FlatList
              data={filteredNews}
              keyExtractor={(item) => item.idNoticia}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>

        <Footer />

        <NewsDeletePopupComponent
          visible={deleteVisible}
          newsTitle={selectedNewsTitle}
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteVisible(false);
            setSelectedNewsId(null);
            setSelectedNewsTitle("");
          }}
          onConfirm={handleConfirmDelete}
        />

        <NewsSuccessPopupComponent
          visible={successVisible}
          title="Éxito"
          message="La noticia ha sido eliminada exitosamente."
          onClose={() => setSuccessVisible(false)}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 16,
  },
});
