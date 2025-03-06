// interfaces/NewsProps.ts

/** 
 * Define la estructura (tipado) de cada ítem de novedad.
 */
export interface NewsItem {
  id: number;
  title: string;
  imageUrl: string;
  description?: string; 
  // date?: string;
  // author?: string;
  // etc...
}
