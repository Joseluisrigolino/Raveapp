// Marca o desmarca un artista como favorito para un usuario
export async function toggleArtistFavoriteOnApi(
  idUsuario: string,
  idArtista: string
): Promise<Artist & { isLiked?: boolean } | void> {
  const token = await login();
  await apiClient.put(
    "/v1/Usuario/ArtistaFavorito",
    { idUsuario, idArtista },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Después del toggle, pedir al servidor el estado actualizado para este usuario
  try {
    const updated = await fetchOneArtistFromApi(idArtista, idUsuario);
    return updated;
  } catch {
    return undefined;
  }
}
import { apiClient, login } from "@/app/apis/apiConfig";
import { mediaApi } from "@/app/apis/mediaApi";
import { Artist } from "@/app/artists/types/Artist";

// Helper: Title-case cada palabra (mantiene caracteres, sólo ajusta casing básico)
function toTitleCaseArtist(name: string | undefined | null): string {
  if (!name) return "";
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface ApiMedia {
  idMedia: string;
  idEntidadMedia: string;
  imagen?: string | null;
  url?: string | null;
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
  media: ApiMedia[] | null;
  socials: ApiSocials;
  isFavorito: number;
  likes: number;
}

async function fetchArtistImage(idArtista: string): Promise<string> {
  try {
    const raw = await mediaApi.getByEntidad(idArtista);
    const arr = Array.isArray(raw) ? raw : raw.media || [];
    const m = arr[0];
    let img = m?.url ?? m?.imagen ?? "";
    if (img && !/^https?:\/\//.test(img)) {
      const base = apiClient.defaults.baseURL ?? "";
      img = `${base}${img.startsWith("/") ? "" : "/"}${img}`;
    }
    return img || "";
  } catch (e) {
    console.warn("fetchArtistImage error", e);
    return "";
  }
}

export async function fetchOneArtistFromApi(
  idArtista: string,
  idUsuario?: string
): Promise<Artist & { isLiked?: boolean }> {
  try {
    const token = await login();
    const params: Record<string, string> = { idArtista };
    if (idUsuario) params.idUsuario = idUsuario;

    const resp = await apiClient.get<{ artistas: ApiArtist[] }>(
      "/v1/Artista/GetArtista",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );

    const apiList = resp.data.artistas ?? [];
    const api = apiList[0];

    if (!api) {
      // fallback si no devuelve nada, probablemente por no tener media
      return {
        idArtista,
        name: "Artista (sin media)",
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

    // Obtener los IDs de usuarios que dieron like
    let likedByIds: string[] = [];
    try {
      const respLikes = await apiClient.get<string[]>(
        "/v1/Artista/GetImgLikesArtista",
        { params: { id: api.idArtista } }
      );
      likedByIds = Array.isArray(respLikes.data) ? respLikes.data : [];
    } catch {
      likedByIds = [];
    }

    // Obtener las imágenes de perfil de esos usuarios
    const base = apiClient.defaults.baseURL ?? "";
    const likedByImages: string[] = await Promise.all(
      likedByIds.map(async (userId) => {
        try {
          const raw = await mediaApi.getByEntidad(userId);
          const arr = Array.isArray(raw.media) ? raw.media : [];
          const m = arr[0];
          let ruta = m?.url ?? m?.imagen ?? "";
          if (ruta && !/^https?:\/\//.test(ruta)) {
            ruta = `${base}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
          }
          return ruta || "";
        } catch {
          return "";
        }
      })
    );

    const artist: Artist & { isLiked?: boolean } = {
      idArtista: api.idArtista,
      name: toTitleCaseArtist(api.nombre),
      description: api.bio,
      creationDate: api.dtAlta,
      isActivo: api.isActivo === 1,
      instagramURL: api.socials.mdInstagram ?? "",
      spotifyURL: api.socials.mdSpotify ?? "",
      soundcloudURL: api.socials.mdSoundcloud ?? "",
      idSocial: api.socials?.idSocial ?? null,
      image: await fetchArtistImage(api.idArtista),
      likes: api.likes,
      likedByIds,
      likedByImages: likedByImages.filter(Boolean),
      isLiked: api.isFavorito === 1,
    };

    return artist;
  } catch (err: any) {
    const anyErr = err as any;
    console.error("❌ fetchOneArtistFromApi ERROR:", anyErr?.response?.data || err);
    throw err;
  }
}

// Helper compatible with older callsites: createArtist(name, isActivoNum)
export async function createArtist(name: string, isActivo: 0 | 1 = 1): Promise<string | null> {
  return createArtistOnApi({ name: toTitleCaseArtist(name), isActivo: isActivo === 1 });
}

export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const resp = await apiClient.get<{ artistas: ApiArtist[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  // Filtrar solo artistas activos (isActivo === 1)
  const list = (resp.data.artistas ?? []).filter((a) => a.isActivo === 1);
  return Promise.all(
    list.map(async (api) => {
      const a = await fetchOneArtistFromApi(api.idArtista);
      return a;
    })
  );
}

export async function createArtistOnApi(
  newArtist: Partial<Artist>
): Promise<string | null> {
  const token = await login();
  const body = {
    nombre: toTitleCaseArtist(newArtist.name),
    bio: newArtist.description,
    socials: {
      idSocial: "",
      mdInstagram: newArtist.instagramURL ?? "",
      mdSpotify: newArtist.spotifyURL ?? "",
      mdSoundcloud: newArtist.soundcloudURL ?? "",
    },
    // Respetar el flag isActivo si se pasa en newArtist (boolean), por defecto true
    isActivo: newArtist.isActivo === undefined ? true : Boolean(newArtist.isActivo),
  };
  const resp = await apiClient.post("/v1/Artista/CreateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  // Intentar extraer id devuelto por la API
  const data = resp?.data;
  try {
    try { console.info('[createArtistOnApi] status:', resp?.status, 'headers:', JSON.stringify(resp?.headers || {}, null, 2)); } catch {}
    try { console.info('[createArtistOnApi] response data:', JSON.stringify(data, null, 2)); } catch {}
  } catch {}
  const id =
    (data && (data.idArtista ?? data.id ?? data.IdArtista ?? data.Id)) || null;
  if (!id) {
    try { console.warn('[createArtistOnApi] no id returned by API for payload:', JSON.stringify(body)); } catch {}
  }
  return id ? String(id) : null;
}

export async function updateArtistOnApi(
  artist: Partial<Artist>
): Promise<void> {
  const token = await login();
  // Build socials object only with provided, non-empty fields
  const socials: Record<string, string> = {};
  if (artist.idSocial) socials.idSocial = artist.idSocial;
  if (artist.instagramURL) socials.mdInstagram = artist.instagramURL;
  if (artist.spotifyURL) socials.mdSpotify = artist.spotifyURL;
  if (artist.soundcloudURL) socials.mdSoundcloud = artist.soundcloudURL;

  const body: any = {
    idArtista: artist.idArtista,
    nombre: toTitleCaseArtist(artist.name),
    bio: artist.description ?? "",
    // API contract expects a boolean here
    isActivo: artist.isActivo === true,
  };
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

export async function deleteArtistFromApi(idArtista: string): Promise<void> {
  const token = await login();
  await apiClient.delete(`/v1/Artista/DeleteArtista/${idArtista}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createArtistInactive(payload: {
  nombre: string;
  isActivo: 0 | 1;
}): Promise<string | null> {
  const token = await login();
  const resp = await apiClient.post("/v1/Artista/CrearArtista", { ...payload, nombre: toTitleCaseArtist(payload.nombre) }, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = resp?.data;
  try { console.info('[createArtistInactive] status:', resp?.status, 'headers:', JSON.stringify(resp?.headers || {}, null, 2)); } catch {}
  try { console.info('[createArtistInactive] response data:', JSON.stringify(data, null, 2)); } catch {}
  const id = (data && (data.idArtista ?? data.id ?? data.IdArtista ?? data.Id)) || null;
  if (!id) {
    try { console.warn('[createArtistInactive] no id returned by API for payload:', JSON.stringify(payload)); } catch {}
  }
  return id ? String(id) : null;
}
