// interfaces/OwnerEventTicketsSold.ts

/** Representa cada fila de la tabla: tipo, precio, cantidad, total, stock */
export interface TicketsSoldRow {
    type: string;       // "General - Early Bird", "General", "VIP - Early Bird", etc.
    price: number;      // Precio unitario
    quantity: number;   // Cantidad vendida
    total: number;      // price * quantity
    inStock: number;    // cuántos quedan
  }
  
  /** Estructura general de las entradas vendidas para un evento. */
  export interface OwnerEventTicketsSoldData {
    eventId: number;
    eventName: string;
    lastUpdate: string;        // "12/12/2024 a las 18:03hs"
    rows: TicketsSoldRow[];    // la tabla
    totalTickets: number;      // total de entradas vendidas (sum de quantity)
    totalRevenue: number;      // total recaudado (sum de total)
  }
  