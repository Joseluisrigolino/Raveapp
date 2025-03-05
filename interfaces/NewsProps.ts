// interfaces/NewsProps.ts

/** 
 * Define la estructura (tipado) de cada ítem de novedad.
 * Puedes agregar más campos según tus necesidades
 * (fecha, descripción, etc.).
 */
export interface NewsItem {
    id: number;
    title: string;
    imageUrl: string;
    // por ejemplo:
    // description?: string;
    // date?: string;
    // ...
  }
  