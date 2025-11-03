// src/screens/admin/NewsScreens/EditNewScreen.tsx

import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { getNewsById, updateNews } from "@/app/news/apis/newsApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { fetchEvents } from "@/app/events/apis/eventApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { emit } from "@/utils/eventBus";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import SelectField from "@/components/common/selectField";
import { ROUTES } from "../../../routes";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EditNewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const path = usePathname();

  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [idMedia, setIdMedia] = useState<string | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<string | null>(null);
  const [eventos, setEventos] = useState<{ idEvento: string; nombre: string; imageUrl: string }[]>([]);
  const [showEventos, setShowEventos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return setLoading(false);
      try {
        const found = await getNewsById(id);
        if (found) {
          setNewsTitle(found.titulo);
          setNewsBody(found.contenido || "");

          if (found.urlEvento?.includes("/evento/")) {
            const partes = found.urlEvento.split("/evento/");
            if (partes.length === 2) setEventoSeleccionado(partes[1]);
          }

          const media = await mediaApi.getByEntidad(id);
          if (media?.media?.length > 0) {
            setSelectedImage(media.media[0].url);
            setIdMedia(media.media[0].idMedia);
          }
        }

        const fetched = await fetchEvents();
        const simples = fetched.map((e) => ({ idEvento: e.id, nombre: e.title, imageUrl: e.imageUrl }));
        setEventos(simples);
      } catch (error) {
        console.error("Error al cargar noticia:", error);
        Alert.alert("Error al cargar la noticia");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
  const fileInfo: any = await getInfoAsync(asset.uri);
      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        return Alert.alert("Error", "La imagen supera los 2MB permitidos.");
      }
      setNewImageUri(asset.uri);
      setSelectedImage(asset.uri);
    }
  };

  const handleDeleteImage = async () => {
    if (!idMedia) return Alert.alert("No se encontró imagen para eliminar.");
    try {
      await mediaApi.delete(idMedia);
      setSelectedImage(null);
      setNewImageUri(null);
      setIdMedia(null);
      Alert.alert("Imagen eliminada correctamente.");
    } catch (err) {
      console.error("Error al eliminar imagen:", err);
      Alert.alert("Error al eliminar la imagen.");
    }
  };

  const handleUpdateNews = async () => {
    if (!id || !newsTitle.trim()) {
      return Alert.alert("Error", "El título es obligatorio.");
    }

    try {
      if (newImageUri) {
        const fileName = newImageUri.split("/").pop() ?? "imagen.jpg";
        const file: any = {
          uri: newImageUri,
          name: fileName,
          type: "image/jpeg",
        };
  await mediaApi.upload(id, file, undefined, { compress: true });
      }

      const urlEventoFinal = eventoSeleccionado
        ? `https://raveapp.com.ar/evento/${eventoSeleccionado}`
        : null;

      await updateNews({
        idNoticia: id,
        titulo: newsTitle,
        contenido: newsBody,
        dtPublicado: new Date().toISOString(),
        urlEvento: urlEventoFinal,
      });

      Alert.alert("Noticia actualizada con éxito");
  // Notificar a otras pantallas que la noticia fue actualizada
  emit("news:updated", { id });
  router.back();
    } catch (err) {
      console.error("Error al actualizar noticia:", err);
      Alert.alert("Error al actualizar la noticia");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <SafeAreaView style={styles.container}>
          <Header title="EventApp" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Footer />
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />
        <TabMenuComponent
          tabs={[
            {
              label: "Administrar noticias",
              route: ROUTES.ADMIN.NEWS.MANAGE,
              isActive:
                path === ROUTES.ADMIN.NEWS.MANAGE ||
                path === ROUTES.ADMIN.NEWS.CREATE ||
                path === ROUTES.ADMIN.NEWS.EDIT,
            },
            {
              label: "Noticias",
              route: ROUTES.MAIN.NEWS.LIST,
              isActive: path === ROUTES.MAIN.NEWS.LIST,
            },
          ]}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Editar noticia</Text>

          <InputText
            label="Título"
            value={newsTitle}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setNewsTitle}
            placeholder="Ingresa el título de la noticia..."
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          <Text style={styles.label}>Imagen</Text>
          <View style={styles.imageContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.previewBoxImage} />
            ) : (
              <View style={[styles.previewBox, styles.imageFallback]}>
                <MaterialCommunityIcons name="image-outline" size={40} color={COLORS.textSecondary} />
                <Text style={styles.imagePreviewText}>Vista previa de la imagen</Text>
              </View>
            )}

            <TouchableOpacity style={styles.selectImageButtonLight} onPress={handleSelectImage} activeOpacity={0.85}>
              <Text style={styles.selectImageButtonLightText}>Seleccionar imagen</Text>
            </TouchableOpacity>

            {selectedImage && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.imageNotice}>
              Se permite imágenes JPG, JPEG o PNG. Peso máximo: 2MB
            </Text>
          </View>

          <InputDesc
            label="Contenido"
            value={newsBody}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setNewsBody}
            placeholder="Escribe el contenido de la noticia..."
            autoFocus={false}
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          <SelectField
            label="Vincular evento"
            value={
              eventoSeleccionado
                ? eventos.find((e) => e.idEvento === eventoSeleccionado)?.nombre
                : undefined
            }
            placeholder="Seleccionar evento (opcional)"
            onPress={() => setShowEventos(!showEventos)}
            isOpen={showEventos}
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            fieldStyle={{ width: "100%" }}
          />
        {showEventos && (
          <View style={styles.dropdownContainer}>
            {eventos.map((e, index) => (
              <TouchableOpacity
                key={e.idEvento || `evento-${index}`}
                style={styles.dropdownItem}
                onPress={() => {
                  setEventoSeleccionado(e.idEvento);
                  setShowEventos(false);
                }}
              >
                <View style={styles.eventItem}>
                  {e.imageUrl ? (
                    <Image source={{ uri: e.imageUrl }} style={styles.eventImage} />
                  ) : (
                    <View style={[styles.eventImage, { backgroundColor: "#ccc" }]} />
                  )}
                  <Text style={styles.eventName}>{e.nombre}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

          <TouchableOpacity style={styles.btn} onPress={handleUpdateNews} activeOpacity={0.9}>
            <Text style={styles.btnText}>Guardar cambios</Text>
          </TouchableOpacity>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
  },
  imageFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  previewBox: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.borderInput,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  previewBoxImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: COLORS.borderInput,
  },
  imagePreviewText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontFamily: FONTS.bodyRegular,
  },
  selectImageButtonLight: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9ef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  selectImageButtonLightText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  imageNotice: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 14,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    padding: 12,
    marginTop: 4,
  },
  dropdownButtonText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
  dropdownContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    width: "100%",
    alignSelf: "stretch",
  },
  dropdownItem: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  eventName: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
});