// utils/ticketMenuHelpers.ts

import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

const mockTicketMenu: TicketPurchasedMenuItem[] = [
  {
    id: 1,
    imageUrl: "https://picsum.photos/200?random=1",
    eventName: "Nombre del evento 1",
    date: "Fecha del evento 1",
    isFinished: false,
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/200?random=2",
    eventName: "Nombre del evento 2",
    date: "Fecha del evento 2",
    isFinished: true,
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/200?random=3",
    eventName: "Nombre del evento 3",
    date: "Fecha del evento 3",
    isFinished: false,
  },
  {
    id: 4,
    imageUrl: "https://picsum.photos/200?random=4",
    eventName: "Nombre del evento 4",
    date: "Fecha del evento 4",
    isFinished: false,
  },
  {
    id: 5,
    imageUrl: "https://picsum.photos/200?random=5",
    eventName: "Nombre del evento 5",
    date: "Fecha del evento 5",
    isFinished: true,
  },
  {
    id: 6,
    imageUrl: "https://picsum.photos/200?random=6",
    eventName: "Nombre del evento 6",
    date: "Fecha del evento 6",
    isFinished: false,
  },
];

/** Retorna todos los tickets comprados (mock). */
export function getAllPurchasedTickets(): TicketPurchasedMenuItem[] {
  return mockTicketMenu;
}

/** Dado un ID, retorna ese ticket, o null si no existe. */
export function getTicketMenuById(id: number): TicketPurchasedMenuItem | null {
  const found = mockTicketMenu.find((item) => item.id === id);
  return found ?? null;
}
