// src/screens/admin/ManageArtistsScreen.tsx

// Import de React y hooks principales
import React, { useState, useEffect, useCallback } from "react";
// Componentes y utilidades de React Native
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
// SafeArea para evitar zonas no seguras en iOS/Android
import { SafeAreaView } from "react-native-safe-area-context";
// Router y helpers de navegación de Expo
import { useRouter, usePathname } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";
import { useFocusEffect } from "@react-navigation/native";

// Componentes comunes de la app (header, footer, búsqueda, etc.)
import Header from "@/components/layout/HeaderComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";
// API para obtener artistas
import useGetArtists from "@/app/artists/services/useGetArtists";
// Tipo Artist
import { Artist } from "@/app/artists/types/Artist";
// Contexto de autenticación (para saber roles)
import { useAuth } from "@/app/auth/AuthContext";
// Constantes de estilo global
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
// Componentes específicos del listado admin de artistas
import AdminCardComponent from "@/app/artists/components/admin/card-admin-artist/AdminCardComponent";
import AdminNewArtistBtn from "@/app/artists/components/admin/AdminNewArtistBtn";
// Popups: confirmación y error
import AdminCardPopupEliminate from "@/app/artists/components/admin/card-admin-artist/AdminCardPopupEliminate";
import AdminCardPopupEliminateError from "@/app/artists/components/admin/card-admin-artist/AdminCardPopupEliminateError";
// Hook que centraliza la lógica de borrado
import { useArtistDelete } from "@/app/artists/services/useArtistDelete";

// Componente principal de la pantalla de administración de artistas
// Muestra la lista de artistas (con acciones de admin) y permite buscar/editar/eliminar
export default function AdminArtistScreen() {
  // router y path para tabs y navegación
  const router = useRouter();
  const pathname = usePathname();
  // auth para saber si el usuario es admin
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // estados locales:
  // - `search`: texto del buscador
  // - `artistsData`: datos traídos por el hook `useGetArtists` (proviene de la API)
  // - `artistList`: copia local sincronizada con `artistsData` para permitir
  //   operaciones locales (ej. useArtistDelete modifica esta lista)
  const [search, setSearch] = useState("");
  const { data: artistsData, isLoading, error, refresh } = useGetArtists();
  const [artistList, setArtistList] = useState<Artist[]>([]);

  // hook que centraliza la lógica de eliminación de artistas.
  // Devuelve estado de visibilidad de popups, handlers y flags de borrado.
  const {
    deleteVisible,
    deleteTarget,
    deleting,
    errorVisible,
    errorArtistName,
    onDelete,
    confirmDelete,
    closePopup,
    closeError,
  } = useArtistDelete(artistList, setArtistList);

  // sincronizar la lista local con los datos que trae el hook
  // además ordenamos alfabéticamente para mostrar siempre orden correcto
  useEffect(() => {
    // hacemos una copia y la ordenamos por nombre usando locale 'es'
    const list = (artistsData || []).slice();
    list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    setArtistList(list);
  }, [artistsData]);

  // Cuando la pantalla recibe foco (vuelve a primer plano), forzamos
  // una recarga de datos para mantener la lista sincronizada.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Navegación: ir a crear nuevo artista
  const onAdd = () => {
    // usamos el helper `nav.push` con la ruta definida en `ROUTES`
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.NEW });
  };

  // Navegación: ir a editar artista existente (recibe id)
  const onEdit = (id: string) => {
    // redirige a la pantalla de edición pasando el id como parámetro
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.EDIT, params: { id } });
  };

  // Filtrado local según texto de búsqueda (filtro simple por nombre)
  // Mantenerlo ligero: filtramos sobre `artistList` ya ordenada
  const filtered = artistList.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Definición de tabs que se muestran en la parte superior
  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Administrar Artistas",
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

  // renderItem para el FlatList: renderiza la tarjeta administrativa del artista
  // - cada tarjeta recibe los callbacks `onEdit` y `onDelete` para acciones
  const renderItem = ({ item }: { item: Artist }) => (
    <AdminCardComponent artist={item} onEdit={onEdit} onDelete={onDelete} />
  );

  // Contenido principal: mostramos un spinner si `isLoading` está activo;
  // de lo contrario renderizamos la lista con `FlatList`.
  const content = isLoading ? (
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

  // Render principal de la pantalla (estructura SafeArea + header + contenido)
  // ProtectedRoute asegura roles permitidos antes de mostrar la pantalla
  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header y menú de tabs */}
        <Header />
        <TabMenuComponent tabs={tabs} />

        {/* Contenido principal: botón nuevo, título, buscador y lista */}
        <View style={styles.content}>
          <AdminNewArtistBtn
            label="Nuevo artista"
            iconName="music-note-outline"
            onPress={onAdd}
          />
          <Text style={styles.title}>Administrar Artistas</Text>
          {/* Wrapper para separar visualmente el SearchBar de las cards */}
          <View style={styles.searchWrapper}>
            <SearchBarComponent
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar artista"
              // remover margen horizontal interno para ocupar todo el ancho
              containerStyle={{ marginHorizontal: 0 }}
            />
          </View>
          {content}
        </View>

        {/* Footer fijo */}
        <Footer />
      </SafeAreaView>

      {/* Popup de confirmación para eliminar artista */}
      <AdminCardPopupEliminate
        visible={deleteVisible}
        artistName={deleteTarget?.name}
        loading={deleting}
        onCancel={closePopup}
        onConfirm={confirmDelete}
      />

      {/* Popup de error al eliminar (si ocurre un fallo) */}
      <AdminCardPopupEliminateError
        visible={errorVisible}
        artistName={errorArtistName}
        onClose={closeError}
      />
    </>
  );
}

// Estilos locales de la pantalla
const styles = StyleSheet.create({
  // contenedor principal
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  // contenido scroll
  content: { flex: 1, padding: 16 },
    // SearchBar a lo largo de las cards (igual que en ArtistsScreen)
    searchWrapper: {
      paddingHorizontal: 0,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: COLORS.cardBg,
      width: "100%",
      alignSelf: "stretch",
      marginBottom: 18,
    },
  // título de la pantalla
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  // padding final para la lista
  list: { paddingBottom: 32 },
});
