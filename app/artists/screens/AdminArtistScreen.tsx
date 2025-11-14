// src/screens/admin/ManageArtistsScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";
import { useFocusEffect } from "@react-navigation/native";

import Header from "@/components/layout/HeaderComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import {
  fetchArtistsFromApi,
  deleteArtistFromApi,
} from "@/app/artists/apis/artistApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { Artist } from "@/app/artists/types/Artist";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function AdminArtistScreen() {
  // router y path para tabs y navegación
  const router = useRouter();
  const pathname = usePathname();
  // auth para saber si el usuario es admin
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // estados simples para lista, búsqueda y carga
  const [artistList, setArtistList] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // helper para formatear fecha en español
  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleString("es-ES", { month: "long" });
      const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
      return `${day} ${monthCap} ${d.getFullYear()}`;
    } catch {
      return iso;
    }
  };

  // carga inicial y cada vez que la pantalla recupera foco
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchArtistsFromApi();
      // ordenar alfabéticamente, forma simple
      data.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );
      setArtistList(data);
    } catch (e) {
      console.log("Error loading artists", e);
      Alert.alert("Error", "No se pudo cargar la lista de artistas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  // navegar a crear artista
  const onAdd = () => {
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.NEW });
  };

  // navegar a editar artista
  const onEdit = (id: string) => {
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.EDIT, params: { id } });
  };

  // eliminar artista y su media
  const onDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Seguro que querés borrar este artista?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            const media = await mediaApi.getByEntidad(id);
            if (media?.media?.length) {
              for (const m of media.media) {
                await mediaApi.delete(m.idMedia);
              }
            }
            await deleteArtistFromApi(id);
            setArtistList((prev) => prev.filter((a) => a.idArtista !== id));
            Alert.alert("Listo", "Se borró el artista");
          } catch (e) {
            console.log("Error deleting artist", e);
            Alert.alert("Error", "No se pudo borrar el artista");
          }
        },
      },
    ]);
  };

  // filtrar artistas según búsqueda (simple)
  const filtered = artistList.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // tabs para navegación superior
  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Adm Artistas",
            route: ROUTES.ADMIN.ARTISTS.MANAGE,
            isActive: pathname === ROUTES.ADMIN.ARTISTS.MANAGE,
          },
        ]
      : []),
    {
      label: "Artistas",
      route: ROUTES.MAIN.ARTISTS.LIST,
      isActive: pathname === ROUTES.MAIN.ARTISTS.LIST,
    },
  ];

  // componente para cada artista en la lista
  const renderItem = ({ item }: { item: Artist }) => {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Image source={{ uri: item.image }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {formatDate(item.creationDate)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnEdit]}
            onPress={() => onEdit(item.idArtista)}
          >
            <Text style={styles.btnEditText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnDelete]}
            onPress={() => onDelete(item.idArtista)}
          >
            <Text style={styles.btnDeleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // early return mientras carga
  const content = loading ? (
    <ActivityIndicator
      size="large"
      color={COLORS.primary}
      style={{ marginTop: 40 }}
    />
  ) : (
    <FlatList
      data={filtered}
      keyExtractor={(i) => i.idArtista}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabMenuComponent tabs={tabs} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <MaterialCommunityIcons
            name="music-note-outline"
            size={16}
            color={COLORS.cardBg}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addBtnText}>Nuevo artista</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Administrar Artistas</Text>
        <SearchBarComponent
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar artista"
        />
        {content}
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // contenedor principal
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  // contenido scroll
  content: { flex: 1, padding: 16 },
  // botón para agregar artista
  addBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flexDirection: "row",
  },
  addBtnText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
  // título de la pantalla
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  // lista
  list: { paddingBottom: 32 },
  // tarjeta de artista
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
  // fila superior
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  // avatar
  avatar: { width: 72, height: 72, borderRadius: 36 },
  // info del artista (separado de la imagen)
  info: { flex: 1, marginLeft: 12 },
  name: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.smallText },
  // fila de botones
  btnRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  // botón base
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // editar
  btnEdit: { backgroundColor: "#F1F5F9" },
  btnEditText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  // borrar
  btnDelete: { backgroundColor: "#374151" },
  btnDeleteText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
