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
    // Relleno de imagen ficticio o si tu API provee imagen, úsala
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
  // Podrías tener un endpoint GET /v1/Artista/GetArtista/{id} o 
  // reusar la misma /GetArtista y filtrar. Ajusta a tu API real.
  const token = await login();

  // Suponiendo que NO hay endpoint GET por ID, 
  // repetimos la lógica y filtramos local. O si tu API lo provee, úsalo:
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
