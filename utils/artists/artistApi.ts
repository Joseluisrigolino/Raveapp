// Marca o desmarca un artista como favorito para un usuario
export async function toggleArtistFavoriteOnApi(idUsuario: string, idArtista: string): Promise<void> {
  const token = await login();
  await apiClient.post(
    "/v1/Usuario/ArtistaFavorito",
    { idUsuario, idArtista },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";
import { Artist } from "@/interfaces/Artist";

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
      name: api.nombre,
      description: api.bio,
      creationDate: api.dtAlta,
      isActivo: api.isActivo === 1,
      instagramURL: api.socials.mdInstagram ?? "",
      spotifyURL: api.socials.mdSpotify ?? "",
      soundcloudURL: api.socials.mdSoundcloud ?? "",
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
export async function createArtist(name: string, isActivo: 0 | 1 = 1): Promise<void> {
  return createArtistOnApi({ name, isActivo: isActivo === 1 });
}

export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const resp = await apiClient.get<{ artistas: ApiArtist[] }>(
    "/v1/Artista/GetArtista",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const list = resp.data.artistas ?? [];
  return Promise.all(
    list.map(async (api) => {
      const a = await fetchOneArtistFromApi(api.idArtista);
      return a;
    })
  );
}

export async function createArtistOnApi(
  newArtist: Partial<Artist>
): Promise<void> {
  const token = await login();
  const body = {
    nombre: newArtist.name,
    bio: newArtist.description,
    socials: {
      idSocial: "",
      mdInstagram: newArtist.instagramURL ?? "",
      mdSpotify: newArtist.spotifyURL ?? "",
      mdSoundcloud: newArtist.soundcloudURL ?? "",
    },
    isActivo: true,
  };
  await apiClient.post("/v1/Artista/CreateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function updateArtistOnApi(
  artist: Partial<Artist>
): Promise<void> {
  const token = await login();
  const body = {
    idArtista: artist.idArtista,
    nombre: artist.name,
    bio: artist.description,
    socials: {
      mdInstagram: artist.instagramURL ?? "",
      mdSpotify: artist.spotifyURL ?? "",
      mdSoundcloud: artist.soundcloudURL ?? "",
    },
    isActivo: artist.isActivo === true,
  };
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
}) {
  const token = await login();
  await apiClient.post("/v1/Artista/CrearArtista", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
