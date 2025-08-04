import { apiClient } from "@/utils/apiConfig";

/**
 * Media API
 * Centraliza los métodos para obtener, subir y eliminar media
 */
export const mediaApi = {
  /**
   * Obtiene la media de una entidad
   * @param idEntidadMedia – el ID de la entidad (p.ej. artista, evento…)
   */
  async getByEntidad(idEntidadMedia: string) {
    if (!idEntidadMedia) {
      throw new Error("mediaApi.getByEntidad: idEntidadMedia es requerido");
    }

    try {
      const { data } = await apiClient.get("/v1/Media", {
        params: { idEntidadMedia },
        headers: { Accept: "*/*" },
      });

      // Siempre devolver en el formato esperado
      if (!data || !Array.isArray(data.media)) {
        return { media: [] };
      }

      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("⚠️ No hay media para la entidad:", idEntidadMedia);
        return { media: [] };
      }
      console.error("❌ Error en mediaApi.getByEntidad:", error);
      throw error;
    }
  },

  /**
   * Sube una nueva media (imagen o video)
   * @param idEntidadMedia – el ID de la entidad
   * @param file – el archivo a subir
   * @param video – opcional, url o base64 de video
   */
  async upload(idEntidadMedia: string, file: any, video?: string) {
    if (!idEntidadMedia || !file) {
      throw new Error("mediaApi.upload: faltan idEntidadMedia o file");
    }

    const form = new FormData();
    form.append("IdEntidadMedia", idEntidadMedia);
    form.append("File", file);
    if (video) {
      form.append("Video", video);
    }

    const { data } = await apiClient.post("/v1/Media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * Elimina una media por su ID
   * @param id – el ID de la media a eliminar
   */
  async delete(id: string) {
    if (!id) {
      throw new Error("mediaApi.delete: id es requerido");
    }

    const { data } = await apiClient.delete(`/v1/Media/${id}`);
    return data;
  },
};
