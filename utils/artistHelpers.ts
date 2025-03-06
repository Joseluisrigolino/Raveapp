// utils/artistHelpers.ts
import { Artist } from "@/interfaces/Artist";

// Mock local de artistas
const mockArtists: Artist[] = [
  {
    name: "Ariana Grande",
    image: "https://picsum.photos/200?random=101",
    description: "Cantante estadounidense muy famosa",
    likes: 123,
  },
  {
    name: "A-Trak",
    image: "https://picsum.photos/200?random=102",
    description: "DJ y productor innovador...",
    likes: 294,
  },
  {
    name: "David Guetta",
    image: "https://picsum.photos/200?random=103",
    description: "DJ francés reconocido a nivel mundial",
    likes: 350,
  },
  // Agrega los que quieras...
];

/** Busca un artista por nombre en el mock local (case-insensitive). */
export function getArtistByName(name: string): Artist | null {
  const found = mockArtists.find(
    (artist) => artist.name.toLowerCase() === name.toLowerCase()
  );
  return found ?? null;
}
