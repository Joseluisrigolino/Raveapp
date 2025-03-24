// hooks/useEventDetail.ts
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Linking } from "react-native";

import { getEventById, ExtendedEventItem } from "@/utils/eventHelpers";
import { ReviewItem } from "@/interfaces/ReviewProps";

/**
 * Ejemplo de reseñas mock. O puedes importarlas de un "reviewsMock.ts" aparte.
 */
const mockReviews: ReviewItem[] = [
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

/** Representa la cantidad seleccionada de cada tipo de entrada. */
interface SelectedTickets {
  [key: string]: number; // Ej: "day1-genEarly" -> 2
}

/**
 * Custom hook que maneja toda la lógica de la pantalla "EventScreen":
 *  - Cargar el evento desde un ID
 *  - Manejar estado "favorito"
 *  - Manejar selección de tickets y subtotal
 *  - Navegar a BuyTicketScreen con la selección
 */
export function useEventDetail(eventId?: string) {
  const router = useRouter();

  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Estado para la selección de entradas
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});

  // Cargar el evento al montar
  useEffect(() => {
    if (eventId) {
      const found = getEventById(Number(eventId));
      setEventData(found);
    }
  }, [eventId]);

  // Favorito
  function toggleFavorite() {
    setIsFavorite((prev) => !prev);
  }

  // Abrir Google Maps
  function openMap(address: string) {
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    Linking.openURL(url);
  }

  // Actualizar la selección de tickets
  function updateTicketCount(key: string, delta: number) {
    setSelectedTickets((prev) => {
      const currentVal = prev[key] || 0;
      const newVal = currentVal + delta;
      if (newVal < 0) return prev; // no bajar de 0
      return { ...prev, [key]: newVal };
    });
  }

  // Calcular subtotal
  function calculateSubtotal(): number {
    if (!eventData) return 0;
    let subtotal = 0;
    eventData.ticketsByDay.forEach((dayInfo) => {
      const baseKey = `day${dayInfo.dayNumber}`;

      // Generales Early Birds
      if (dayInfo.genEarlyQty > 0) {
        const key = `${baseKey}-genEarly`;
        const qty = selectedTickets[key] || 0;
        subtotal += qty * dayInfo.genEarlyPrice;
      }
      // VIP Early Birds
      if (dayInfo.vipEarlyQty > 0) {
        const key = `${baseKey}-vipEarly`;
        const qty = selectedTickets[key] || 0;
        subtotal += qty * dayInfo.vipEarlyPrice;
      }
      // Generales
      if (dayInfo.genQty > 0) {
        const key = `${baseKey}-gen`;
        const qty = selectedTickets[key] || 0;
        subtotal += qty * dayInfo.genPrice;
      }
      // VIP
      if (dayInfo.vipQty > 0) {
        const key = `${baseKey}-vip`;
        const qty = selectedTickets[key] || 0;
        subtotal += qty * dayInfo.vipPrice;
      }
    });
    return subtotal;
  }

  const subtotal = calculateSubtotal();

  // Navegar a BuyTicketScreen
  function handleBuyPress() {
    if (!eventData) return;
    // Pasamos la selección como JSON en la URL (codificada).
    const selectionJson = encodeURIComponent(JSON.stringify(selectedTickets));
    router.push(
      `/main/TicketsScreens/BuyTicketScreen?id=${eventData.id}&selection=${selectionJson}`
    );
  }

  return {
    eventData,
    isFavorite,
    toggleFavorite,
    selectedTickets,
    updateTicketCount,
    subtotal,
    handleBuyPress,
    openMap,
    mockReviews, // Exponemos las reseñas mock, si deseas
  };
}
