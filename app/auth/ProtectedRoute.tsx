// app/auth/ProtectedRoute.tsx

import React from "react"; // Necesario para definir el componente y usar JSX
import { View, Text, StyleSheet } from "react-native"; // Componentes básicos de layout y estilos
import { SafeAreaView } from "react-native-safe-area-context"; // Para respetar las zonas seguras (notch, barra de estado, etc.)
import { useAuth } from "@/app/auth/AuthContext"; // Hook propio para acceder al contexto de autenticación
import type { Role } from "@/app/auth/authApi"; // Tipo de roles normalizados que usamos en la app

/**
 * Props que recibe el componente ProtectedRoute.
 */
interface ProtectedRouteProps {
  // Lista de roles que tienen permitido ver el contenido envuelto
  allowedRoles: Role[];
  // Lo que sea que queramos renderizar si el usuario tiene permiso (screens, layouts, etc.)
  children: React.ReactNode;
}

/**
 * Componente que envuelve pantallas o secciones que requieren ciertos roles.
 *
 * Uso típico:
 * <ProtectedRoute allowedRoles={["admin", "owner"]}>
 *   <AdminDashboardScreen />
 * </ProtectedRoute>
 *
 * Internamente:
 * - Consulta el contexto de auth (useAuth)
 * - Pregunta si está autenticado y si tiene alguno de los roles necesarios
 * - Si no cumple, muestra un mensaje de error genérico
 * - Si cumple, renderiza los children normalmente
 */
export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  // Extraemos del contexto lo mínimo que necesitamos:
  // - isAuthenticated: indica si hay usuario logueado
  // - hasAnyRole: helper que chequea si el usuario tiene al menos uno de los roles que le pasamos
  const { isAuthenticated, hasAnyRole } = useAuth();

  // Si NO está autenticado o no tiene ninguno de los roles permitidos
  if (!isAuthenticated || !hasAnyRole(allowedRoles)) {
    // Devolvemos una vista simple de error.
    // Acá podrías cambiar por una pantalla más "Raveapp style" si querés.
    return (
      <SafeAreaView style={styles.container}>
        {/* Vista centrada vertical y horizontalmente */}
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No tenés permisos para ver esta pantalla
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si pasa todas las validaciones, renderizamos normalmente lo que venga dentro.
  // Usamos fragmento vacío porque pueden ser uno o varios children.
  return <>{children}</>;
}

/**
 * Estilos básicos para el mensaje de error.
 * Podés adaptar este estilo a tu diseño general (colores, tipografía, etc.).
 */
const styles = StyleSheet.create({
  // Ocupa toda la pantalla
  container: {
    flex: 1,
  },
  // Centrado absoluto del contenido
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Estilo del texto de error
  errorText: {
    fontSize: 16,
    color: "red", // Podrías llevar esto a un theme global más adelante
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
