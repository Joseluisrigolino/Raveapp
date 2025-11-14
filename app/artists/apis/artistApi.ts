// Helpers simples para el API de artistas (código en inglés)
import { apiClient, login } from "@/app/apis/apiConfig";
import { mediaApi } from "@/app/apis/mediaApi";
import { Artist } from "@/app/artists/types/Artist";
import { ApiArtistResponse } from "@/app/artists/types/api";

// Convierte un texto a Title Case para mostrar
function toTitleCase(name: string | undefined | null): string {
  if (!name) return "";
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Tipos de respuesta del API importados desde types/Artist

// Obtiene la primera imagen y la vuelve absoluta si falta base URL
async function getArtistImage(artistId: string): Promise<string> {
  try {
    const raw = await mediaApi.getByEntidad(artistId);
    const arr = Array.isArray(raw) ? raw : raw.media || [];
    const m = arr[0];
    let img = m?.url ?? m?.imagen ?? "";
    if (img && !/^https?:\/\//.test(img)) {
      const base = apiClient.defaults.baseURL ?? "";
      img = `${base}${img.startsWith("/") ? "" : "/"}${img}`;
    }
    return img || "";
  } catch {
    return "";
  }
}

// Marca/desmarca favorito y devuelve el artista actualizado
export async function toggleArtistFavoriteOnApi(
  userId: string,
  artistId: string
): Promise<Artist & { isLiked?: boolean } | void> {
  const token = await login();
  await apiClient.put(
    "/v1/Usuario/ArtistaFavorito",
    { idUsuario: userId, idArtista: artistId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  try {
    return await fetchOneArtistFromApi(artistId, userId);
  } catch {
    return undefined;
  }
}

// Obtiene el detalle de un artista
export async function fetchOneArtistFromApi(
  artistId: string,
  userId?: string
): Promise<Artist & { isLiked?: boolean }> {
  const token = await login();
  const params: Record<string, string> = { idArtista: artistId };
  if (userId) params.idUsuario = userId;

  const resp = await apiClient.get<{ artistas: ApiArtistResponse[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` }, params }
  );

  const list = resp?.data?.artistas ?? [];
  const api = list[0];

  if (!api) {
    return {
      idArtista: artistId,
      name: "Artist (no media)",
      description: "",
      creationDate: "",
      isActivo: false,
      instagramURL: "",
      spotifyURL: "",
      soundcloudURL: "",
      image: "",
      likes: 0,
      likedByIds: [],
      likedByImages: [],
      isLiked: false,
    };
  }

  // Obtiene IDs de usuarios que dieron like
  let likedByIds: string[] = [];
  try {
    const respLikes = await apiClient.get<string[]>(
      "/v1/Artista/GetImgLikesArtista",
      { params: { id: api.idArtista } }
    );
    likedByIds = Array.isArray(respLikes.data) ? respLikes.data : [];
  } catch {}

  // Obtiene imágenes de perfil de esos usuarios
  const base = apiClient.defaults.baseURL ?? "";
  const likedByImages: string[] = await Promise.all(
    likedByIds.map(async (uid) => {
      try {
        const raw = await mediaApi.getByEntidad(uid);
        const arr = Array.isArray(raw.media) ? raw.media : [];
        const m = arr[0];
        let p = m?.url ?? m?.imagen ?? "";
        if (p && !/^https?:\/\//.test(p)) {
          p = `${base}${p.startsWith("/") ? "" : "/"}${p}`;
        }
        return p || "";
      } catch {
        return "";
      }
    })
  );

  return {
    idArtista: api.idArtista,
    name: toTitleCase(api.nombre),
    description: api.bio,
    creationDate: api.dtAlta,
    isActivo: api.isActivo === 1,
    instagramURL: api.socials.mdInstagram ?? "",
    spotifyURL: api.socials.mdSpotify ?? "",
    soundcloudURL: api.socials.mdSoundcloud ?? "",
    idSocial: api.socials?.idSocial ?? null,
    image: await getArtistImage(api.idArtista),
    likes: api.likes,
    likedByIds,
    likedByImages: likedByImages.filter(Boolean),
    isLiked: api.isFavorito === 1,
  };
}

// Helper por compatibilidad: crea desde nombre + flag numérico
export async function createArtist(name: string, isActive: 0 | 1 = 1): Promise<string | null> {
  return createArtistOnApi({ name: toTitleCase(name), isActivo: isActive === 1 });
}

// Obtiene todos los artistas activos
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const resp = await apiClient.get<{ artistas: ApiArtistResponse[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const list = (resp.data.artistas ?? []).filter((a) => a.isActivo === 1);
  return Promise.all(list.map((a) => fetchOneArtistFromApi(a.idArtista)));
}

// Crea artista
export async function createArtistOnApi(newArtist: Partial<Artist>): Promise<string | null> {
  const token = await login();
  const body = {
    nombre: toTitleCase(newArtist.name),
    bio: newArtist.description,
    socials: {
      idSocial: "",
      mdInstagram: newArtist.instagramURL ?? "",
      mdSpotify: newArtist.spotifyURL ?? "",
      mdSoundcloud: newArtist.soundcloudURL ?? "",
    },
    isActivo: newArtist.isActivo === undefined ? true : Boolean(newArtist.isActivo),
  };
  const resp = await apiClient.post("/v1/Artista/CreateArtista", body, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = resp?.data;
  const id = (data && (data.idArtista ?? data.id ?? data.IdArtista ?? data.Id)) || null;
  return id ? String(id) : null;
}

// Actualiza artista
export async function updateArtistOnApi(artist: Partial<Artist>): Promise<void> {
  const token = await login();
  const socials: Record<string, string> = {};
  if (artist.idSocial) socials.idSocial = artist.idSocial;
  if (artist.instagramURL) socials.mdInstagram = artist.instagramURL;
  if (artist.spotifyURL) socials.mdSpotify = artist.spotifyURL;
  if (artist.soundcloudURL) socials.mdSoundcloud = artist.soundcloudURL;

  const body: any = {
    idArtista: artist.idArtista,
    nombre: toTitleCase(artist.name),
    bio: artist.description ?? "",
    isActivo: artist.isActivo === true,
  };
  if (Object.keys(socials).length > 0) body.socials = socials;

  await apiClient.put("/v1/Artista/UpdateArtista", body, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

// Elimina artista
export async function deleteArtistFromApi(artistId: string): Promise<void> {
  const token = await login();
  await apiClient.delete(`/v1/Artista/DeleteArtista/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Crea artista inactivo (endpoint distinto en el API)
export async function createArtistInactive(payload: {
  nombre: string;
  isActivo: 0 | 1;
}): Promise<string | null> {
  const token = await login();
  const body = { ...payload, nombre: toTitleCase(payload.nombre) };
  const resp = await apiClient.post("/v1/Artista/CrearArtista", body, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = resp?.data;
  const id = (data && (data.idArtista ?? data.id ?? data.IdArtista ?? data.Id)) || null;
  return id ? String(id) : null;
}
