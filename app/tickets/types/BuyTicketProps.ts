// interfaces/BuyTicketProps.ts

/** Datos del ticket que se está comprando */
export interface BuyTicketData {
    eventId: number;
    eventName: string;
    eventImageUrl: string;
    ticketType: string; // "Entrada general", "VIP", etc.
    price: number;      // Precio unitario
    quantity: number;   // Cantidad de tickets
    serviceFee: number; // Cargo de servicio
  }
  
  /** Datos del comprador */
  export interface BuyerInfo {
    firstName: string;
    lastName: string;
    idType: string;        // "DNI", "Pasaporte", etc.
    idNumber: string;
    email: string;
    confirmEmail: string;
    phone: string;
  }
  