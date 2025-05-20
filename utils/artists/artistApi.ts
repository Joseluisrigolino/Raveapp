// src/utils/artists/artistApi.ts
import { apiClient, login } from "@/utils/apiConfig";
import { Artist } from "@/interfaces/Artist";

interface ApiMedia {
  idMedia: string;
  imagen: string;
  video: string;
  idEntidadMedia: string;
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

// Mapea la respuesta de la API a la interfaz local
function parseApiArtist(apiArt: ApiArtist): Artist {
  return {
    idArtista: apiArt.idArtista,
    idSocial: apiArt.socials.idSocial,
    name: apiArt.nombre,
    description: apiArt.bio,
    creationDate: apiArt.dtAlta,
    isActivo: apiArt.isActivo === 1,
    image: apiArt.media?.[0]?.imagen ?? "https://picsum.photos/200/200?random=999",
    instagramURL: apiArt.socials.mdInstagram ?? "",
    spotifyURL: apiArt.socials.mdSpotify ?? "",
    soundcloudURL: apiArt.socials.mdSoundcloud ?? "",
  };
}

/** Obtiene todos los artistas */
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const { data } = await apiClient.get<{ artistas: ApiArtist[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!data.artistas) throw new Error("Respuesta sin 'artistas'");
  return data.artistas.map(parseApiArtist);
}

/** Obtiene un artista por GUID */
export async function fetchOneArtistFromApi(
  idArtista: string
): Promise<Artist> {
  const all = await fetchArtistsFromApi();
  const found = all.find((a) => a.idArtista === idArtista);
  if (!found) throw new Error("Artista no encontrado: " + idArtista);
  return found;
}

/** Crea un artista */
export async function createArtistOnApi(
  newArtist: Partial<Artist>
): Promise<void> {
  const token = await login();
  const socialsBody: any = {
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
  console.log("🍀 POST CreateArtista body:", body);
  await apiClient.post(
    "https://api.raveapp.com.ar/v1/Artista/CreateArtista",
    body,
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

/** Actualiza un artista */
export async function updateArtistOnApi(
  artist: Partial<Artist>
): Promise<void> {
  const token = await login();
  const socialsBody: any = {
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
  console.log("🍀 PUT UpdateArtista body:", body);
  await apiClient.put(
    "https://api.raveapp.com.ar/v1/Artista/UpdateArtista",
    body,
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

/** Elimina un artista */
export async function deleteArtistFromApi(
  idArtista: string
): Promise<void> {
  const token = await login();
  await apiClient.delete(
    `/v1/Artista/DeleteArtista/${idArtista}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}