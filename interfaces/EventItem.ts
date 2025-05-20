// interfaces/EventProps.ts
export interface EventItem {
  id: string;           // Antes era number, ahora string para GUID
  title: string;
  date: string;         // "18/06/2025"
  timeRange: string;    // "10hs a 15hs"
  address: string;
  description: string;
  imageUrl: string;
  type: string;         // "Rave", "Techno", "House", etc.
}
