// interfaces/TicketPurchasedMenuItem.ts

/**
 * Representa un ticket comprado, con nombre, fecha,
 * descripción y estado (finalizado o no).
 */
export interface TicketPurchasedMenuItem {
  id: number;
  imageUrl: string;
  eventName: string;
  date: string;
  description: string; // <--- Campo para mostrar la descripción
  isFinished: boolean;
}
