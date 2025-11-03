// utils/mediaApi.ts
import { apiClient, login } from "@/app/apis/apiConfig";

/**
 * Media API
 * Centraliza los métodos para obtener, subir y eliminar media
 */
export const mediaApi = {
  /** Obtiene la media de una entidad (crudo) */
  async getByEntidad(idEntidadMedia: string) {
    if (!idEntidadMedia) {
      throw new Error("mediaApi.getByEntidad: idEntidadMedia es requerido");
    }
    const token = await login().catch(() => null);
    try {
      const { data } = await apiClient.get("/v1/Media", {
        params: { idEntidadMedia },
        headers: {
          Accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!data || !Array.isArray(data.media)) return { media: [] };
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) return { media: [] };
      throw error;
    }
  },

  /** DEVUELVE SOLO IMAGEN: primer item con `url` válida y SIN `mdVideo` */
  async getFirstImage(idEntidadMedia: string): Promise<string> {
    const data = await this.getByEntidad(idEntidadMedia);
    const list: any[] = Array.isArray(data?.media) ? data.media : [];

    // ignora explícitamente cualquier item que tenga mdVideo
    const img = list.find(
      (m) =>
        m &&
        typeof m.url === "string" &&
        m.url.trim().length > 0 &&
        !m.mdVideo && // <- esto evita YouTube
        !/youtube\.com|youtu\.be/i.test(m.url) // por si vino mal cargado
    );

    return img?.url || "";
  },

  /** DEVUELVE SOLO VIDEO (YouTube, etc.): primer item con `mdVideo` */
  async getFirstVideo(idEntidadMedia: string): Promise<string> {
    const data = await this.getByEntidad(idEntidadMedia);
    const list: any[] = Array.isArray(data?.media) ? data.media : [];
    const vid = list.find(
      (m) => m && typeof m.mdVideo === "string" && m.mdVideo.trim().length > 0
    );
    return vid?.mdVideo || "";
  },

  /** Sube media (igual que ya tenías) */
  async upload(
    idEntidadMedia: string,
    file: any,
    video?: string,
    options?: { compress?: boolean; maxBytes?: number }
  ) {
    if (!idEntidadMedia || !file) {
      throw new Error("mediaApi.upload: faltan idEntidadMedia o file");
    }
    // Enforce a 2MB limit by default (ajustado a 2MB)
  const MAX_UPLOAD_BYTES = options?.maxBytes ?? 2 * 1024 * 1024;
  const SAFETY_RATIO = 0.8; // margen de seguridad más conservador
  const TARGET_BYTES_DEFAULT = Math.floor(MAX_UPLOAD_BYTES * SAFETY_RATIO);
    
    // Util para comprimir iterativamente hasta quedar por debajo del umbral
    const shrinkToLimit = async (
      uri: string,
      desiredFormat: 'jpeg' | 'png',
      nameHint: string | undefined,
      byteLimit: number
    ) => {
      try {
        const FileSystem = await import('expo-file-system/legacy');
        const ImageManipulator = await import('expo-image-manipulator');
        const getSize = async (u: string) => {
          try {
            const info: any = await FileSystem.getInfoAsync(u);
            return typeof info?.size === 'number' ? info.size : 0;
          } catch { return 0; }
        };
        const originalSize = await getSize(uri);
        if (originalSize && originalSize <= byteLimit) {
          return { uri, name: nameHint || `upload.${desiredFormat === 'png' ? 'png' : 'jpg'}`, type: `image/${desiredFormat}` };
        }
        // Estrategia: reducir ancho y calidad en escalones
        const widths = [1280, 960, 720, 640, 560];
        const qualities = desiredFormat === 'png' ? [1] : [0.7, 0.5, 0.4, 0.3];
        let best = { uri, size: originalSize || Number.MAX_SAFE_INTEGER };
        for (const w of widths) {
          for (const q of qualities) {
            try {
              const res: any = await (ImageManipulator as any).manipulateAsync(
                best.uri,
                [{ resize: { width: w } }],
                { compress: q, format: desiredFormat }
              );
              const s = await getSize(res.uri);
              if (s > 0 && s < best.size) {
                best = { uri: res.uri, size: s } as any;
              }
              if (s > 0 && s <= byteLimit) {
                return { uri: res.uri, name: nameHint || `upload.${desiredFormat === 'png' ? 'png' : 'jpg'}`, type: `image/${desiredFormat}` };
              }
            } catch (e) {
              // continuar probando
            }
          }
        }
        // Intento adicional: si era PNG, probar convertir a JPEG que comprime mejor
        if (desiredFormat === 'png') {
          try {
            const res: any = await (ImageManipulator as any).manipulateAsync(
              best.uri,
              [{ resize: { width: 720 } }],
              { compress: 0.5, format: 'jpeg' }
            );
            const s = await getSize(res.uri);
            if (s > 0 && s <= byteLimit) {
              return { uri: res.uri, name: nameHint || 'upload.jpg', type: 'image/jpeg' };
            }
            if (s > 0 && s < best.size) {
              best = { uri: res.uri, size: s } as any;
            }
          } catch {}
        }
        // Si no logramos quedar por debajo del umbral, devolvemos la mejor versión encontrada
        return { uri: best.uri, name: nameHint || `upload.${desiredFormat === 'png' ? 'png' : 'jpg'}`, type: `image/${desiredFormat === 'png' ? 'png' : 'jpeg'}` };
      } catch {
        return { uri, name: nameHint || `upload.${desiredFormat === 'png' ? 'png' : 'jpg'}`, type: `image/${desiredFormat}` };
      }
    };
    try {
      // If file has a local uri (expo/react-native), try to get its size and reject early
      const maybeUri = (file && typeof file === 'object' && (file.uri || file?.localUri)) ? (file.uri || file.localUri) : null;
      if (maybeUri && typeof maybeUri === 'string') {
        try {
          // dynamic import to avoid adding dependency on web
          const FileSystem = await import('expo-file-system/legacy');
          const info: any = await FileSystem.getInfoAsync(maybeUri);
          if (info && typeof info.size === 'number' && info.size > MAX_UPLOAD_BYTES) {
            if (options?.compress) {
              try {
                const originalName = String(file?.name || '').toLowerCase();
                const originalExt = originalName.split('.').pop?.() || '';
                const originalType = String(file?.type || '').toLowerCase();
                const preferPng = originalExt === 'png' || originalType.includes('png');
                const shrunk = await shrinkToLimit(maybeUri, preferPng ? 'png' : 'jpeg', file?.name, TARGET_BYTES_DEFAULT);
                // Re-check size
                const newInfo: any = await FileSystem.getInfoAsync(shrunk.uri);
                if (newInfo?.size && newInfo.size <= MAX_UPLOAD_BYTES) {
                  file = { ...file, uri: shrunk.uri, name: shrunk.name, type: shrunk.type };
                } else {
                  // como no quedó por debajo, si sigue muy grande lanzar 413 preventivo
                  const e: any = new Error('mediaApi.upload: archivo demasiado grande tras compresión');
                  e.status = 413;
                  e.currentSize = newInfo?.size ?? info?.size ?? 0;
                  e.limit = MAX_UPLOAD_BYTES;
                  throw e;
                }
              } catch (ce) {
                // Si la compresión falla, continuamos y dejamos al servidor validar
                console.warn('[mediaApi.upload] compresión falló, se intenta subir original:', ce);
              }
            } else {
              const e: any = new Error('mediaApi.upload: archivo demasiado grande (>2MB)');
              e.status = 413;
              throw e;
            }
          }
        } catch (err) {
          // If we can't determine size, continue and let network layer handle it.
        }
      }
    } catch {}
    const ensure = (f: any) => {
      const out = { ...f };
      if (!out.name) out.name = "upload.jpg";
      if (!out.type) {
        const ext = String(out.name).split(".").pop()?.toLowerCase();
        out.type = `image/${ext === "png" ? "png" : "jpeg"}`;
      }
      return out;
    };

    const token = await login().catch(() => null);

    const form = new FormData();
    form.append("IdEntidadMedia", idEntidadMedia);
    // Solo un campo de archivo consistente con el backend
    form.append("File", ensure(file) as any);
    if (video) form.append("Video", video);

    const url = (apiClient.defaults.baseURL ?? "") + "/v1/Media";

    // Si estamos en entorno RN/Expo: preferimos fetch (evita problemas con Content-Type/boundary)
    const isReactNativeLike = typeof navigator === 'object' && navigator.product === 'ReactNative';

    const doUploadFetch = async (formData: FormData) => {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch(url, { method: 'POST', headers, body: formData as any });
      const text = await resp.text();
      let parsed: any = text;
      try { parsed = JSON.parse(text); } catch {}
      if (!resp.ok) {
        const errMsg = parsed?.message || parsed || `HTTP ${resp.status}`;
        throw Object.assign(new Error('mediaApi.upload(fetch) fallo: ' + errMsg), { status: resp.status, raw: parsed });
      }
      return parsed;
    };

    if (isReactNativeLike) {
      try {
        console.log('[mediaApi.upload] usando fetch principal (RN) ->', { idEntidadMedia, url });
        return await doUploadFetch(form);
      } catch (err: any) {
        console.warn('[mediaApi.upload] fetch principal fallo, se intentará axios como fallback:', err?.message ?? err);
        // permitir caer al bloque axios fallback a continuación
      }
    }

    // Si no estamos en RN o si fetch falló, intentamos axios
    try {
      console.log('[mediaApi.upload] intentando axios (fallback) ->', { idEntidadMedia, url });
      const { data } = await apiClient.post('/v1/Media', form, {
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : ({ 'Content-Type': 'multipart/form-data' } as any),
      });
      return data;
    } catch (err: any) {
      console.warn('[mediaApi.upload] axios fallo:', err?.message ?? err);
      console.warn('[mediaApi.upload] detalle response:', err?.response ?? err?.request ?? 'sin detalle');
      // Si el servidor responde 413, intentamos una compresión más agresiva y reintento con fetch
      try {
        const status = err?.response?.status ?? err?.status;
        const maybeUri = (file && typeof file === 'object' && (file.uri || file?.localUri)) ? (file.uri || file.localUri) : null;
        if (status === 413 && maybeUri) {
          console.warn('[mediaApi.upload] reintento 413: comprimiendo a ~50% del límite y reintentando');
          const targetBytes = Math.floor(MAX_UPLOAD_BYTES * 0.5);
          const originalName = String(file?.name || '').toLowerCase();
          const originalExt = originalName.split('.').pop?.() || '';
          const originalType = String(file?.type || '').toLowerCase();
          const preferPng = originalExt === 'png' || originalType.includes('png');
          const shrunk = await shrinkToLimit(maybeUri, preferPng ? 'png' : 'jpeg', file?.name, targetBytes);
          const smaller = { ...file, uri: shrunk.uri, name: shrunk.name, type: shrunk.type };
          const form2 = new FormData();
          form2.append('IdEntidadMedia', idEntidadMedia);
          form2.append('File', ensure(smaller) as any);
          if (video) form2.append('Video', video);
          return await doUploadFetch(form2);
        }
      } catch (retryErr) {
        console.warn('[mediaApi.upload] reintento 413 fallo:', retryErr);
      }
      // último recurso: reintentar fetch (por si axios manipuló headers)
      try {
        console.log('[mediaApi.upload] intentando fallback fetch final ->', url);
        return await doUploadFetch(form);
      } catch (err2: any) {
        console.error('[mediaApi.upload] fallback fetch fallo:', err2?.message ?? err2);
        throw err; // re-throw original axios error (más informativo)
      }
    }
  },

  /** Eliminar media */
  async delete(id: string) {
    if (!id) throw new Error("mediaApi.delete: id es requerido");
    const token = await login().catch(() => null);
    const { data } = await apiClient.delete(`/v1/Media/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  },
};

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Export default inofensivo para evitar el warning de expo-router en tiempo de desarrollo.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() { return null; }
export default ExpoRouterNoRoute;
