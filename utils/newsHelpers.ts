// utils/newsHelpers.ts
import { NewsItem } from "@/interfaces/NewsProps";

// Mock local de noticias
const mockNews: NewsItem[] = [
  {
    id: 1,
    title: "New Release 1",
    imageUrl: "https://picsum.photos/700/400?random=1",
    description: `Llegó el viernes y se viene finde largo...
https://open.spotify.com/playlist/3PanXbcy6jmHBtJh2dvFIB
Visita nuestro sitio: https://example.com`,
  },
  {
    id: 2,
    title: "New Release 2",
    imageUrl: "https://picsum.photos/700/400?random=2",
    description: `Otra noticia con un link: https://expo.dev`,
  },
  {
    id: 3,
    title: "New Release 3",
    imageUrl: "https://picsum.photos/700/400?random=3",
    description: `Descubre más en https://reactnative.dev`,
  },
  // Agrega las que necesites...
];

/** 
 * Devuelve la noticia con ese ID o null si no existe 
 */
export function getNewsById(id: number): NewsItem | null {
  const found = mockNews.find((news) => news.id === id);
  return found ?? null;
}
