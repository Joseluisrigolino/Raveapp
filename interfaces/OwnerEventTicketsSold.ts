export interface TicketsSoldRow {
  type: string;
  price: number;
  quantity: number;
  total: number;
  inStock?: number;
}

export interface OwnerEventTicketsSoldData {
  eventId: number;
  eventName: string;
  lastUpdate: string;
  rows: TicketsSoldRow[];
  totalTickets: number;
  totalRevenue: number;
}

export default OwnerEventTicketsSoldData;
