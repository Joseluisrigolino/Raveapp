// interfaces/events.ts
import { Artist } from "@/app/artists/types/Artist";

export type EventType = "1d" | "2d" | "3d";
export type ArtistSel = Artist & { __isNew?: boolean };

export interface DayTickets {
  genQty: string;
  genPrice: string;
  ebGenQty: string;
  ebGenPrice: string;
  vipQty: string;
  vipPrice: string;
  ebVipQty: string;
  ebVipPrice: string;
}

export interface DaySchedule {
  start: Date;
  end: Date;
}

export interface DaySaleConfig {
  saleStart: Date;
  sellUntil: Date;
}
