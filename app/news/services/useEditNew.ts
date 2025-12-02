// src/screens/admin/NewsScreens/services/useEditNew.ts
import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";

import { getNewsById, updateNews } from "@/app/news/apis/newsApi";
import { mediaApi, DEFAULT_MAX_UPLOAD_BYTES } from "@/app/apis/mediaApi";
import { emit } from "@/utils/eventBus";

// Usamos DEFAULT_MAX_UPLOAD_BYTES desde mediaApi

type EditResult = {
  ok: boolean;
};

function extractBackendMessage(e: any): string {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.Message ||
    e?.response?.data?.error ||
    e?.message ||
    "Ocurrió un error."
  );
}

export default function useEditNew(id?: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [idMedia, setIdMedia] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Cargar noticia + media al montar
  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const found = await getNewsById(id);

        if (found) {
          setTitle(found.titulo);
          setBody(found.contenido || "");

          // si el backend ya trae urlEventoId, lo usamos
          const fromUrlId =
            (found as any).urlEventoId ??
            null;

          if (fromUrlId) {
            setSelectedEventId(String(fromUrlId));
          } else if (found.urlEvento?.includes("/evento/")) {
            const partes = found.urlEvento.split("/evento/");
            if (partes.length === 2) {
              setSelectedEventId(partes[1]);
            }
          }

          const media = await mediaApi.getByEntidad(id);
          if (media?.media?.length > 0) {
            setSelectedImage(media.media[0].url);
            setIdMedia(media.media[0].idMedia);
          }
        }
      } catch (error) {
        console.error("[useEditNew] Error al cargar noticia:", error);
        Alert.alert("Error", "Error al cargar la noticia.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  // Seleccionar nueva imagen desde galería
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const fileInfo: any = await getInfoAsync(asset.uri);

      if (fileInfo?.size && fileInfo.size > DEFAULT_MAX_UPLOAD_BYTES) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }

      setNewImageUri(asset.uri);
      setSelectedImage(asset.uri);
    }
  }, []);

  // Eliminar imagen existente en backend
  const deleteImage = useCallback(async () => {
    if (!idMedia) {
      Alert.alert("Atención", "No se encontró imagen para eliminar.");
      return;
    }

    try {
      await mediaApi.delete(idMedia);
      setSelectedImage(null);
      setNewImageUri(null);
      setIdMedia(null);
      Alert.alert("Imagen eliminada correctamente.");
    } catch (err) {
      console.error("[useEditNew] Error al eliminar imagen:", err);
      Alert.alert("Error", "Error al eliminar la imagen.");
    }
  }, [idMedia]);

  // Guardar cambios
  const save = useCallback(async (): Promise<EditResult> => {
    if (!id || !title.trim()) {
      Alert.alert("Error", "El título es obligatorio.");
      return { ok: false };
    }

    try {
      setSaving(true);

      if (newImageUri) {
        const prevId = idMedia;

        const fileName = newImageUri.split("/").pop() ?? "imagen.jpg";
        const file: any = {
          uri: newImageUri,
          name: fileName,
          type: "image/jpeg",
        };

        // Subir la nueva imagen
        await mediaApi.upload(id, file, undefined, { compress: true });

        // Intentar eliminar la imagen previa para evitar duplicados
        if (prevId) {
          try {
            await mediaApi.delete(prevId);
          } catch (e) {
            console.warn("[useEditNew] no se pudo borrar imagen previa:", e);
          }
        }

        // Refrescar media localmente
        try {
          const media = await mediaApi.getByEntidad(id);
          if (media?.media?.length > 0) {
            setSelectedImage(media.media[0].url);
            setIdMedia(media.media[0].idMedia);
            setNewImageUri(null);
          }
        } catch (e) {
          // no crítico
        }
      }

      const urlEventoFinal = selectedEventId
        ? `https://raveapp.com.ar/evento/${selectedEventId}`
        : null;

      await updateNews({
        idNoticia: id,
        titulo: title,
        contenido: body,
        dtPublicado: new Date().toISOString(),
        urlEvento: urlEventoFinal,
      });

      emit("news:updated", { id });

      return { ok: true };
    } catch (err: any) {
      console.error("[useEditNew] Error al actualizar noticia:", err);
      Alert.alert("Error", extractBackendMessage(err));
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [id, title, body, newImageUri, selectedEventId]);

  return {
    loading,
    saving,
    title,
    setTitle,
    body,
    setBody,
    selectedImage,
    pickImage,
    deleteImage,
    selectedEventId,
    setSelectedEventId,
    save,
  } as const;
}
