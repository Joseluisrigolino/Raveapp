// app/scanner/components/ScannerProfileCardComponent.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type Props = { controllerName: string };

export default function ScannerProfileCardComponent({ controllerName }: Props) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileLeft}>
        <View style={styles.avatar}>
          <Icon name="person" size={22} color="#0f172a" />
        </View>
        <View>
          <Text style={styles.profileName}>{controllerName}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileName: { color: "#f9fafb", fontWeight: "700" },
});
