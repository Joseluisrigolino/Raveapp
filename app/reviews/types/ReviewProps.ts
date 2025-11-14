// interfaces/ReviewProps.ts

export interface ReviewItem {
    id: number;
    user: string;
    comment: string;
    rating: number;
  daysAgo: number; // legacy support
  dateISO?: string; // fecha real de la reseña si está disponible (ISO o parseable por Date)
  }
  