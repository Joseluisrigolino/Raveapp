export interface Artist {
  idArtista: string;
  name: string;
  description: string;
  creationDate: string;
  isActivo: boolean;
  instagramURL: string;
  spotifyURL: string;
  soundcloudURL: string;
  image: string;
  likes: number;                // total de likes
  likedByIds: string[];         // array de IDs de usuarios que dieron like
  likedByImages: string[];      // URLs de las imágenes de esos usuarios
}
