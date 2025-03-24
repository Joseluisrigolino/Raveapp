import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { TabMenuProps } from "@/interfaces/TabMenuProps";

// Importamos globalStyles
import globalStyles, { COLORS, FONT_SIZES } from "@/styles/globalStyles";

/**
 * Un submenú reutilizable (pestañas) que recibe un array de tabs.
 * Cada tab tiene { label, route, isActive }.
 * Al presionar una tab que no está activa, se hace router.push(route).
 */
export default function TabMenuComponent({ tabs }: TabMenuProps) {
  const router = useRouter();

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tabButton, tab.isActive && styles.activeTab]}
          onPress={() => {
            if (!tab.isActive) {
              router.push(tab.route);
            }
          }}
        >
          <Text style={styles.tabText}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: globalStyles.COLORS.borderInput, // Gris claro
    marginTop: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: globalStyles.COLORS.textPrimary, // Gris oscuro
  },
  tabText: {
    fontSize: FONT_SIZES.button,  // 16-18
    fontWeight: "600",
    color: globalStyles.COLORS.textPrimary,
  },
});
