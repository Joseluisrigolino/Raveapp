// src/screens/admin/NewsScreens/CreateNewScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { createNews } from "@/app/news/apis/newsApi";
import { fetchEvents } from "@/app/events/apis/eventApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { emit } from "@/utils/eventBus";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import SelectField from "@/components/common/selectField";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ImagePickerComponent from "@/components/common/ImagePickerComponent";

export default function CreateNewScreen() {
  const router = useRouter();
  // ================= Constantes y helpers =================
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
  const ALLOWED_EXTS = useMemo(() => new Set(["jpg", "jpeg", "png"]), []);

  const isAllowedExt = useCallback(
    (nameOrUri?: string | null): boolean => {
      if (!nameOrUri) return false;
      const cleaned = String(nameOrUri).split("?")[0].split("#")[0];
      const parts = cleaned.split(".");
      if (parts.length < 2) return false;
      const ext = parts.pop()!.toLowerCase();
      return ALLOWED_EXTS.has(ext);
    },
    [ALLOWED_EXTS]
  );

  const extractBackendMessage = (e: any): string =>
    e?.response?.data?.message ||
    e?.response?.data?.Message ||
    e?.response?.data?.error ||
    e?.message ||
    "Ocurrió un error.";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [eventos, setEventos] = useState<
    { idEvento: string; nombre: string; imageUrl?: string }[]
  >([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<string | null>(
    null
  );
  const [showEventos, setShowEventos] = useState(false);

  useEffect(() => {
    fetchEvents()
      .then((res) => {
        const simples = res.map((e) => ({
          idEvento: e.id,
          nombre: e.title,
          imageUrl: e.imageUrl,
        }));
        setEventos(simples);
      })
      .catch((err) => console.error("Error al cargar eventos:", err));
  }, []);

  // Image selection is handled by ImagePickerComponent

  const handleCreateNews = useCallback(async () => {
    if (isCreating) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert("Error", "Título y contenido son obligatorios.");
      return;
    }

    setIsCreating(true);
    try {
      const nueva = await createNews({
        titulo: title.trim(),
        contenido: body.trim(),
        dtPublicado: new Date().toISOString(),
        urlEvento: eventoSeleccionado
          ? `https://raveapp.com.ar/evento/${eventoSeleccionado}`
          : null,
      });

      if (!nueva?.idNoticia) {
        throw new Error("No se pudo crear la noticia correctamente.");
      }

      if (imageUri) {
        const fileName = imageUri.split("/").pop() ?? "image.jpg";
        const isPng = fileName.toLowerCase().endsWith(".png");
        const file: any = {
          uri: imageUri,
          name: fileName,
          type: isPng ? "image/png" : "image/jpeg",
        };
  await mediaApi.upload(nueva.idNoticia, file, undefined, { compress: true });
      }

      Alert.alert("Éxito", "Noticia creada correctamente.");
      emit("news:updated", { id: nueva.idNoticia });
      router.back();
    } catch (err: any) {
      console.error("Error al crear noticia:", err);
      Alert.alert("Error al crear noticia", extractBackendMessage(err));
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, title, body, imageUri, eventoSeleccionado, extractBackendMessage, router]);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Crear noticia</Text>

          <InputText
            label="Título"
            value={title}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setTitle}
            placeholder="Ingresa el título de la noticia..."
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          <ImagePickerComponent
            value={imageUri}
            onChange={setImageUri}
            maxBytes={MAX_IMAGE_BYTES}
            allowedExts={["jpg", "jpeg", "png"]}
            label="Imagen"
          />

          <InputDesc
            label="Contenido"
            value={body}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setBody}
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

          <TouchableOpacity
            style={[styles.btn, isCreating && { opacity: 0.6 }]}
            onPress={handleCreateNews}
            disabled={isCreating}
            activeOpacity={0.9}
          >
            {isCreating ? (
              <ActivityIndicator color={COLORS.backgroundLight} />
            ) : (
              <Text style={styles.btnText}>Crear noticia</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
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
  // label/input styles now provided by shared components
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
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
  imageFallback: {
    justifyContent: "center",
    alignItems: "center",
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
  dropdownContainer: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 16,
    width: "100%",
    alignSelf: "stretch",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
});
