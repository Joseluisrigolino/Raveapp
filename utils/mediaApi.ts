// utils/mediaApi.ts
import { apiClient, login } from "@/utils/apiConfig";

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
  async upload(idEntidadMedia: string, file: any, video?: string, options?: { compress?: boolean }) {
    if (!idEntidadMedia || !file) {
      throw new Error("mediaApi.upload: faltan idEntidadMedia o file");
    }
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
    form.append("File", ensure(file) as any);
    try {
      form.append("file", ensure(file) as any);
    } catch {}
    if (video) form.append("Video", video);

    const url = (apiClient.defaults.baseURL ?? "") + "/v1/Media";

    // Si estamos en entorno RN/Expo: preferimos fetch (evita problemas con Content-Type/boundary)
    const isReactNativeLike = typeof navigator === 'object' && navigator.product === 'ReactNative';

    if (isReactNativeLike) {
      try {
        console.log('[mediaApi.upload] usando fetch principal (RN) ->', { idEntidadMedia, url });
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const resp = await fetch(url, { method: 'POST', headers, body: form as any });
        const text = await resp.text();
        let parsed: any = text;
        try {
          parsed = JSON.parse(text);
        } catch {}
        if (!resp.ok) {
          const errMsg = parsed?.message || parsed || `HTTP ${resp.status}`;
          throw Object.assign(new Error('mediaApi.upload(fetch) fallo: ' + errMsg), { status: resp.status, raw: parsed });
        }
        return parsed;
      } catch (err: any) {
        console.warn('[mediaApi.upload] fetch principal fallo, se intentará axios como fallback:', err?.message ?? err);
        // permitir caer al bloque axios fallback a continuación
      }
    }

    // Si no estamos en RN o si fetch falló, intentamos axios
    try {
      console.log('[mediaApi.upload] intentando axios (fallback) ->', { idEntidadMedia, url });
      const { data } = await apiClient.post('/v1/Media', form, {
        headers: token ? { Authorization: `Bearer ${token}` } : ({} as any),
      });
      return data;
    } catch (err: any) {
      console.warn('[mediaApi.upload] axios fallo:', err?.message ?? err);
      console.warn('[mediaApi.upload] detalle response:', err?.response ?? err?.request ?? 'sin detalle');
      // último recurso: reintentar fetch (por si axios manipuló headers)
      try {
        console.log('[mediaApi.upload] intentando fallback fetch final ->', url);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const resp = await fetch(url, { method: 'POST', headers, body: form as any });
        const text = await resp.text();
        let parsed: any = text;
        try {
          parsed = JSON.parse(text);
        } catch {}
        if (!resp.ok) {
          const errMsg = parsed?.message || parsed || `HTTP ${resp.status}`;
          throw Object.assign(new Error('mediaApi.upload(fetch) fallo: ' + errMsg), { status: resp.status, raw: parsed });
        }
        return parsed;
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
