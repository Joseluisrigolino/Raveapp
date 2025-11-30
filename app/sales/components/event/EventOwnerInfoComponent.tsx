import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS } from "@/styles/globalStyles";
import { ApiUserFull } from "@/app/auth/userApi";

type Props = {
  ownerUser: ApiUserFull | null;
  ownerError: string | null;
  domicilio: string;
};

export default function EventOwnerInfoComponent({
  ownerUser,
  ownerError,
  domicilio,
}: Props) {
  return (
    <View style={styles.ownerSection}>
      <Text style={styles.ownerHeader}>Datos del usuario dueño del evento</Text>

      {ownerError ? (
        <Text style={styles.ownerError}>{ownerError}</Text>
      ) : !ownerUser ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <>
          {/* Card 1: Nombre + correo */}
          <View style={styles.ownerCard}>
            <Text style={styles.ownerLabel}>Nombre y Apellido</Text>
            <Text style={styles.ownerValue}>
              {ownerUser.nombre} {ownerUser.apellido}
            </Text>

            <View style={{ height: 8 }} />

            <Text style={styles.ownerLabel}>Correo</Text>
            <Text style={styles.ownerValue}>{ownerUser.correo}</Text>
          </View>

          {/* Card 2: Teléfono + CBU */}
          <View style={styles.ownerCard}>
            <Text style={styles.ownerLabel}>Teléfono</Text>
            <Text style={styles.ownerValue}>
              {ownerUser.telefono || "—"}
            </Text>

            <View style={{ height: 8 }} />

            <Text style={styles.ownerLabel}>CBU</Text>
            <Text style={styles.ownerValue}>
              {ownerUser.cbu ||
                "CBU aún no informado por el dueño del evento"}
            </Text>
          </View>

          {/* Card 3: Domicilio */}
          <View style={styles.ownerCard}>
            <Text style={styles.ownerLabel}>Domicilio</Text>
            <Text style={styles.ownerValue}>{domicilio || "—"}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ownerSection: {
    marginBottom: 36,
  },
  ownerHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  ownerCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  ownerLabel: {
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ownerValue: {
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  ownerError: { color: COLORS.alert },
});
