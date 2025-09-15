// styles/globalStyles.ts
// Punto único de verdad para tokens de UI.
// Usar SIEMPRE:
//   import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export const COLORS = {
  // Colores principales
  primary: "#8E2DE2",
  secondary: "#4A00E0",

  // Estados
  positive: "#43A047",
  negative: "#E53935",
  alternative: "#D93F87",

  // Fondos & bordes
  backgroundLight: "#FFFFFF",
  cardBg: "#F8F8F8",
  borderInput: "#E0E0E0",

  // Tipografía
  textPrimary: "#2C2C2C",
  textSecondary: "#6C6C6C",

  // Iconos y otros
  alert: "#E53935",
  info: "#FF9800",
  starFilled: "#FFC107",
  starEmpty: "#BDBDBD",

  // Etiquetas de eventos
  tagTechno: "#000000",
  tagHouse: "#5E5E5E",
  tagLGBT: "#44C5C0",
  tagAfter: "#D93F87",
} as const;

export const FONTS = {
  titleBold: "Poppins-Bold",
  subTitleMedium: "Poppins-Medium",
  bodyRegular: "Roboto-Regular",
} as const;

export const FONT_SIZES = {
  titleMain: 22,
  subTitle: 18,
  body: 14,
  button: 16,
  smallText: 14,
} as const;

export const RADIUS = {
  card: 10,
  chip: 999,
} as const;

export const SHADOWS = {
  cardColor: "rgba(0, 0, 0, 0.1)",
  cardOffsetX: 0,
  cardOffsetY: 2,
  cardRadius: 8,
  cardElevation: 1,
} as const;

const theme = {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
} as const;

export default theme;
