// app/artists/apis/artistApi.ts

// API de artistas: helpers para hablar con el backend de artistas
import { apiClient, login } from "@/app/apis/apiClient"; // Cliente HTTP y login root
import { mediaApi } from "@/app/apis/mediaApi"; // API de media
import { Artist } from "@/app/artists/types/Artist"; // Modelo de artista usado en el front
import { ApiArtistResponse } from "@/app/artists/types/api-types/ApiArtist"; // Modelo que viene del backend

// =====================
// Helpers internos
// =====================

/**
 * Convierte un string a Title Case (primera letra en mayúscula de cada palabra).
 * Se usa para mostrar nombres prolijos aunque el backend los devuelva en mayúsculas/minúsculas mixtas.
 */
function toTitleCase(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .trim()
    .split(/\s+/) // separamos por espacios
    .filter(Boolean)
    .map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() // primera mayúscula, resto minúscula
    )
    .join(" ");
}

/**
 * Trae la primera imagen asociada a una entidad (artista/usuario) usando mediaApi.
 * Devuelve una URL lista para usar en <Image> o un string vacío si no hay imagen.
 */
async function getFirstImageByEntity(entityId: string): Promise<string> {
  try {
    const url = await mediaApi.getFirstImage(entityId);
    return url || "";
  } catch {
    // Si algo falla (error de red, etc.), devolvemos vacío y la UI puede mostrar un placeholder
    return "";
  }
}

/**
 * Extrae el id de artista de una respuesta del backend.
 * El backend puede devolver distintos nombres de campo (idArtista, id, IdArtista, Id).
 */
function extractArtistIdFromResponse(data: any): string | null {
  const id =
    data?.idArtista ??
    data?.id ??
    data?.IdArtista ??
    data?.Id ??
    null;

  return id ? String(id) : null;
}

// =====================
// Requests principales
// =====================

/**
 * Marca o desmarca un artista como favorito para un usuario.
 * - Hace un PUT al endpoint de favorito.
 * - Luego intenta recargar el artista actualizado desde la API.
 */
export async function toggleArtistFavoriteOnApi(
  userId: string,
  artistId: string
): Promise<(Artist & { isLiked?: boolean }) | undefined> {
  const token = await login(); // Obtenemos token root

  // Llamamos al endpoint de favorito
  await apiClient.put(
    "/v1/Usuario/ArtistaFavorito",
    { idUsuario: userId, idArtista: artistId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Intentamos devolver el artista ya actualizado
  try {
    return await fetchOneArtistFromApi(artistId, userId);
  } catch {
    // Si falla la recarga, no rompemos la app: devolvemos undefined
    return undefined;
  }
}

/**
 * Trae el detalle de un artista.
 * - Opcionalmente con contexto de usuario, para saber si ese usuario lo tiene en favoritos.
 */
export async function fetchOneArtistFromApi(
  artistId: string,
  userId?: string
): Promise<Artist & { isLiked?: boolean }> {
  const token = await login();

  // Armamos los parámetros de query
  const params: Record<string, string> = { idArtista: artistId };
  if (userId) params.idUsuario = userId;

  // GET /v1/Artista/GetArtista
  const resp = await apiClient.get<{ artistas: ApiArtistResponse[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` }, params }
  );

  // Tomamos el primer artista de la lista (la API devuelve un array)
  const apiArtist = resp?.data?.artistas?.[0];

  // Si no viene nada, devolvemos un artista base sin media
  if (!apiArtist) {
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

  // -------------------------
  // Likes de otros usuarios
  // -------------------------

  // Lista de IDs de usuarios que dieron like a este artista
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

  // Para cada usuario que dio like, buscamos su imagen de perfil
  const likedByImages = (
    await Promise.all(
      likedByIds.map(async (uid) => {
        try {
          // Reutilizamos el mismo helper de media
          const url = await getFirstImageByEntity(uid);
          return url;
        } catch {
          return "";
        }
      })
    )
  ).filter(Boolean) as string[];

  // -------------------------
  // Mapeo de ApiArtistResponse -> Artist (modelo del front)
  // -------------------------

  return {
    idArtista: apiArtist.idArtista,
    name: toTitleCase(apiArtist.nombre),
    description: apiArtist.bio,
    creationDate: apiArtist.dtAlta,
    isActivo: apiArtist.isActivo === 1, // backend usa 1/0, front usa boolean
    instagramURL: apiArtist.socials?.mdInstagram ?? "",
    spotifyURL: apiArtist.socials?.mdSpotify ?? "",
    soundcloudURL: apiArtist.socials?.mdSoundcloud ?? "",
    idSocial: apiArtist.socials?.idSocial ?? null,
    image: await getFirstImageByEntity(apiArtist.idArtista),
    likes: apiArtist.likes,
    likedByIds,
    likedByImages,
    isLiked: apiArtist.isFavorito === 1, // también 1/0 -> boolean
  };
}

/**
 * Trae la lista de artistas activos.
 * - Hace un GET general a /v1/Artista/GetArtista
 * - Filtra isActivo === 1
 * - Para cada uno, vuelve a pedir el detalle con fetchOneArtistFromApi
 *   (para unificar el formato y traer media y likes).
 */
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();

  const resp = await apiClient.get<{ artistas: ApiArtistResponse[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const all = resp.data.artistas ?? [];

  // Nos quedamos solo con los activos
  const active = all.filter((a) => a.isActivo === 1);

  // Para cada artista activo, traemos el detalle completo
  return Promise.all(active.map((a) => fetchOneArtistFromApi(a.idArtista)));
}

/**
 * Crea un artista y devuelve su id.
 * - POST /v1/Artista/CreateArtista
 */
export async function createArtistOnApi(
  newArtist: Partial<Artist>
): Promise<string | null> {
  const token = await login();

  // Armamos el body según lo que espera el backend
  const body = {
    nombre: toTitleCase(newArtist.name),
    bio: newArtist.description,
    socials: {
      idSocial: "",
      mdInstagram: newArtist.instagramURL ?? "",
      mdSpotify: newArtist.spotifyURL ?? "",
      mdSoundcloud: newArtist.soundcloudURL ?? "",
    },
    // Si no viene isActivo, lo damos de alta como activo
    isActivo:
      newArtist.isActivo === undefined ? true : Boolean(newArtist.isActivo),
  };

  const resp = await apiClient.post("/v1/Artista/CreateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Normalizamos cómo sacamos el id de la respuesta
  return extractArtistIdFromResponse(resp?.data);
}

/**
 * Actualiza los datos de un artista existente.
 * - PUT /v1/Artista/UpdateArtista
 */
export async function updateArtistOnApi(
  artist: Partial<Artist>
): Promise<void> {
  const token = await login();

  // Armamos el objeto socials solo con lo que viene
  const socials: Record<string, string> = {};
  if (artist.idSocial) socials.idSocial = artist.idSocial;
  if (artist.instagramURL) socials.mdInstagram = artist.instagramURL;
  if (artist.spotifyURL) socials.mdSpotify = artist.spotifyURL;
  if (artist.soundcloudURL) socials.mdSoundcloud = artist.soundcloudURL;

  // Body principal que espera el backend
  const body: any = {
    idArtista: artist.idArtista,
    nombre: toTitleCase(artist.name),
    bio: artist.description ?? "",
    isActivo: artist.isActivo === true, // si no es true explícito, lo consideramos false
  };

  // Solo mandamos socials si hay algo para actualizar
  if (Object.keys(socials).length > 0) {
    body.socials = socials;
  }

  await apiClient.put("/v1/Artista/UpdateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Elimina un artista por id.
 * - DELETE /v1/Artista/DeleteArtista/{id}
 */
export async function deleteArtistFromApi(
  artistId: string
): Promise<void> {
  const token = await login();

  await apiClient.delete(`/v1/Artista/DeleteArtista/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Crea un artista inactivo.
 * - Endpoint específico del backend: /v1/Artista/CrearArtista
 *   (distinto de CreateArtista, tal como está definido hoy).
 */
export async function createArtistInactive(payload: {
  nombre: string;
  isActivo: 0 | 1;
}): Promise<string | null> {
  const token = await login();

  const body = {
    ...payload,
    nombre: toTitleCase(payload.nombre),
  };

  const resp = await apiClient.post("/v1/Artista/CrearArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Reutilizamos el mismo helper para extraer el id
  return extractArtistIdFromResponse(resp?.data);
}

// =====================
// Export utilitario
// =====================

/**
 * Helper simple para crear un artista a partir de nombre + flag numérico 0/1.
 * Internamente llama a createArtistOnApi.
 */
export async function createArtist(
  name: string,
  isActive: 0 | 1 = 1
): Promise<string | null> {
  return createArtistOnApi({
    name: toTitleCase(name),
    isActivo: isActive === 1,
  });
}


function ExpoRouterNoRoute() {
  return null; // Componente vacío, nunca se usa en la UI
}

export default ExpoRouterNoRoute;
