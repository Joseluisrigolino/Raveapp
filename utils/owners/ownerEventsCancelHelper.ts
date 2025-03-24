// utils/ownerEventsCancelHelper.ts
import { OwnerEventCancelItem } from "@/interfaces/OwnerEventCancelItem";

// Mock local
const mockCancelEvents: OwnerEventCancelItem[] = [
  {
    id: 1,
    eventName: "Nombre de evento 1",
    ticketsSold: [
      { type: "Entrada General", quantity: 20, price: 5000 },
      { type: "Entradas Vip", quantity: 15, price: 7000 },
    ],
    totalRefund: 205000,
  },
  {
    id: 2,
    eventName: "Nombre de evento 2",
    ticketsSold: [
      { type: "Entrada General", quantity: 10, price: 4000 },
      { type: "Entradas Vip", quantity: 5, price: 8000 },
    ],
    totalRefund: 90000,
  },
  // Agrega más según necesites...
];

/** Retorna la info de cancelación de un evento por ID, o null si no existe */
export function getEventCancellationDataById(
  id: number
): OwnerEventCancelItem | null {
  const found = mockCancelEvents.find((ev) => ev.id === id);
  return found ?? null;
}
