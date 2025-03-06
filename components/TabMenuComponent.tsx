import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { TabMenuProps } from "@/interfaces/TabMenuProps";

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
    borderBottomColor: "#ccc",
    marginTop: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
