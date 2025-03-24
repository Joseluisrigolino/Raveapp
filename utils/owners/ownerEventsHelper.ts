// utils/ownerEventsHelper.ts
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";

const mockOwnerEvents: OwnerEventItem[] = [
  {
    id: 1,
    status: "vigente",
    imageUrl: "https://picsum.photos/100/100?random=1",
    date: "23/02/2025",
    eventName: "Nombre del evento 1",
  },
  {
    id: 2,
    status: "pendiente",
    imageUrl: "https://picsum.photos/100/100?random=2",
    date: "24/03/2025",
    eventName: "Nombre del evento 2",
    isMultipleDays: true,
  },
  {
    id: 3,
    status: "finalizado",
    imageUrl: "https://picsum.photos/100/100?random=3",
    date: "10/01/2025",
    eventName: "Nombre del evento 3",
  },
  {
    id: 4,
    status: "vigente",
    imageUrl: "https://picsum.photos/100/100?random=4",
    date: "15/04/2025",
    eventName: "Nombre del evento 4",
  },
  {
    id: 5,
    status: "vigente",
    imageUrl: "https://picsum.photos/100/100?random=5",
    date: "25/05/2025",
    eventName: "EVENTO DE 3 DÍAS",
    isMultipleDays: true,
  },
];

// NUEVA FUNCIÓN: retorna datos "completos" del evento para edición
export function getOwnerEventById(id: number): OwnerEventItem | null {
  const found = mockOwnerEvents.find((ev) => ev.id === id);
  return found ?? null;
}

export function getOwnerEvents(): OwnerEventItem[] {
  return mockOwnerEvents;
}
