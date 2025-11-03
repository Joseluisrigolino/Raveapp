// utils/eventFavHelpers.ts
import { ExtendedEventItem } from "@/app/events/apis/eventHelpers";

/**
 * Aquí defines tus eventos favoritos. Pueden ser un subset
 * o los mismos, según prefieras. Ejemplo: IDs 2, 5 y 11 son favoritos.
 */
const mockFavEvents: ExtendedEventItem[] = [
  {
    id: 2,
    title: "Techno Day (Favorito)",
    date: "10/04/2025",
    timeRange: "23hs a 06hs",
    address: "Av. Corrientes 999, Ciudad B",
    description: "Un evento de 1 día, recurrente cada año.",
    imageUrl: "https://picsum.photos/700/400?random=102",
    type: "Techno",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 30,
        genEarlyPrice: 1500,
        vipEarlyQty: 10,
        vipEarlyPrice: 2500,
        genQty: 70,
        genPrice: 3000,
        vipQty: 0,
        vipPrice: 0,
      },
    ],
    isRecurrent: true,
    isAfter: true,
    isLGBT: false,
  },
  {
    id: 5,
    title: "Evento 2 Días #2 (Favorito)",
    date: "25/04/2025",
    timeRange: "10hs a 20hs",
    address: "Parque de la Costa, Villa Ballester",
    description: "Evento al aire libre, con DJs locales e internacionales.",
    imageUrl: "https://picsum.photos/700/400?random=105",
    type: "LGBT",
    days: 2,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 0,
        genEarlyPrice: 0,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 100,
        genPrice: 2800,
        vipQty: 30,
        vipPrice: 4500,
      },
      {
        dayNumber: 2,
        genEarlyQty: 50,
        genEarlyPrice: 1300,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 0,
        genPrice: 0,
        vipQty: 20,
        vipPrice: 4800,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: true,
  },
  {
    id: 11,
    title: "After LGBT Semanal (Favorito)",
    date: "21/03/2025",
    timeRange: "01hs a 06hs",
    address: "Salón Diverso, Ciudad K",
    description: "Un after LGBT que sucede esta misma semana. ¡Imperdible!",
    imageUrl: "https://picsum.photos/700/400?random=111",
    type: "Electrónica",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 10,
        genEarlyPrice: 1200,
        vipEarlyQty: 5,
        vipEarlyPrice: 1800,
        genQty: 30,
        genPrice: 2500,
        vipQty: 15,
        vipPrice: 4000,
      },
    ],
    isRecurrent: false,
    isAfter: true,
    isLGBT: true,
  },
];

/** Retorna todos los eventos FAVORITOS (mock). */
export function getAllFavEvents(): ExtendedEventItem[] {
  return mockFavEvents;
}
