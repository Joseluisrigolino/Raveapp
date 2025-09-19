import { Redirect } from "expo-router";

/** Cualquier ruta inválida vuelve al login real */
export default function NotFound() {
  return <Redirect href="/login/login" />;
}
