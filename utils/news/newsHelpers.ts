// utils/news/newsHelpers.ts

import { NewsItem } from "@/interfaces/NewsProps";
import { getAllEvents, getEventById } from "@/utils/events/eventHelpers"; 
// ^ Podrías importar si quisieras usarlo internamente, 
//   pero en este ejemplo no hace falta para la creación de mockNews.

const mockNews: NewsItem[] = [
  {
    id: 1,
    title: "New Release 1",
    imageUrl: "https://picsum.photos/700/400?random=1",
    description: `Llegó el viernes y se viene finde largo...
https://open.spotify.com/playlist/3PanXbcy6jmHBtJh2dvFIB
Visita nuestro sitio: https://example.com`,
    eventId: 2, // <--- noticia vinculada al evento con id=2 (Techno Day)
  },
  {
    id: 2,
    title: "New Release 2",
    imageUrl: "https://picsum.photos/700/400?random=2",
    description: `Otra noticia con un link: https://expo.dev`,
    // sin eventId => no hay evento relacionado
  },
  {
    id: 3,
    title: "New Release 3",
    imageUrl: "https://picsum.photos/700/400?random=3",
    description: `Descubre más en https://reactnative.dev`,
    eventId: 7, // <--- noticia vinculada al evento con id=7 (Ultra Festival)
  },
  {
    id: 4,
    title: "New Release 4 (sin evento)",
    imageUrl: "https://picsum.photos/700/400?random=4",
    description: `Esta noticia no tiene evento linkeado.`,
  },
  {
    id: 5,
    title: "New Release 5",
    imageUrl: "https://picsum.photos/700/400?random=5",
    description: `Check this link: https://docs.expo.dev`,
    eventId: 11, // <--- noticia vinculada al evento con id=11 (After LGBT Semanal)
  },
];

/** Retorna todas las noticias (mock). */
export function getAllNews(): NewsItem[] {
  return mockNews;
}

/** Devuelve la noticia con ese ID o null si no existe. */
export function getNewsById(id: number): NewsItem | null {
  const found = mockNews.find((news) => news.id === id);
  return found ?? null;
}
