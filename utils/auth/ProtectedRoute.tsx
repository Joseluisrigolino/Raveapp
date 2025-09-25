// src/utils/auth/ProtectedRoute.tsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * Componente que envuelve pantallas que requieren ciertos roles.
 * Usa `hasAnyRole` del contexto para centralizar la lógica de permisos.
 *
 * Uso:
 * <ProtectedRoute allowedRoles={["admin","owner"]}>
 *   <MyScreen />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { isAuthenticated, hasAnyRole } = useAuth();

  // Si no está autenticado o no tiene ninguno de los roles permitidos
  if (!isAuthenticated || !hasAnyRole(allowedRoles)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No tienes permisos para ver esta pantalla</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red" },
});
