// app/apis/mediaApi.ts

import { apiClient, login } from "@/app/apis/apiClient"; // Cliente HTTP principal y login root

// ----------------------
// Tipos y constantes
// ----------------------

// Modelo real de un ítem de media según la API
export interface MediaItem {
  idMedia: string; // Identificador único de la media
  idEntidadMedia: string; // ID de la entidad a la que pertenece (evento, artista, etc.)
  url: string | null; // URL firmada al recurso (imagen/archivo) o null si es solo video
  mdVideo: string | null; // Identificador o URL de video (YouTube) o null si es solo imagen
}

// Respuesta estándar de la API de media cuando pedimos por entidad
export interface MediaListResponse {
  media: MediaItem[];
}

// Opciones de upload que permite la API de frontend
interface UploadOptions {
  compress?: boolean; // Si true, intenta comprimir antes de subir
  maxBytes?: number; // Límite máximo en bytes (por defecto 2MB)
}

// Límite por defecto: 2MB
export const DEFAULT_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// ----------------------
// Helpers internos
// ----------------------

/**
 * Intenta comprimir una imagen por debajo de cierto límite de bytes.
 * Estrategia simple: redimensionar a 1280px de ancho, JPEG con calidad 0.7.
 * Si algo falla, devuelve el archivo original sin cambios.
 */
async function shrinkToLimit(
  uri: string,
  nameHint: string | undefined,
  byteLimit: number
): Promise<{ uri: string; name: string; type: string }> {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const ImageManipulator = await import("expo-image-manipulator");

    // Tamaño original
    const infoOriginal: any = await FileSystem.getInfoAsync(uri);
    const originalSize =
      typeof infoOriginal?.size === "number" ? infoOriginal.size : 0;

    // Si ya está por debajo del límite, no hacemos nada
    if (originalSize > 0 && originalSize <= byteLimit) {
      return {
        uri,
        name: nameHint || "upload.jpg",
        type: "image/jpeg",
      };
    }

    // Un solo intento de compresión razonable
    const result: any = await (ImageManipulator as any).manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: "jpeg" }
    );

    const infoNuevo: any = await FileSystem.getInfoAsync(result.uri);
    const newSize = typeof infoNuevo?.size === "number" ? infoNuevo.size : 0;

    // Si el nuevo es más chico, lo usamos, aunque todavía supere el límite
    if (newSize > 0 && newSize < originalSize) {
      return {
        uri: result.uri,
        name: nameHint || "upload.jpg",
        type: "image/jpeg",
      };
    }

    // Si no mejoró, nos quedamos con el original
    return {
      uri,
      name: nameHint || "upload.jpg",
      type: "image/jpeg",
    };
  } catch {
    // Si algo falla (imports, manipulación, etc.), devolvemos original
    return {
      uri,
      name: nameHint || "upload.jpg",
      type: "image/jpeg",
    };
  }
}

/**
 * Normaliza un objeto "file" para que tenga siempre name y type.
 * Esto ayuda a que el backend reciba un multipart/form-data consistente.
 */
function ensureFileShape(file: any): any {
  const out: any = { ...file };

  if (!out.name) out.name = "upload.jpg";

  if (!out.type) {
    const ext = String(out.name).split(".").pop()?.toLowerCase();
    out.type = `image/${ext === "png" ? "png" : "jpeg"}`;
  }

  return out;
}

// ----------------------
// mediaApi
// ----------------------

/**
 * Media API
 * Centraliza los métodos para obtener, subir y eliminar media.
 */
export const mediaApi = {
  /**
   * Obtiene toda la media asociada a una entidad.
   * - GET /v1/Media?idEntidadMedia={id}
   * - Si el backend responde 404, devolvemos { media: [] }.
   */
  async getByEntidad(idEntidadMedia: string): Promise<MediaListResponse> {
    if (!idEntidadMedia) {
      throw new Error("mediaApi.getByEntidad: idEntidadMedia es requerido");
    }

    const token = await login().catch(() => null);

    try {
      const { data } = await apiClient.get<MediaListResponse>("/v1/Media", {
        params: { idEntidadMedia },
        headers: {
          Accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!data || !Array.isArray(data.media)) {
        return { media: [] };
      }

      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return { media: [] };
      }
      throw error;
    }
  },

  /**
   * Devuelve la URL de la PRIMERA imagen asociada a la entidad.
   * - Ignora ítems con mdVideo.
   * - Ignora URLs de YouTube en campo url.
   * Si no encuentra nada, devuelve string vacío.
   */
  async getFirstImage(idEntidadMedia: string): Promise<string> {
    const data = await this.getByEntidad(idEntidadMedia);
    const list: MediaItem[] = Array.isArray(data?.media) ? data.media : [];

    const img = list.find(
      (m) =>
        m &&
        typeof m.url === "string" &&
        m.url.trim().length > 0 &&
        !m.mdVideo &&
        !/youtube\.com|youtu\.be/i.test(m.url)
    );

    return img?.url || "";
  },

  /**
   * Devuelve el primer video asociado a la entidad (campo mdVideo).
   * Si no encuentra, devuelve string vacío.
   */
  async getFirstVideo(idEntidadMedia: string): Promise<string> {
    const data = await this.getByEntidad(idEntidadMedia);
    const list: MediaItem[] = Array.isArray(data?.media) ? data.media : [];

    const vid = list.find(
      (m) => m && typeof m.mdVideo === "string" && m.mdVideo.trim().length > 0
    );

    return vid?.mdVideo || "";
  },

  /**
   * Sube media asociada a una entidad.
   * - POST /v1/Media (multipart/form-data)
   * - Opcionalmente intenta comprimir la imagen si se pasa `compress: true`.
   */
  async upload(
    idEntidadMedia: string,
    file: any,
    video?: string,
    options?: UploadOptions
  ): Promise<any> {
    if (!idEntidadMedia || !file) {
      throw new Error("mediaApi.upload: faltan idEntidadMedia o file");
    }

    const maxBytes = options?.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

    // Si tenemos una uri local y se pidió compresión, intentamos una sola vez
    const maybeUri =
      file && typeof file === "object" && (file.uri || file?.localUri)
        ? file.uri || file.localUri
        : null;

    if (options?.compress && maybeUri && typeof maybeUri === "string") {
      const shrunk = await shrinkToLimit(maybeUri, file?.name, maxBytes);
      file = { ...file, uri: shrunk.uri, name: shrunk.name, type: shrunk.type };
    }

    const normalizedFile = ensureFileShape(file);
    const token = await login().catch(() => null);

    const form = new FormData();
    form.append("IdEntidadMedia", idEntidadMedia);
    form.append("File", normalizedFile as any);
    if (video) {
      form.append("Video", video);
    }

    const { data } = await apiClient.post("/v1/Media", form, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return data;
  },

  /**
   * Elimina una media por ID.
   * - DELETE /v1/Media/{id}
   */
  async delete(id: string): Promise<any> {
    if (!id) {
      throw new Error("mediaApi.delete: id es requerido");
    }

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
function ExpoRouterNoRoute() {
  return null; // Componente dummy que nunca se usa en la navegación
}

export default ExpoRouterNoRoute;

// Compatibilidad: alias en inglés por si algún módulo lo usa
// Evita tener que cambiar múltiples imports en el código existente.
export async function getByEntity(idEntidadMedia: string) {
  return mediaApi.getByEntidad(idEntidadMedia);
}
