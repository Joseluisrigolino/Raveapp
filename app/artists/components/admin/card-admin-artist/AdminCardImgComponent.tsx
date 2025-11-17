// Componente: Imagen del artista en la tarjeta (admin)
// Comentarios en español, código en inglés

import React from "react";
import ArtistImage from "@/app/artists/components/ArtistImageComponent";

interface Props {
  imageUrl: string;
}

// Reexporta el componente genérico para mantener compatibilidad con imports existentes.
export default function AdminCardImgComponent({ imageUrl }: Props) {
  return <ArtistImage imageUrl={imageUrl} size={72} />;
}
