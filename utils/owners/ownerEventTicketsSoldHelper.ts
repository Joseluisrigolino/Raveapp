// Helper to provide (mock) tickets-sold data for owners.
// The project previously referenced this file; create a small deterministic
// implementation so screens that call it (e.g., CancelarEventoPantalla) don't crash.

import { OwnerEventTicketsSoldData, TicketsSoldRow } from "@/interfaces/OwnerEventTicketsSold";

export function getTicketsSoldDataById(eventId: number): OwnerEventTicketsSoldData | null {
  try {
    // Deterministic mock based on id so data looks different per event
    const seed = Math.abs(Number(eventId) || 0);
    if (!isFinite(seed)) return null;

    const baseQty = (seed * 13) % 200; // 0-199
    const rows: TicketsSoldRow[] = [
      { type: "General", price: 5000, quantity: Math.max(0, baseQty), total: 5000 * Math.max(0, baseQty), inStock: Math.max(0, 200 - baseQty) },
      { type: "VIP", price: 12000, quantity: Math.max(0, Math.floor(baseQty / 4)), total: 12000 * Math.max(0, Math.floor(baseQty / 4)), inStock: Math.max(0, 50 - Math.floor(baseQty / 4)) },
    ];

    const totalTickets = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    const totalRevenue = rows.reduce((s, r) => s + (r.total || (r.price * (r.quantity || 0))), 0);

    return {
      eventId: seed,
      eventName: `Evento #${seed}`,
      lastUpdate: new Date().toLocaleString(),
      rows,
      totalTickets,
      totalRevenue,
    } as OwnerEventTicketsSoldData;
  } catch (e) {
    return null;
  }
}

export default { getTicketsSoldDataById };
