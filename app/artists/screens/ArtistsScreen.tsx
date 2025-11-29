// Pantalla de listado de artistas: buscador + listado ordenado alfabéticamente en grilla.

import React, { useState } from "react"; // React + estado local simple
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native"; // Componentes base de React Native
import { SafeAreaView } from "react-native-safe-area-context"; // Respeta las safe areas (notch, barras, etc.)
import { useRouter, usePathname } from "expo-router"; // Navegación basada en rutas

import { ROUTES } from "@/routes"; // Mapa centralizado de rutas
import * as nav from "@/utils/navigation"; // Helper propio para navegación

import ProtectedRoute from "@/app/auth/ProtectedRoute"; // Protege la pantalla por roles
import { useAuth } from "@/app/auth/AuthContext"; // Contexto de auth para saber si es admin

import Header from "@/components/layout/HeaderComponent"; // Header general de la app
import Footer from "@/components/layout/FooterComponent"; // Footer común
import TabMenuComponent from "@/components/layout/TabMenuComponent"; // Tabs superiores
import SearchBarComponent from "@/components/common/SearchBarComponent"; // Barra de búsqueda

import ArtistCard from "@/app/artists/components/ArtistCardComponent"; // Card visual de un artista
import ArtistListLetter from "@/app/artists/components/artist/artist-list/ArtistListLetterComponent"; // Letra separadora (A, B, C...)

import useGetArtists from "@/app/artists/services/useGetArtists"; // Hook que trae la lista de artistas
import { Artist } from "@/app/artists/types/Artist"; // Tipo de artista

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles"; // Estilos globales

// Alfabeto que usamos para agrupar artistas por inicial del nombre
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Componente principal: listado de artistas con buscador y tabs
export default function ArtistsScreen() {
  const router = useRouter(); // Para navegar entre pantallas
  const pathname = usePathname(); // Ruta actual, usada para marcar el tab activo

  // Obtenemos helper para roles desde el contexto de auth
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // Texto de la barra de búsqueda
  const [search, setSearch] = useState<string>("");

  // Lista de artistas desde la API (hook ya maneja la carga inicial)
  const { data: artistsList, isLoading } = useGetArtists();

  // Filtramos:
  // 1) solo artistas activos
  // 2) que contengan el texto buscado en el nombre (case-insensitive)
  const filteredArtists = artistsList
    .filter((artist) => artist.isActivo)
    .filter((artist) =>
      artist.name.toLowerCase().includes(search.toLowerCase())
    );

  // Navegar al detalle de un artista (pantalla ArtistScreen)
  const openArtist = (artist: Artist) => {
    nav.push(router, {
      pathname: ROUTES.MAIN.ARTISTS.ITEM,
      params: { id: artist.idArtista },
    });
  };

  // Parte final de la ruta (ej: "artists", "news", etc.)
  const currentScreen = pathname.split("/").pop() || "";

  // Tab de administración de artistas (solo visible para admin)
  const adminTab = {
    label: "Administrar artistas",
    route: ROUTES.ADMIN.ARTISTS.MANAGE,
    isActive: currentScreen === ROUTES.ADMIN.ARTISTS.MANAGE.split("/").pop(),
  };

  // Tab de noticias (cuando el usuario no es admin)
  const newsTab = {
    label: "Noticias",
    route: ROUTES.MAIN.NEWS.LIST,
    isActive: currentScreen === ROUTES.MAIN.NEWS.LIST.split("/").pop(),
  };

  // Tab de lista de artistas (pantalla actual)
  const artistsTab = {
    label: "Artistas",
    route: ROUTES.MAIN.ARTISTS.LIST,
    isActive: currentScreen === ROUTES.MAIN.ARTISTS.LIST.split("/").pop(),
  };

  // Si es admin: Admin + Artistas
  // Si no: Noticias + Artistas
  const tabs = isAdmin ? [adminTab, artistsTab] : [newsTab, artistsTab];

  // Contenido principal: loader o grilla de artistas
  const content = isLoading ? (
    // Estado de carga: solo mostramos un spinner centrado
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  ) : (
    // Cuando ya tenemos datos, renderizamos el scroll con las letras y las cards
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Mensaje de vacío si no hay artistas luego del filtro */}
      {filteredArtists.length === 0 && (
        <Text style={styles.emptyText}>No se encontraron artistas.</Text>
      )}

      {/* Recorremos el alfabeto y group por inicial del nombre */}
      {ALPHABET.map((letter) => {
        // Agrupamos artistas cuya primera letra del nombre coincide con letter
        const group = filteredArtists.filter(
          (artist) => artist.name.charAt(0).toUpperCase() === letter
        );

        // Si no hay artistas con esa letra, no renderizamos nada
        if (!group.length) return null;

        return (
          <View key={letter} style={styles.letterGroup}>
            {/* Letra de sección (A, B, C, etc.) */}
            <ArtistListLetter letter={letter} />

            {/* Fila con cards en grilla (2 columnas) */}
            <View style={styles.cardsRow}>
              {group.map((artist) => (
                <View key={artist.idArtista} style={styles.cardWrapper}>
                  <ArtistCard artist={artist} onPress={() => openArtist(artist)} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        {/* Header global */}
        <Header />

        {/* Tabs superiores (Admin/Noticias + Artistas) */}
        <TabMenuComponent tabs={tabs} />

        {/* Buscador de artistas */}
        <View style={styles.searchWrapper}>
          <SearchBarComponent
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar artista..."
            // Ocupa todo el ancho; el wrapper maneja el padding
            containerStyle={{ marginHorizontal: 0 }}
          />
        </View>

        {/* Contenido principal (loader o listado) */}
        {content}

        {/* Footer global */}
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

// Estilos específicos de esta pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
  },
  searchWrapper: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.cardBg,
    width: "100%",
    alignSelf: "stretch",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  letterGroup: {
    marginTop: 16,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // 2 columnas bien espaciadas
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
});
