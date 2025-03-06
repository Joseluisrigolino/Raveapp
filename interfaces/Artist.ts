// interfaces/Artist.ts
export interface Artist {
  id: number;                  // ID único para cada artista
  name: string;
  image: string;
  likes?: number;
  description?: string;
  instagramURL?: string;       // Nuevos campos opcionales
  soundcloudURL?: string;
  spotifyURL?: string;
  creationDate?: string;       // Fecha de creación (opcional)
}
