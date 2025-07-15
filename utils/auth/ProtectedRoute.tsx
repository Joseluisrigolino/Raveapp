// src/utils/auth/ProtectedRoute.tsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user } = useAuth();
  const hasAccess = user?.roles?.some((r) => allowedRoles.includes(r));
  if (!hasAccess) {
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
