import { Redirect } from "expo-router";
import { ROUTES } from "../../routes";

export default function AppIndex() {
  // Redirigimos a la ruta REAL del archivo app/login/Login.tsx
  return <Redirect href={ROUTES.LOGIN.LOGIN} />;
}
