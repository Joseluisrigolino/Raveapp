// API básico de artistas, con helpers simples y código en inglés
import { apiClient, login } from "@/app/apis/apiConfig";
import { mediaApi } from "@/app/apis/mediaApi";
import { Artist } from "@/app/artists/types/Artist";
import { ApiArtistResponse } from "@/app/artists/types/api/ApiArtist";

// =====================
// Helpers
// =====================

// Convierte a Title Case para mostrar nombres prolijos
function toTitleCase(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Asegura que una URL tenga la base del API si falta
function absoluteUrl(url: string | undefined | null): string {
  const u = url || "";
  if (!u) return "";
  if (/^https?:\/\//.test(u)) return u;
  const base = apiClient.defaults.baseURL || "";
  const sep = u.startsWith("/") ? "" : "/";
  return `${base}${sep}${u}`;
}

// Trae la primera imagen de una entidad (artista/usuario) si existe
async function getFirstImageByEntity(entityId: string): Promise<string> {
  try {
    const raw = await mediaApi.getByEntidad(entityId);
    const list = Array.isArray(raw) ? raw : raw?.media || [];
    const first = list[0];
    return absoluteUrl(first?.url ?? first?.imagen ?? "");
  } catch {
    return "";
  }
}

// =====================
// Requests principales
// =====================

// Marca o desmarca un artista como favorito y devuelve el artista actualizado
export async function toggleArtistFavoriteOnApi(
  userId: string,
  artistId: string
): Promise<(Artist & { isLiked?: boolean }) | void> {
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

// Trae el detalle de un artista (opcionalmente con contexto de usuario)
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

  const apiArtist = resp?.data?.artistas?.[0];
  if (!apiArtist) {
    // Si no hay datos, devolvemos un objeto base sin media
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

  // Lista de usuarios que dieron like
  let likedByIds: string[] = [];
  try {
    const likesResp = await apiClient.get<string[]>(
      "/v1/Artista/GetImgLikesArtista",
      { params: { id: apiArtist.idArtista } }
    );
    likedByIds = Array.isArray(likesResp.data) ? likesResp.data : [];
  } catch {
    likedByIds = [];
  }

  // Imagen de perfil de cada usuario que dio like
  const likedByImages = (
    await Promise.all(
      likedByIds.map(async (uid) => {
        try {
          const raw = await mediaApi.getByEntidad(uid);
          const m = Array.isArray(raw?.media) ? raw.media[0] : undefined;
          return absoluteUrl(m?.url ?? m?.imagen ?? "");
        } catch {
          return "";
        }
      })
    )
  ).filter(Boolean) as string[];

  return {
    idArtista: apiArtist.idArtista,
    name: toTitleCase(apiArtist.nombre),
    description: apiArtist.bio,
    creationDate: apiArtist.dtAlta,
    isActivo: apiArtist.isActivo === 1,
    instagramURL: apiArtist.socials.mdInstagram ?? "",
    spotifyURL: apiArtist.socials.mdSpotify ?? "",
    soundcloudURL: apiArtist.socials.mdSoundcloud ?? "",
    idSocial: apiArtist.socials?.idSocial ?? null,
    image: await getFirstImageByEntity(apiArtist.idArtista),
    likes: apiArtist.likes,
    likedByIds,
    likedByImages,
    isLiked: apiArtist.isFavorito === 1,
  };
}

// Lista de artistas activos (retorna detalle de cada uno)
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const resp = await apiClient.get<{ artistas: ApiArtistResponse[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const active = (resp.data.artistas ?? []).filter((a) => a.isActivo === 1);
  return Promise.all(active.map((a) => fetchOneArtistFromApi(a.idArtista)));
}

// Crea un artista y devuelve su id (string o null)
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

// Actualiza los datos de un artista existente
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

// Elimina un artista por id
export async function deleteArtistFromApi(artistId: string): Promise<void> {
  const token = await login();
  await apiClient.delete(`/v1/Artista/DeleteArtista/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Crea un artista inactivo (endpoint propio del backend)
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

// =====================
// Exports utilitarios
// =====================

// Helper simple para compatibilidad: crear por nombre + flag numérico
export async function createArtist(name: string, isActive: 0 | 1 = 1): Promise<string | null> {
  return createArtistOnApi({ name: toTitleCase(name), isActivo: isActive === 1 });
}
