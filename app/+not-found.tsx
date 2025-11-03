import { Redirect } from "expo-router";
import ROUTES from "@/routes";

/** Cualquier ruta inválida vuelve al login real */
export default function NotFound() {
  return <Redirect href={ROUTES.LOGIN.LOGIN as any} />;
}
