// utils/ticketMenuHelpers.ts

import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

/**
 * Ajusta tu interfaz para incluir `description`:
 * 
 * export interface TicketPurchasedMenuItem {
 *   id: number;
 *   imageUrl: string;
 *   eventName: string; // o "title" si prefieres
 *   date: string;
 *   description: string;
 *   isFinished: boolean;
 * }
 */

const mockTicketMenu: TicketPurchasedMenuItem[] = [
  {
    id: 1,
    imageUrl: "https://picsum.photos/700/400?random=701",
    eventName: "Ultra Techno Festival",
    date: "05/04/2025 - 23:00hs",
    description: "Un festival de música techno de 1 día con DJs internacionales.",
    isFinished: false,
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/700/400?random=702",
    eventName: "Sunrise Beach Party",
    date: "10/04/2025 - 06:00hs",
    description: "Fiesta al amanecer en la playa, con música chill y house.",
    isFinished: true,
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/700/400?random=703",
    eventName: "Evento House #3",
    date: "15/04/2025 - 18:00hs",
    description: "Tarde de house y deep house, con artistas locales y food trucks.",
    isFinished: false,
  },
  {
    id: 4,
    imageUrl: "https://picsum.photos/700/400?random=704",
    eventName: "After LGBT Semanal",
    date: "21/04/2025 - 01:00hs",
    description: "After party inclusivo, con DJ sets de música electrónica.",
    isFinished: false,
  },
  {
    id: 5,
    imageUrl: "https://picsum.photos/700/400?random=705",
    eventName: "Fiesta Trance",
    date: "25/04/2025 - 22:00hs",
    description: "Noche trance con visuales psicodélicos y escenarios temáticos.",
    isFinished: true,
  },
  {
    id: 6,
    imageUrl: "https://picsum.photos/700/400?random=706",
    eventName: "Fiesta de la Semana",
    date: "30/04/2025 - 00:00hs",
    description: "La mejor fiesta semanal con DJs invitados y barra libre.",
    isFinished: false,
  },
];

/**
 * Retorna todos los tickets comprados (mock).
 * Útil para mostrar la lista en el menú.
 */
export function getAllPurchasedTickets(): TicketPurchasedMenuItem[] {
  return mockTicketMenu;
}

/**
 * Dado un ID, retorna ese ticket si existe, o null si no.
 * Útil para mostrar el detalle de un ticket específico.
 */
export function getTicketMenuById(id: number): TicketPurchasedMenuItem | null {
  const found = mockTicketMenu.find((item) => item.id === id);
  return found ?? null;
}
