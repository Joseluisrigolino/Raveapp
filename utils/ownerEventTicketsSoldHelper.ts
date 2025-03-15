// utils/ownerEventsTicketsSoldHelper.ts
import {
    OwnerEventTicketsSoldData,
    TicketsSoldRow,
  } from "@/interfaces/OwnerEventTicketsSold";
  
  const mockTicketsSold: OwnerEventTicketsSoldData[] = [
    {
      eventId: 1,
      eventName: "Nombre de Evento 1",
      lastUpdate: "12/12/2024 a las 18:03hs",
      rows: [
        {
          type: "General - Early Bird",
          price: 2000,
          quantity: 100,
          total: 200000,
          inStock: 0,
        },
        {
          type: "General",
          price: 5000,
          quantity: 100,
          total: 500000,
          inStock: 100,
        },
        {
          type: "VIP - Early Bird",
          price: 2500,
          quantity: 50,
          total: 125000,
          inStock: 0,
        },
        {
          type: "VIP",
          price: 7000,
          quantity: 20,
          total: 140000,
          inStock: 5,
        },
      ],
      totalTickets: 270, // Ejemplo
      totalRevenue: 965000, // Ejemplo (suma de total)
    },
    {
      eventId: 3,
      eventName: "Nombre de Evento 2",
      lastUpdate: "15/01/2025 a las 14:20hs",
      rows: [
        {
          type: "General",
          price: 3000,
          quantity: 80,
          total: 240000,
          inStock: 20,
        },
      ],
      totalTickets: 80,
      totalRevenue: 240000,
    },
  ];
  
  /** Retorna la info de entradas vendidas de un evento por su ID, o null si no existe */
  export function getTicketsSoldDataById(
    eventId: number
  ): OwnerEventTicketsSoldData | null {
    const found = mockTicketsSold.find((ev) => ev.eventId === eventId);
    return found ?? null;
  }
  