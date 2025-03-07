// utils/artistHelpers.ts
import { Artist } from "@/interfaces/Artist";

const mockArtists: Artist[] = [
  {
    id: 1,
    name: "Ariana Grande",
    image: "https://picsum.photos/200?random=101",
    description: "Cantante estadounidense muy famosa",
    likes: 123,
    instagramURL: "https://instagram.com/arianagrande",
    soundcloudURL: "",
    spotifyURL: "",
    creationDate: "23/02/2025",
  },
  {
    id: 2,
    name: "A-Trak",
    image: "https://picsum.photos/200?random=102",
    description: "DJ y productor innovador...",
    likes: 294,
    instagramURL: "",
    soundcloudURL: "https://soundcloud.com/atrak",
    spotifyURL: "",
    creationDate: "10/03/2025",
  },
  // ...
];

// Retorna todos los artistas
export function getAllArtists(): Artist[] {
  return mockArtists;
}

// Retorna un artista por ID
export function getArtistById(id: number): Artist | null {
  const found = mockArtists.find((a) => a.id === id);
  return found ?? null;
}

// NUEVO: Retorna un artista por nombre EXACTO (case-insensitive)
export function getArtistByName(name: string): Artist | null {
  const lowerName = name.toLowerCase();
  const found = mockArtists.find(
    (artist) => artist.name.toLowerCase() === lowerName
  );
  return found ?? null;
}

// Retorna un array de artistas cuyo nombre contenga `query`
export function searchArtistsByName(query: string): Artist[] {
  const lowerQuery = query.toLowerCase();
  return mockArtists.filter((a) =>
    a.name.toLowerCase().includes(lowerQuery)
  );
}
