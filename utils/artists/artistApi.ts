// src/utils/artists/artistApi.ts

import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";
import { Artist } from "@/interfaces/Artist";

interface ApiMedia {
  idMedia: string;
  idEntidadMedia: string;
  imagen?: string;
  url?: string;
  mdVideo: string | null;
}

interface ApiSocials {
  idSocial: string | null;
  mdInstagram: string | null;
  mdSpotify: string | null;
  mdSoundcloud: string | null;
}

interface ApiArtist {
  idArtista: string;
  nombre: string;
  bio: string;
  dtAlta: string;
  isActivo: number;
  media: ApiMedia[];
  socials: ApiSocials;
}

const PLACEHOLDER = "https://picsum.photos/200/200?random=999";

/** 
 * Obtiene la URL de la primera imagen para un artista 
 */
async function fetchArtistMediaUrl(idArtista: string): Promise<string> {
  try {
    const raw = await mediaApi.getByEntidad(idArtista);
    const arr = Array.isArray((raw as any).media) ? (raw as any).media : [];
    const m = arr[0];
    let img = m?.url ?? m?.imagen ?? "";
    if (m?.imagen && !/^https?:\/\//.test(img)) {
      const base = apiClient.defaults.baseURL ?? "";
      img = `${base}${m.imagen.startsWith("/") ? "" : "/"}${m.imagen}`;
    }
    return img || "";
  } catch {
    return "";
  }
}

/** Mapea la API al modelo local sin imagen aún */
function parseApiArtist(api: ApiArtist): Omit<Artist, "image"> & { image: string } {
  return {
    idArtista: api.idArtista,
    idSocial: api.socials.idSocial,
    name: api.nombre,
    description: api.bio,
    creationDate: api.dtAlta,
    isActivo: api.isActivo === 1,
    instagramURL: api.socials.mdInstagram ?? "",
    spotifyURL: api.socials.mdSpotify ?? "",
    soundcloudURL: api.socials.mdSoundcloud ?? "",
    image: PLACEHOLDER,
    likes: undefined,
  };
}

/** Obtiene todos los artistas, enriqueciendo su `image` desde mediaApi */
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const resp = await apiClient.get<{ artistas: ApiArtist[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const list = resp.data.artistas ?? [];

  const enriched = await Promise.all(
    list.map(async apiArt => {
      const base = parseApiArtist(apiArt);
      const mediaUrl = await fetchArtistMediaUrl(apiArt.idArtista);
      return {
        ...base,
        image: mediaUrl || base.image,
      };
    })
  );

  return enriched;
}

/** Obtiene un artista por ID */
export async function fetchOneArtistFromApi(idArtista: string): Promise<Artist> {
  const all = await fetchArtistsFromApi();
  const found = all.find(a => a.idArtista === idArtista);
  if (!found) throw new Error("Artista no encontrado: " + idArtista);
  return found;
}

/** Crea un nuevo artista */
export async function createArtistOnApi(newArtist: Partial<Artist>): Promise<void> {
  const token = await login();
  const socialsBody = {
    idSocial: "",
    mdInstagram: newArtist.instagramURL ?? "",
    mdSpotify: newArtist.spotifyURL ?? "",
    mdSoundcloud: newArtist.soundcloudURL ?? "",
  };
  const body = {
    nombre: newArtist.name,
    bio: newArtist.description,
    socials: socialsBody,
    isActivo: true,
  };
  await apiClient.post(
    "/v1/Artista/CreateArtista",
    body,
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

/** Actualiza un artista existente */
export async function updateArtistOnApi(artist: Partial<Artist>): Promise<void> {
  const token = await login();
  const socialsBody = {
    idSocial: artist.idSocial ?? "",
    mdInstagram: artist.instagramURL ?? "",
    mdSpotify: artist.spotifyURL ?? "",
    mdSoundcloud: artist.soundcloudURL ?? "",
  };
  const body = {
    idArtista: artist.idArtista,
    nombre: artist.name,
    bio: artist.description,
    socials: socialsBody,
    isActivo: artist.isActivo === true,
  };
  await apiClient.put(
    "/v1/Artista/UpdateArtista",
    body,
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

/** Elimina un artista */
export async function deleteArtistFromApi(idArtista: string): Promise<void> {
  const token = await login();
  await apiClient.delete(
    `/v1/Artista/DeleteArtista/${idArtista}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
