// utils/news/newsHelpers.ts

import { NewsItem } from "@/interfaces/NewsProps";
import { getAllEvents, getEventById } from "@/utils/events/eventHelpers"; 
// ^ Podrías importar si quisieras usarlo internamente, 
//   pero en este ejemplo no hace falta para la creación de mockNews.

const mockNews: NewsItem[] = [
  {
    idNoticia: "1",
    id: 1,
    titulo: "New Release 1",
    imagen: "https://picsum.photos/700/400?random=1",
    contenido: `Llegó el viernes y se viene finde largo...
https://open.spotify.com/playlist/3PanXbcy6jmHBtJh2dvFIB
Visita nuestro sitio: https://example.com`,
    dtPublicado: new Date().toISOString(),
    urlEvento: "https://raveapp.com.ar/evento/2",
  },
  {
    idNoticia: "2",
    id: 2,
    titulo: "New Release 2",
    imagen: "https://picsum.photos/700/400?random=2",
    contenido: `Otra noticia con un link: https://expo.dev`,
    dtPublicado: new Date().toISOString(),
  },
  {
    idNoticia: "3",
    id: 3,
    titulo: "New Release 3",
    imagen: "https://picsum.photos/700/400?random=3",
    contenido: `Descubre más en https://reactnative.dev`,
    dtPublicado: new Date().toISOString(),
    urlEvento: "https://raveapp.com.ar/evento/7",
  },
  {
    idNoticia: "4",
    id: 4,
    titulo: "New Release 4 (sin evento)",
    imagen: "https://picsum.photos/700/400?random=4",
    contenido: `Esta noticia no tiene evento linkeado.`,
    dtPublicado: new Date().toISOString(),
  },
  {
    idNoticia: "5",
    id: 5,
    titulo: "New Release 5",
    imagen: "https://picsum.photos/700/400?random=5",
    contenido: `Check this link: https://docs.expo.dev`,
    dtPublicado: new Date().toISOString(),
    urlEvento: "https://raveapp.com.ar/evento/11",
  },
];

/** Retorna todas las noticias (mock). */
export function getAllNews(): NewsItem[] {
  return mockNews;
}

/** Devuelve la noticia con ese ID o null si no existe. */
export function getNewsById(id: number): NewsItem | null {
  const found = mockNews.find((news) => news.id === id || Number(news.idNoticia) === id);
  return found ?? null;
}
