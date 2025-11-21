// src/screens/admin/NewsScreens/services/useCreateNew.ts
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { createNews } from "@/app/news/apis/newsApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { emit } from "@/utils/eventBus";

type CreateNewPayload = {
  title: string;
  body: string;
  imageUri: string | null;
  eventId: string | null;
};

type CreateNewResult = {
  ok: boolean;
  idNoticia?: string;
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

export default function useCreateNew() {
  const [loading, setLoading] = useState(false);

  const createNew = useCallback(
    async ({ title, body, imageUri, eventId }: CreateNewPayload) => {
      if (loading) return { ok: false } as CreateNewResult;

      if (!title.trim() || !body.trim()) {
        Alert.alert("Error", "Título y contenido son obligatorios.");
        return { ok: false };
      }

      setLoading(true);

      try {
        const nueva = await createNews({
          titulo: title.trim(),
          contenido: body.trim(),
          dtPublicado: new Date().toISOString(),
          urlEvento: eventId
            ? `https://raveapp.com.ar/evento/${eventId}`
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

          await mediaApi.upload(nueva.idNoticia, file, undefined, {
            compress: true,
          });
        }

        emit("news:updated", { id: nueva.idNoticia });

        return { ok: true, idNoticia: nueva.idNoticia } as CreateNewResult;
      } catch (err: any) {
        console.error("[useCreateNew] Error al crear noticia:", err);
        Alert.alert("Error al crear noticia", extractBackendMessage(err));
        return { ok: false } as CreateNewResult;
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  return { createNew, loading } as const;
}
