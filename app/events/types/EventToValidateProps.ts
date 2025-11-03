// interfaces/EventToValidateProps.ts
export interface EventToValidate {
    id: number;
    eventDate: string;       // Fecha del evento
    creationDate: string;    // Fecha de creación
    title: string;           // Nombre del evento
    type: string;            // Género (Techno, House, etc.)
    ownerUser: string;       // Usuario creador
    isAfter: boolean;
    isLGBT: boolean;
    description: string;
    imageUrl: string;
    soundcloudUrl?: string;
    youtubeUrl?: string;
    // ...cualquier otro campo que necesites
  }
  