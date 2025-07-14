// components/auth/ProtectedRoute.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

interface ProtectedRouteProps {
  allowedRoles: Array<"admin" | "owner" | "user">;
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    // No está logueado → lo mandamos al login
    router.replace("/login");
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    // Rol no permitido
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          No tienes permisos para ver esta pantalla.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginHorizontal: 20
  }
});
