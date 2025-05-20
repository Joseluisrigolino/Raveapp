// src/interfaces/Artist.ts
export interface Artist {
  /** GUID único */
  idArtista: string;
  /** ID de la tabla socials (puede venir null) */
  idSocial?: string | null;
  name: string;
  image: string;
  description?: string;
  creationDate?: string;
  instagramURL?: string;
  spotifyURL?: string;
  soundcloudURL?: string;
  /**  true = activo, false = inactivo */
  isActivo?: boolean;
  likes?: number;
}
