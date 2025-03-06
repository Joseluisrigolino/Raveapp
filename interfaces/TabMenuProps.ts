// interfaces/TabMenuProps.ts

/** Representa cada pestaña del submenú. */
export interface TabItem {
    /** Texto que se mostrará en la pestaña. */
    label: string;
    /** Ruta a la que navegará la pestaña (para expo-router). */
    route: string;
    /** Indica si esta pestaña está activa en la pantalla actual. */
    isActive: boolean;
  }
  
  /** Props para el componente de submenú (TabMenuComponent). */
  export interface TabMenuProps {
    tabs: TabItem[];
  }
  