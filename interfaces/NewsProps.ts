// interfaces/NewsProps.ts
export interface NewsItem {
  idNoticia: string;
  titulo: string;
  contenido: string;
  imagen?: string | null;
  dtPublicado: string;
  urlEvento?: string | null;
  // legacy numeric id (mock helpers may use numeric ids)
  id?: number;
}
