import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

// Small deterministic mock provider for ticket menu items.
// Returns a TicketPurchasedMenuItem for a numeric id, or null if invalid.
export function getTicketMenuById(id: number): TicketPurchasedMenuItem | null {
  const n = Number(id || 0);
  if (!isFinite(n) || n <= 0) return null;

  const seed = Math.abs(n);
  const eventName = `Evento #${seed}`;
  const date = new Date(Date.now() - (seed % 10) * 24 * 3600 * 1000).toLocaleString();
  const imageUrl = ""; // no remote image by default
  const description = `Descripción simulada para ${eventName}. Gracias por participar.`;
  const isFinished = seed % 2 === 0; // alternate finished state

  return {
    id: seed,
    imageUrl,
    eventName,
    date,
    description,
    isFinished,
  } as TicketPurchasedMenuItem;
}

export default { getTicketMenuById };
