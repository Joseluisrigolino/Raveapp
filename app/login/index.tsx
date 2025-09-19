import { Redirect } from "expo-router";

export default function AppIndex() {
  // Redirigimos a la ruta REAL del archivo app/login/Login.tsx
  return <Redirect href="/login/login" />;
}
