// utils/eventHelpers.ts
import { ReviewItem } from "@/interfaces/ReviewProps";

/** Representa la información de tickets para un día específico. */
interface DayTickets {
  dayNumber: number;
  genEarlyQty: number;
  genEarlyPrice: number;
  vipEarlyQty: number;
  vipEarlyPrice: number;
  genQty: number;
  genPrice: number;
  vipQty: number;
  vipPrice: number;
}

/** Extiende la interfaz EventItem (puedes ajustarla a tu gusto). */
export interface ExtendedEventItem {
  id: number;
  title: string;
  date: string;         // "dd/mm/yyyy"
  timeRange: string;    // "HHhs a HHhs"
  address: string;
  description: string;
  imageUrl: string;
  type: string;         // Rave, Techno, etc.
  days: number;         // 1, 2 o 3
  ticketsByDay: DayTickets[];
  isRecurrent: boolean; // true => evento recurrente (mostrar reseñas)
  isAfter: boolean;     // true => es un after
  isLGBT: boolean;      // true => es evento LGBT
}

/** Arreglo de reseñas de ejemplo (podrías moverlo a otro archivo). */
export const mockReviews: ReviewItem[] = [
  {
    id: 1,
    user: "Usuario99",
    comment: "Me gustó mucho la fiesta. Gente muy agradable. Volvería a ir.",
    rating: 5,
    daysAgo: 6,
  },
  {
    id: 2,
    user: "Usuario27",
    comment: "Buena organización, pero faltó variedad de comida.",
    rating: 4,
    daysAgo: 6,
  },
];

const mockEvents: ExtendedEventItem[] = [
  // 1) Evento de 1 día, NO recurrente (sin VIP)
  {
    id: 1,
    title: "Evento Single Day #1",
    date: "05/04/2025",
    timeRange: "12hs a 18hs",
    address: "Calle 123, Ciudad A",
    description: "Evento de un solo día, sin VIP.",
    imageUrl: "https://picsum.photos/700/400?random=101",
    type: "Rave",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 50,
        genEarlyPrice: 1000,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 100,
        genPrice: 2000,
        vipQty: 0,
        vipPrice: 0,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: false,
  },

  // 2) Evento de 1 día, recurrente (con reseñas)
  {
    id: 2,
    title: "Techno Day",
    date: "10/04/2025",
    timeRange: "23hs a 06hs",
    address: "Av. Corrientes 999, Ciudad B",
    description: "Un evento de 1 día, recurrente cada año.",
    imageUrl: "https://picsum.photos/700/400?random=102",
    type: "Techno",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 30,
        genEarlyPrice: 1500,
        vipEarlyQty: 10,
        vipEarlyPrice: 2500,
        genQty: 70,
        genPrice: 3000,
        vipQty: 0,
        vipPrice: 0,
      },
    ],
    isRecurrent: true,
    isAfter: true,    // Ej: after
    isLGBT: false,
  },

  // 3) Evento de 1 día, NO recurrente
  {
    id: 3,
    title: "Sunset Beach",
    date: "15/04/2025",
    timeRange: "16hs a 22hs",
    address: "Playa del Sol, Ciudad C",
    description: "Fiesta en la playa con música house.",
    imageUrl: "https://picsum.photos/700/400?random=103",
    type: "House",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 0,
        genEarlyPrice: 0,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 100,
        genPrice: 2500,
        vipQty: 30,
        vipPrice: 4000,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: true,     // Ej: LGBT
  },

  // 4) Evento de 2 días, recurrente (con reseñas)
  {
    id: 4,
    title: "Festival de 2 Días #1",
    date: "20/04/2025",
    timeRange: "14hs a 22hs",
    address: "Estadio Central, Ciudad D",
    description: "Primer festival de 2 días, recurrente cada año.",
    imageUrl: "https://picsum.photos/700/400?random=104",
    type: "Pop",
    days: 2,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 20,
        genEarlyPrice: 1200,
        vipEarlyQty: 5,
        vipEarlyPrice: 1800,
        genQty: 80,
        genPrice: 3000,
        vipQty: 20,
        vipPrice: 5000,
      },
      {
        dayNumber: 2,
        genEarlyQty: 30,
        genEarlyPrice: 1500,
        vipEarlyQty: 10,
        vipEarlyPrice: 2200,
        genQty: 90,
        genPrice: 3200,
        vipQty: 25,
        vipPrice: 5200,
      },
    ],
    isRecurrent: true,
    isAfter: false,
    isLGBT: false,
  },

  // 5) Evento de 2 días, NO recurrente
  {
    id: 5,
    title: "Evento 2 Días #2",
    date: "25/04/2025",
    timeRange: "10hs a 20hs",
    address: "Parque de la Costa, Ciudad E",
    description: "Evento al aire libre, con DJs locales e internacionales.",
    imageUrl: "https://picsum.photos/700/400?random=105",
    type: "LGBT",
    days: 2,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 0,
        genEarlyPrice: 0,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 100,
        genPrice: 2800,
        vipQty: 30,
        vipPrice: 4500,
      },
      {
        dayNumber: 2,
        genEarlyQty: 50,
        genEarlyPrice: 1300,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 0,
        genPrice: 0,
        vipQty: 20,
        vipPrice: 4800,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: true,
  },

  // 6) Evento de 2 días, NO recurrente
  {
    id: 6,
    title: "Weekend Beats",
    date: "30/04/2025",
    timeRange: "20hs a 06hs",
    address: "Río Grande, Ciudad F",
    description: "Evento nocturno de 2 días con música electrónica.",
    imageUrl: "https://picsum.photos/700/400?random=106",
    type: "Electrónica",
    days: 2,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 40,
        genEarlyPrice: 1000,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 60,
        genPrice: 2000,
        vipQty: 0,
        vipPrice: 0,
      },
      {
        dayNumber: 2,
        genEarlyQty: 0,
        genEarlyPrice: 0,
        vipEarlyQty: 10,
        vipEarlyPrice: 2500,
        genQty: 80,
        genPrice: 2500,
        vipQty: 15,
        vipPrice: 4000,
      },
    ],
    isRecurrent: false,
    isAfter: true,
    isLGBT: false,
  },

  // 7) Evento de 3 días, recurrente
  {
    id: 7,
    title: "Ultra Festival",
    date: "05/05/2025",
    timeRange: "12hs a 23hs",
    address: "Campo Grande, Ciudad G",
    description: "Festival de 3 días, recurrente cada año, con varios artistas.",
    imageUrl: "https://picsum.photos/700/400?random=107",
    type: "Rave",
    days: 3,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 30,
        genEarlyPrice: 1600,
        vipEarlyQty: 10,
        vipEarlyPrice: 2200,
        genQty: 80,
        genPrice: 3200,
        vipQty: 25,
        vipPrice: 4800,
      },
      {
        dayNumber: 2,
        genEarlyQty: 40,
        genEarlyPrice: 1700,
        vipEarlyQty: 10,
        vipEarlyPrice: 2500,
        genQty: 90,
        genPrice: 3500,
        vipQty: 30,
        vipPrice: 5200,
      },
      {
        dayNumber: 3,
        genEarlyQty: 50,
        genEarlyPrice: 1800,
        vipEarlyQty: 15,
        vipEarlyPrice: 2800,
        genQty: 100,
        genPrice: 3800,
        vipQty: 35,
        vipPrice: 5500,
      },
    ],
    isRecurrent: true,
    isAfter: true,
    isLGBT: false,
  },

  // 8) Evento de 3 días, NO recurrente
  {
    id: 8,
    title: "Dance Marathon",
    date: "12/05/2025",
    timeRange: "20hs a 08hs",
    address: "Polideportivo, Ciudad H",
    description: "Maratón de baile de 3 días, no recurrente.",
    imageUrl: "https://picsum.photos/700/400?random=108",
    type: "Trance",
    days: 3,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 0,
        genEarlyPrice: 0,
        vipEarlyQty: 10,
        vipEarlyPrice: 2000,
        genQty: 70,
        genPrice: 3000,
        vipQty: 0,
        vipPrice: 0,
      },
      {
        dayNumber: 2,
        genEarlyQty: 40,
        genEarlyPrice: 1200,
        vipEarlyQty: 0,
        vipEarlyPrice: 0,
        genQty: 80,
        genPrice: 2800,
        vipQty: 30,
        vipPrice: 5000,
      },
      {
        dayNumber: 3,
        genEarlyQty: 40,
        genEarlyPrice: 1300,
        vipEarlyQty: 15,
        vipEarlyPrice: 2600,
        genQty: 90,
        genPrice: 3200,
        vipQty: 20,
        vipPrice: 5200,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: false,
  },

  // 9) Evento de 3 días, recurrente
  {
    id: 9,
    title: "Lollapalozza (Ejemplo) 2025",
    date: "25/05/2025",
    timeRange: "12hs a 00hs",
    address: "Hipódromo, Ciudad I",
    description: "Festival internacional de 3 días, recurrente cada año.",
    imageUrl: "https://picsum.photos/700/400?random=109",
    type: "Pop",
    days: 3,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 60,
        genEarlyPrice: 2000,
        vipEarlyQty: 20,
        vipEarlyPrice: 3000,
        genQty: 100,
        genPrice: 4000,
        vipQty: 50,
        vipPrice: 6500,
      },
      {
        dayNumber: 2,
        genEarlyQty: 60,
        genEarlyPrice: 2200,
        vipEarlyQty: 25,
        vipEarlyPrice: 3200,
        genQty: 120,
        genPrice: 4500,
        vipQty: 55,
        vipPrice: 7000,
      },
      {
        dayNumber: 3,
        genEarlyQty: 70,
        genEarlyPrice: 2500,
        vipEarlyQty: 30,
        vipEarlyPrice: 3500,
        genQty: 130,
        genPrice: 5000,
        vipQty: 60,
        vipPrice: 7500,
      },
    ],
    isRecurrent: true,
    isAfter: false,
    isLGBT: false,
  },

  // 10) Evento que cae en la semana actual (ejemplo)
  {
    id: 10,
    title: "Fiesta de la Semana",
    date: "21/03/2025", // Ajusta si deseas otra fecha
    timeRange: "22hs a 04hs",
    address: "Salón Primavera, Ciudad J",
    description: "Evento especial que sucede esta misma semana.",
    imageUrl: "https://picsum.photos/700/400?random=110",
    type: "Electrónica",
    days: 1,
    ticketsByDay: [
      {
        dayNumber: 1,
        genEarlyQty: 20,
        genEarlyPrice: 1000,
        vipEarlyQty: 5,
        vipEarlyPrice: 1500,
        genQty: 50,
        genPrice: 2000,
        vipQty: 10,
        vipPrice: 3000,
      },
    ],
    isRecurrent: false,
    isAfter: false,
    isLGBT: false,
  },
  // ...
{
  id: 11,
  title: "After LGBT Semanal",
  date: "21/03/2025", // Ajusta si quieres otra fecha de la semana
  timeRange: "01hs a 06hs",
  address: "Salón Diverso, Ciudad K",
  description: "Un after LGBT que sucede esta misma semana. ¡Imperdible!",
  imageUrl: "https://picsum.photos/700/400?random=111",
  type: "Electrónica",
  days: 1,
  ticketsByDay: [
    {
      dayNumber: 1,
      genEarlyQty: 10,
      genEarlyPrice: 1200,
      vipEarlyQty: 5,
      vipEarlyPrice: 1800,
      genQty: 30,
      genPrice: 2500,
      vipQty: 15,
      vipPrice: 4000,
    },
  ],
  isRecurrent: false,
  isAfter: true,   // Indica que es after
  isLGBT: true,    // Indica que es LGBT
},

];

/** Retorna todos los eventos. */
export function getAllEvents(): ExtendedEventItem[] {
  return mockEvents;
}

/** Retorna un evento por ID, o null si no existe. */
export function getEventById(id: number): ExtendedEventItem | null {
  return mockEvents.find((ev) => ev.id === id) ?? null;
}

