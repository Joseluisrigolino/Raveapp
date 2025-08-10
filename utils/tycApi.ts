// src/utils/tycApi.ts

import { mediaApi } from "@/utils/mediaApi";

/**
 * Obtiene la URL del PDF de Términos y Condiciones
 */
export async function getTycPdfUrl(): Promise<string> {
  // “archivoTyc” es el idEntidadMedia que usa tu backend para el PDF de T&C
  const data: any = await mediaApi.getByEntidad("archivoTyc");
  const first = data.media?.[0];
  if (!first?.url) {
    throw new Error("No se encontró el PDF de Términos y Condiciones.");
  }
  return first.url;
}
