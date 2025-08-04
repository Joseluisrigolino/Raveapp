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

/** 1) Trae las IDs de las imágenes liked */
async function fetchLikedImageIds(idArtista: string): Promise<string[]> {
  const token = await login();
  const resp = await apiClient.get<string[]>(
    `/v1/Artista/GetImgLikesArtista`,
    {
      params: { id: idArtista },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return Array.isArray(resp.data) ? resp.data : [];
}

/** 2) Trae todo el array de media de un artista */
async function fetchAllArtistMedia(idArtista: string): Promise<ApiMedia[]> {
  const raw = await mediaApi.getByEntidad(idArtista);
  // raw puede venir como array o como { media: [...] }
  return Array.isArray(raw)
    ? raw as ApiMedia[]
    : (raw as any).media ?? [];
}

/** Mapea la API al modelo local (sin aún asignar imagen ni likes) */
function parseApiArtist(api: ApiArtist): Omit<Artist, "image" | "likes"> & {
  image: string;
  likes: number;
} {
  return {
    idArtista:     api.idArtista,
    idSocial:      api.socials.idSocial ?? "",
    name:          api.nombre,
    description:   api.bio,
    creationDate:  api.dtAlta,
    isActivo:      api.isActivo === 1,
    instagramURL:  api.socials.mdInstagram ?? "",
    spotifyURL:    api.socials.mdSpotify ?? "",
    soundcloudURL: api.socials.mdSoundcloud ?? "",
    image:         PLACEHOLDER,
    likes:         0,
  };
}

/**
 * Obtiene todos los artistas y enriquece su imagen y likes
 */
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  let resp;
  // Intento principal: GetArtistas
  try {
    resp = await apiClient.get<{ artistas: ApiArtist[] }>(
      "/v1/Artista/GetArtistas",
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err: any) {
    if (err.response?.status === 404) {
      // Fallback si la ruta es distinta
      resp = await apiClient.get<{ artistas: ApiArtist[] }>(
        "/v1/Artista/GetArtista",
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      throw err;
    }
  }

  const list = resp.data.artistas ?? [];

  return Promise.all(
    list.map(async apiArt => {
      const base = parseApiArtist(apiArt);

      // — media principal —
      const mediaArr = await fetchAllArtistMedia(apiArt.idArtista);
      const m = mediaArr[0];
      let img = m?.url ?? m?.imagen ?? "";
      if (m?.imagen && !/^https?:\/\//.test(img)) {
        const baseUrl = apiClient.defaults.baseURL ?? "";
        img = `${baseUrl}${m.imagen.startsWith("/") ? "" : "/"}${m.imagen}`;
      }

      // — likes —
      const likedIds = await fetchLikedImageIds(apiArt.idArtista);

      return {
        ...base,
        image: img || base.image,
        likes: likedIds.length,
      };
    })
  );
}

/**
 * Obtiene un único artista filtrando por ID en la lista completa
 */
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
    idSocial:   "",
    mdInstagram:newArtist.instagramURL ?? "",
    mdSpotify:  newArtist.spotifyURL   ?? "",
    mdSoundcloud:newArtist.soundcloudURL?? "",
  };
  const body = {
    nombre:   newArtist.name,
    bio:      newArtist.description,
    socials:  socialsBody,
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
    idSocial:   artist.idSocial ?? "",
    mdInstagram:artist.instagramURL ?? "",
    mdSpotify:  artist.spotifyURL   ?? "",
    mdSoundcloud:artist.soundcloudURL?? "",
  };
  const body = {
    idArtista: artist.idArtista,
    nombre:    artist.name,
    bio:       artist.description,
    socials:   socialsBody,
    isActivo:  artist.isActivo === true,
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
