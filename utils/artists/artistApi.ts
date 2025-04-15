// src/utils/artistApi.ts
import { apiClient, login } from "@/utils/apiConfig";
import { Artist } from "@/interfaces/Artist";

// Estructura real de la API:
interface ApiArtist {
  idArtista: string;
  nombre: string;
  bio: string;
  dtAlta: string;
  isActivo: number;
}

// Mapea el artista de la API a tu interfaz local
function parseApiArtist(apiArt: ApiArtist): Artist {
  return {
    // Guarda el GUID en un nuevo campo "idArtista" para usarlo en Edición/Eliminación
    idArtista: apiArt.idArtista,
    name: apiArt.nombre,
    description: apiArt.bio,
    creationDate: apiArt.dtAlta,
    // Imagen ficticia; si la API provee imagen, usala en su lugar
    image: "https://picsum.photos/200/200?random=999",
    instagramURL: "",
    soundcloudURL: "",
    spotifyURL: "",
  };
}

/** Obtiene todos los artistas desde la API. */
export async function fetchArtistsFromApi(): Promise<Artist[]> {
  const token = await login();
  const response = await apiClient.get("/v1/Artista/GetArtista", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.data.artistas) {
    throw new Error("Respuesta sin 'artistas'");
  }

  const apiArtists: ApiArtist[] = response.data.artistas;
  return apiArtists.map(parseApiArtist);
}

/** Obtiene un artista por su GUID (idArtista). */
export async function fetchOneArtistFromApi(idArtista: string): Promise<Artist> {
  const token = await login();
  const response = await apiClient.get("/v1/Artista/GetArtista", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const apiArtists: ApiArtist[] = response.data.artistas || [];
  const found = apiArtists.find((a) => a.idArtista === idArtista);
  if (!found) {
    throw new Error("No se encontró el artista con ID: " + idArtista);
  }
  return parseApiArtist(found);
}

/** Actualiza un artista (PUT /v1/Artista/UpdateArtista). */
export async function updateArtistOnApi(artist: Partial<Artist>): Promise<void> {
  const token = await login();

  // Ajusta el body según lo que tu endpoint PUT realmente requiera
  const body = {
    idArtista: artist.idArtista,
    nombre: artist.name,
    bio: artist.description,
    dtAlta: artist.creationDate ?? "2025-01-01T00:00:00",
    isActivo: 1, // Ejemplo
  };

  await apiClient.put("/v1/Artista/UpdateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
}

/** Elimina un artista (DELETE /v1/Artista/DeleteArtista/{id}) */
export async function deleteArtistFromApi(idArtista: string): Promise<void> {
  const token = await login();

  try {
    const response = await apiClient.delete(`/v1/Artista/DeleteArtista/${idArtista}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });
    console.log("Respuesta DELETE:", response.data);
  } catch (error: any) {
    console.error("Error en deleteArtistFromApi:", error.response || error.message);
    throw error;
  }
}

/** Crea un artista (POST /v1/Artista/CreateArtista). */
export async function createArtistOnApi(newArtist: Partial<Artist>): Promise<void> {
  const token = await login();

  // Ajusta el body según lo que tu endpoint POST realmente requiera.
  // Según tu Swagger, al menos requiere: { nombre: string, bio: string }
  const body = {
    nombre: newArtist.name,
    bio: newArtist.description,
    // Si necesitás más campos (ej. isActivo, dtAlta), agrégalos aquí.
  };

  await apiClient.post("/v1/Artista/CreateArtista", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
}
