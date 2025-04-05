// interfaces/NewsProps.ts
export interface NewsItem {
  idNoticia: string;
  titulo: string;
  contenido: string;
  imagen: string | null;
  dtPublicado: string;
  eventId?: number; // o string, según corresponda
}
