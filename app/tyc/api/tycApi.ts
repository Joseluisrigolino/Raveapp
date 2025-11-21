// src/app/tyc/api/tycApi.ts
import { mediaApi } from "@/app/apis/mediaApi";

export const TYC_MEDIA_ENTITY_ID = "archivoTyc";

export interface TycMedia {
  idMedia: string;
  url: string;
  nombre?: string;
  size?: number;
  peso?: number;
  fecha?: string;
  dtCreacion?: string;
  createdAt?: string;
  fecAlta?: string;
}

/**
 * Devuelve el primer registro de media asociado al PDF de TyC,
 * o null si no existe.
 */
export async function getTycMedia(): Promise<TycMedia | null> {
  const data: any = await mediaApi.getByEntidad(TYC_MEDIA_ENTITY_ID);

  if (!Array.isArray(data?.media) || data.media.length === 0) {
    return null;
  }

  const m = data.media[0];

  return {
    idMedia: m.idMedia ?? m.id,
    url: m.url,
    nombre: m.nombre ?? m.fileName ?? m.dsNombre,
    size: typeof m.size === "number" ? m.size : undefined,
    peso: typeof m.peso === "number" ? m.peso : undefined,
    fecha: m.fecha,
    dtCreacion: m.dtCreacion,
    createdAt: m.createdAt,
    fecAlta: m.fecAlta,
  };
}

/**
 * Devuelve solo la URL del PDF de TyC (mantiene compatibilidad con tu código viejo).
 */
export async function getTycPdfUrl(): Promise<string> {
  const media = await getTycMedia();
  if (!media?.url) {
    throw new Error("No se encontró el PDF de Términos y Condiciones.");
  }
  return media.url;
}

export interface TycUploadFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Reemplaza el PDF actual por uno nuevo y devuelve la nueva URL.
 */
export async function replaceTycPdf(file: TycUploadFile): Promise<string> {
  // borrar media anterior (si existe)
  try {
    const data: any = await mediaApi.getByEntidad(TYC_MEDIA_ENTITY_ID);
    if (Array.isArray(data?.media)) {
      for (const m of data.media) {
        if (m?.idMedia) {
          try {
            await mediaApi.delete(m.idMedia);
          } catch {
            // si falla algún delete, seguimos igual
          }
        }
      }
    }
  } catch {
    // si falla la búsqueda, igual intentamos subir
  }

  await mediaApi.upload(TYC_MEDIA_ENTITY_ID, file, undefined, {
    maxBytes: 2 * 1024 * 1024,
  });

  // devolver la nueva URL
  return getTycPdfUrl();
}
