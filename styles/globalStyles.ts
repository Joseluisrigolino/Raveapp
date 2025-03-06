// styles/globalStyles.ts

export const COLORS = {
  primary: "#1E88E5",         // Azul oscuro
  secondary: "#121212",       // Negro
  positive: "#43A047",        // Verde
  negative: "#E53935",        // Rojo
  alternative: "#1E88E5",     // Azul oscuro (edición)
  backgroundLight: "#F5F5F5", // Gris claro principal
  cardBg: "#FFFFFF",          // Blanco (tarjetas/input fondo)
  borderInput: "#BDBDBD",     // Gris claro
  textPrimary: "#212121",     // Gris oscuro
  textSecondary: "#757575",   // Gris medio
  alert: "#E53935",           // Rojo
  info: "#FF9800",            // Naranja
  starFilled: "#FFC107",      // Amarillo oro
  starEmpty: "#BDBDBD",       // Gris claro
};

export const FONTS = {
  titleBold: "Poppins-Bold",     // 22-24px
  subTitleMedium: "Poppins-Medium", // 18-20px (también Botones/Tabs 16-18px)
  bodyRegular: "Roboto-Regular", // 14-16px
};

export const FONT_SIZES = {
  titleMain: 22,
  subTitle: 18,
  body: 14,
  button: 16,
  smallText: 14,
};

export const RADIUS = {
  card: 10, // 10-15px
};

export const SHADOWS = {
  card: "rgba(0,0,0,0.1)", // sombra suave
};

const globalStyles = {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
};

export default globalStyles;
