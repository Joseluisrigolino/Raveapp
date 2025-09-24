// interfaces/OwnerEventItem.ts
export type EventStatus = "vigente" | "pendiente" | "finalizado";

export interface OwnerEventItem {
  id: number;
  status: EventStatus;
  imageUrl: string;
  date: string;      // "23/02/2025"
  eventName: string; // "Nombre del evento"
  isMultipleDays?: boolean; // Para mostrar "EVENTO DE 3 DÍAS" si es true
  timeRange?: string;
}
