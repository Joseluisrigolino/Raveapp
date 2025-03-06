// utils/eventHelpers.ts
import { EventItem } from "@/interfaces/EventProps";

const mockEvents: EventItem[] = [
  {
    id: 1,
    title: "Fiesta 1",
    date: "18/06/2025",
    timeRange: "10hs a 15hs",
    address: "Tandil 4341, Villa Ballester",
    description: "Lorem ipsum dolor sit amet...",
    imageUrl: "https://picsum.photos/700/400?random=1",
    type: "Rave",
  },
  {
    id: 2,
    title: "Fiesta 2",
    date: "20/07/2025",
    timeRange: "23hs a 06hs",
    address: "Av. Corrientes 1234, CABA",
    description: "Otra gran fiesta para bailar...",
    imageUrl: "https://picsum.photos/700/400?random=2",
    type: "Techno",
  },
  {
    id: 3,
    title: "Fiesta 3",
    date: "01/08/2025",
    timeRange: "16hs a 22hs",
    address: "Playa Grande, Mar del Plata",
    description: "Fiesta playera al atardecer...",
    imageUrl: "https://picsum.photos/700/400?random=3",
    type: "House",
  },
  {
    id: 4,
    title: "Fiesta 4",
    date: "10/09/2025",
    timeRange: "12hs a 20hs",
    address: "Calle Falsa 123, Rosario",
    description: "Evento de día con DJs locales...",
    imageUrl: "https://picsum.photos/700/400?random=4",
    type: "LGBT",
  },
  {
    id: 5,
    title: "Fiesta 5",
    date: "25/12/2025",
    timeRange: "00hs a 07hs",
    address: "Av. Siempre Viva 742, Springfield",
    description: "Fiesta navideña con sorpresas...",
    imageUrl: "https://picsum.photos/700/400?random=5",
    type: "Pop",
  },
];

/** Retorna todos los eventos (mock). */
export function getAllEvents(): EventItem[] {
  return mockEvents;
}

/** Retorna los eventos que coincidan con 'type'. 
 *  Si type está vacío, retorna todos. */
export function getEventsByType(type: string): EventItem[] {
  if (!type) {
    return mockEvents;
  }
  return mockEvents.filter(
    (ev) => ev.type.toLowerCase() === type.toLowerCase()
  );
}

/** NUEVO: Retorna un evento por su ID o null si no existe. */
export function getEventById(id: number): EventItem | null {
  const found = mockEvents.find((ev) => ev.id === id);
  return found ?? null;
}
