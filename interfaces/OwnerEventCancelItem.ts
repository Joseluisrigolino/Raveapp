// interfaces/OwnerEventCancelItem.ts

/**
 * Representa la información necesaria para cancelar un evento:
 * - id, nombre
 * - listado de entradas vendidas (tipo, cantidad, precio)
 * - total a devolver
 */
export interface TicketSoldInfo {
    type: string;      // "Entrada General", "VIP", etc.
    quantity: number;  // 20, 15, etc.
    price: number;     // 5000, 7000, etc.
  }
  
  export interface OwnerEventCancelItem {
    id: number;
    eventName: string;
    ticketsSold: TicketSoldInfo[];
    totalRefund: number; // Monto total a devolver
  }
  