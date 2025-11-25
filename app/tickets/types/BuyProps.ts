// app/tickets/services/buy/types.ts

export interface BuyerInfo {
  firstName: string;
  lastName: string;
  idType: string;
  idNumber: string;
  email: string;
  phone: string;
  birthDate: string; // DD/MM/YYYY
}

export interface BillingAddress {
  direccion: string;
  localidad: string;
  municipio: string;
  provincia: string;
}

export interface SelectedTickets {
  [key: string]: number;
}

export interface GroupedSelectionItem {
  idEntrada: string;
  label: string;
  qty: number;
  price: number;
}

export type GroupedSelectionMap = Record<string, GroupedSelectionItem[]>;
