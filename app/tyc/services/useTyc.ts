// src/screens/admin/services/useTyc.ts
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  getTycPdfUrl,
  getTycMedia,
  replaceTycPdf,
  TycMedia,
} from "@/app/tyc/api/tycApi";
import { DEFAULT_MAX_UPLOAD_BYTES } from "@/app/apis/mediaApi";

type TycMeta = {
  name?: string;
  sizeBytes?: number;
  updatedAt?: string;
};

function formatBytesMB(n?: number) {
  if (!Number.isFinite(n as number) || !n) return "—";
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function buildMeta(
  url: string | null,
  media: TycMedia | null
): Promise<TycMeta> {
  if (!media && !url) return { name: undefined, sizeBytes: undefined, updatedAt: undefined };

  let name = media?.nombre;
  let sizeBytes = media?.size ?? media?.peso;
  const updatedAt =
    media?.fecha ?? media?.dtCreacion ?? media?.createdAt ?? media?.fecAlta;

  // si no tenemos nombre, lo sacamos de la URL
  const finalUrl = url ?? media?.url ?? null;
  if (!name && finalUrl) {
    try {
      name = decodeURIComponent(finalUrl.split("/").pop() || "");
    } catch {
      name = finalUrl.split("/").pop() || undefined;
    }
  }

  // si no tenemos tamaño, intentamos HEAD
  if (!sizeBytes && finalUrl) {
    try {
      const resp = await fetch(finalUrl, { method: "HEAD" });
      const len = resp.headers.get("content-length");
      const n = len ? Number(len) : 0;
      if (Number.isFinite(n) && n > 0) sizeBytes = n;
    } catch {
      // si falla, lo dejamos en undefined
    }
  }

  return { name, sizeBytes, updatedAt };
}

export function useTyc() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<TycMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  // cargar PDF + metadata inicial
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const url = await getTycPdfUrl();
        if (!mounted) return;

        setPdfUrl(url);
        const media = await getTycMedia();
        if (!mounted) return;

        const m = await buildMeta(url, media);
        if (mounted) setMeta(m);
      } catch (err) {
        console.error("[useTyc] Error cargando TyC:", err);
        if (mounted) {
          setPdfUrl(null);
          setMeta(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const reloadMeta = useCallback(
    async (urlOverride?: string | null) => {
      const media = await getTycMedia();
      const m = await buildMeta(urlOverride ?? pdfUrl, media);
      setMeta(m);
    },
    [pdfUrl]
  );

  const handleChangePdf = useCallback(async () => {
    try {
      // import dinámico para no romper si el módulo no está instalado
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DocumentPicker = await import("expo-document-picker");

      const res: any = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      let picked: { uri: string; name: string; mimeType?: string } | null =
        null;

      if (res?.assets?.length) {
        const a = res.assets[0];
        if (res.type !== "cancel" && a?.uri) {
          picked = {
            uri: a.uri,
            name: a.name || "archivo.pdf",
            mimeType: a.mimeType || "application/pdf",
          };
        }
      } else if (res?.type === "success" && res?.uri) {
        picked = {
          uri: res.uri,
          name: res.name || "archivo.pdf",
          mimeType: res.mimeType || "application/pdf",
        };
      }

      if (!picked) return; // cancelado

      if (!/\.pdf$/i.test(picked.name)) {
        picked.name = picked.name + ".pdf";
      }

      // validar tamaño (máx DEFAULT_MAX_UPLOAD_BYTES)
      try {
        const info: any = await FileSystem.getInfoAsync(picked.uri);
        if (info?.size && info.size > DEFAULT_MAX_UPLOAD_BYTES) {
          Alert.alert(
            "Archivo demasiado grande",
            "El PDF no debe superar los 2MB."
          );
          return;
        }
      } catch {
        // si falla, seguimos igual
      }

      setUpdating(true);

      const fileForApi = {
        uri: picked.uri,
        name: picked.name,
        type: picked.mimeType || "application/pdf",
      };

      const newUrl = await replaceTycPdf(fileForApi);
      setPdfUrl(newUrl);
      await reloadMeta(newUrl);
      setPreviewFailed(false);

      Alert.alert(
        "Listo",
        "Se actualizó el PDF de Términos y Condiciones y Política de Privacidad."
      );
    } catch (e) {
      console.warn("[useTyc] handleChangePdf error:", e);
      Alert.alert(
        "Error",
        "No se pudo actualizar el PDF. Verificá permisos o intentá de nuevo."
      );
    } finally {
      setUpdating(false);
    }
  }, [reloadMeta]);

  const handleShare = useCallback(async () => {
    if (!pdfUrl) return;
    try {
      const fileName = meta?.name || "terminos.pdf";
      const dest = FileSystem.cacheDirectory + fileName;
      const res = await FileSystem.downloadAsync(pdfUrl, dest);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        Alert.alert(
          "Guardado",
          "Se descargó el archivo en la caché interna de la app."
        );
      }
    } catch (e) {
      console.warn("[useTyc] handleShare error:", e);
      Alert.alert(
        "Error",
        "No se pudo compartir o descargar el archivo. Intentá abrirlo desde el navegador."
      );
    }
  }, [pdfUrl, meta?.name]);

  const handleDownload = useCallback(async () => {
    if (!pdfUrl) return;
    try {
      const fileName = meta?.name || "terminos.pdf";
      const dest = FileSystem.documentDirectory + fileName;
      await FileSystem.downloadAsync(pdfUrl, dest);
      Alert.alert("Descargado", "El archivo se descargó en Documentos.");
    } catch (e) {
      console.warn("[useTyc] handleDownload error:", e);
      Alert.alert("Error", "No se pudo descargar el archivo.");
    }
  }, [pdfUrl, meta?.name]);

  const handlePreviewError = useCallback(() => {
    setPreviewFailed(true);
  }, []);

  const sizeLabel = formatBytesMB(meta?.sizeBytes);

  return {
    pdfUrl,
    meta,
    sizeLabel,
    loading,
    updating,
    previewFailed,
    handleChangePdf,
    handleShare,
    handleDownload,
    handlePreviewError,
  };
}
