import React, { useState, useEffect, useCallback } from "react"; // React y hooks básicos
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native"; // Componentes nativos
import { SafeAreaView } from "react-native-safe-area-context"; // Respeta notch / safe areas
import { useRouter, usePathname } from "expo-router"; // Navegación con Expo Router
import { useFocusEffect } from "@react-navigation/native"; // Efecto al enfocar la pantalla

import * as nav from "@/utils/navigation"; // Helper de navegación propio
import { ROUTES } from "../../../routes"; // Mapa de rutas centralizado

import Header from "@/components/layout/HeaderComponent"; // Header principal
import TabMenuComponent from "@/components/layout/TabMenuComponent"; // Tabs superiores
import Footer from "@/components/layout/FooterComponent"; // Footer fijo
import SearchBarComponent from "@/components/common/SearchBarComponent"; // Barra de búsqueda genérica

import useGetArtists from "@/app/artists/services/useGetArtists"; // Hook que trae artistas desde la API
import { useArtistDelete } from "@/app/artists/services/useArtistDelete"; // Hook que maneja lógica de borrado

import { Artist } from "@/app/artists/types/Artist"; // Tipo de artista en el front
import { useAuth } from "@/app/auth/AuthContext"; // Contexto de auth (roles, usuario, etc.)

import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles"; // Estilos globales

import AdminCardComponent from "@/app/artists/components/admin/card-admin-artist/AdminCardComponent"; // Card de artista en modo admin
import AdminNewArtistBtn from "@/app/artists/components/admin/AdminNewArtistBtn"; // Botón "nuevo artista"
import AdminCardPopupEliminate from "@/app/artists/components/admin/card-admin-artist/AdminCardPopupEliminate"; // Popup confirmación delete
import AdminCardPopupEliminateError from "@/app/artists/components/admin/card-admin-artist/AdminCardPopupEliminateError"; // Popup error delete

// Pantalla de administración de artistas.
// Desde acá el admin puede buscar, crear, editar y eliminar artistas.
export default function AdminArtistScreen() {
  const router = useRouter(); // Router de Expo para navegar entre pantallas
  const pathname = usePathname(); // Ruta actual, para marcar el tab activo

  const { hasRole } = useAuth(); // Obtenemos helper para consultar roles
  const isAdmin = hasRole("admin"); // Verificamos si el usuario actual es admin

  // Estado controlado del texto de búsqueda
  const [search, setSearch] = useState("");

  // Hook que trae la lista de artistas desde la API
  const { data: artistsData, isLoading, refresh } = useGetArtists();

  // Lista local de artistas que efectivamente mostramos:
  // - se inicializa vacía
  // - se sincroniza con artistsData
  // - se usa para búsquedas y borrados sin tocar directamente la data del hook
  const [artistList, setArtistList] = useState<Artist[]>([]);

  // Hook que encapsula toda la lógica de borrado de artistas:
  // - quién es el artista objetivo
  // - popups de confirmación y error
  // - estados de loading mientras se elimina
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

  // Cuando cambia la data cruda de artistas:
  // - copiamos el array
  // - lo ordenamos por nombre
  // - lo guardamos en el estado local
  useEffect(() => {
    const list = (artistsData || []).slice(); // copia defensiva
    list.sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
    setArtistList(list);
  }, [artistsData]);

  // Cada vez que la pantalla gana foco (por ejemplo, al volver de crear/editar):
  // - disparamos un refresh para traer la lista actualizada desde la API
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Navega a la pantalla de "Nuevo artista"
  const handleAddArtist = () => {
    nav.push(router, { pathname: ROUTES.ADMIN.ARTISTS.NEW });
  };

  // Navega a la pantalla de edición de un artista, enviando el id como parámetro
  const handleEditArtist = (id: string) => {
    nav.push(router, {
      pathname: ROUTES.ADMIN.ARTISTS.EDIT,
      params: { id },
    });
  };

  // Filtrado simple por nombre, en base al texto de búsqueda
  const filteredArtists = artistList.filter((artist) =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  // Tabs que se muestran arriba de la pantalla:
  // - uno para "Administrar Artistas" (solo si es admin)
  // - uno para la lista general de "Artistas" (modo usuario)
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

  // Cómo dibujar cada artista dentro del FlatList
  const renderArtistItem = ({ item }: { item: Artist }) => (
    <AdminCardComponent
      artist={item}
      onEdit={handleEditArtist}
      onDelete={onDelete}
    />
  );

  // Según el estado de carga, mostramos un loader o la lista filtrada
  const content = isLoading ? (
    <ActivityIndicator
      size="large"
      color={COLORS.primary}
      style={styles.loader}
    />
  ) : (
    <FlatList
      data={filteredArtists}
      keyExtractor={(artist) => artist.idArtista}
      renderItem={renderArtistItem}
      contentContainerStyle={styles.list}
    />
  );

  // Render principal de la pantalla
  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header general de la app */}
        <Header />

        {/* Tabs superiores: admin artistas / lista de artistas */}
        <TabMenuComponent tabs={tabs} />

        {/* Contenido central: botón, título, search y lista */}
        <View style={styles.content}>
          <AdminNewArtistBtn
            label="Nuevo artista"
            iconName="music-note-outline"
            onPress={handleAddArtist}
          />

          <Text style={styles.title}>Administrar Artistas</Text>

          <View style={styles.searchWrapper}>
            <SearchBarComponent
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar artista"
              containerStyle={{ marginHorizontal: 0 }} // que ocupe todo el ancho disponible
            />
          </View>

          {content}
        </View>

        {/* Footer común en la app */}
        <Footer />
      </SafeAreaView>

      {/* Popup de confirmación de borrado de artista */}
      <AdminCardPopupEliminate
        visible={deleteVisible}
        artistName={deleteTarget?.name}
        loading={deleting}
        onCancel={closePopup}
        onConfirm={confirmDelete}
      />

      {/* Popup de error si algo falla al eliminar */}
      <AdminCardPopupEliminateError
        visible={errorVisible}
        artistName={errorArtistName}
        onClose={closeError}
      />
    </>
  );
}

// Estilos propios de la pantalla de administración de artistas
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchWrapper: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.cardBg,
    width: "100%",
    alignSelf: "stretch",
    marginBottom: 18,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 32,
  },
  loader: {
    marginTop: 40,
  },
});
