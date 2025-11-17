import type { ApiMedia } from "./ApiMedia";
import type { ApiSocials } from "./ApiSocials";

// API artist response shape
export interface ApiArtistResponse {
  idArtista: string;
  nombre: string;
  bio: string;
  dtAlta: string;
  isActivo: number;
  media: ApiMedia[] | null;
  socials: ApiSocials;
  isFavorito: number;
  likes: number;
}
