// utils/validationEventHelpers.ts
import { EventToValidate } from "@/interfaces/EventToValidateProps";

const mockEventsToValidate: EventToValidate[] = [
  {
    id: 1,
    eventDate: "09/10/2025",
    creationDate: "02/12/2024",
    title: "Nombre del evento 1",
    type: "Techno",
    ownerUser: "Usuario1",
    isAfter: false,
    isLGBT: false,
    description: "Descripción del evento 1...",
    imageUrl: "https://picsum.photos/700/400?random=1",
    soundcloudUrl: "https://soundcloud.com/...",
    youtubeUrl: "https://youtube.com/...",
  },
  {
    id: 2,
    eventDate: "12/11/2025",
    creationDate: "02/12/2024",
    title: "Nombre del evento 2",
    type: "House",
    ownerUser: "Usuario2",
    isAfter: true,
    isLGBT: false,
    description: "Descripción del evento 2...",
    imageUrl: "https://picsum.photos/700/400?random=2",
  },
  {
    id: 3,
    eventDate: "01/01/2026",
    creationDate: "23/02/2025",
    title: "Nombre del evento 3",
    type: "Pop",
    ownerUser: "Usuario3",
    isAfter: false,
    isLGBT: true,
    description: "Descripción del evento 3...",
    imageUrl: "https://picsum.photos/700/400?random=3",
  },
  // Agrega los que necesites...
];

// Retorna todos los eventos pendientes de validación
export function getAllEventsToValidate(): EventToValidate[] {
  return mockEventsToValidate;
}

// Retorna un evento a validar por su ID
export function getEventToValidateById(id: number): EventToValidate | null {
  const found = mockEventsToValidate.find((ev) => ev.id === id);
  return found ?? null;
}
