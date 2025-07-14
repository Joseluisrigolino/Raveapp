// styles/globalStyles.ts

export const COLORS = {
  // Colores principales
  primary: "#8E2DE2",         // Violeta vibrante para acentos y botones
  secondary: "#4A00E0",       // Violeta oscuro para estados secundarios

  // Estados
  positive: "#43A047",        // Verde para estados positivos (éxito)
  negative: "#E53935",        // Rojo para errores/alertas
  alternative: "#D93F87",     // Rosa para estados alternativos

  // Fondos & bordes
  backgroundLight: "#FFFFFF", // Blanco puro para fondo general
  cardBg: "#F8F8F8",          // Gris muy suave para fondo de tarjetas
  borderInput: "#E0E0E0",     // Gris claro para bordes de inputs

  // Tipografía
  textPrimary: "#2C2C2C",     // Gris muy oscuro para textos principales
  textSecondary: "#6C6C6C",   // Gris medio para subtítulos y textos secundarios

  // Iconos y otros
  alert: "#E53935",           // Rojo (alertas específicas)
  info: "#FF9800",            // Naranja para mensajes informativos
  starFilled: "#FFC107",      // Amarillo oro para estrellas
  starEmpty: "#BDBDBD",       // Gris claro para estrellas vacías

  // Etiquetas de eventos (tags)
  tagTechno: "#000000",
  tagHouse: "#5E5E5E",
  tagLGBT: "#44C5C0",
  tagAfter: "#D93F87",
};

export const FONTS = {
  titleBold: "Poppins-Bold",        // Titulares principales
  subTitleMedium: "Poppins-Medium", // Subtítulos y botones
  bodyRegular: "Roboto-Regular",    // Texto de párrafo
};

export const FONT_SIZES = {
  titleMain: 22,
  subTitle: 18,
  body: 14,
  button: 16,
  smallText: 14,
};

export const RADIUS = {
  card: 10, // Esquinas redondeadas para tarjetas y botones
};

export const SHADOWS = {
  card: "rgba(0, 0, 0, 0.1)", // Sombra suave para tarjetas
};

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
};
