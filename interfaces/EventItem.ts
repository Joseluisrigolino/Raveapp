// interfaces/EventProps.ts

export interface EventItem {
  id: number;
  title: string;
  date: string;       // "18/06/2025"
  timeRange: string;  // "10hs a 15hs"
  address: string;
  description: string;
  imageUrl: string;
  type: string;       // <-- NUEVO: "Rave", "Techno", "House", etc.
}
