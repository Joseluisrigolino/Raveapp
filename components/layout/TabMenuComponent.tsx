// components/layout/TabMenuComponent.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { TabMenuProps } from "@/interfaces/TabMenuProps";
import { COLORS, FONTS } from "@/styles/globalStyles";

export default function TabMenuComponent({ tabs }: TabMenuProps) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={styles.segment}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={`${tab.label}-${i}`}
            style={[styles.pill, tab.isActive ? styles.pillActive : styles.pillInactive]}
            activeOpacity={0.8}
            onPress={() => !tab.isActive && nav.push(router, tab.route as any)}
          >
            <Text style={[styles.pillText, tab.isActive ? styles.pillTextActive : styles.pillTextInactive]}>
              {tab.label.charAt(0).toUpperCase() + tab.label.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const DARK = "#0F172A";      // activo
const LIGHT = "#E5E7EB";     // inactivo

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  segment: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
  },
  pillActive: {
    backgroundColor: DARK,
  },
  pillInactive: {
    backgroundColor: LIGHT,
  },
  pillText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 14,
  },
  pillTextActive: {
    color: COLORS.backgroundLight,
  },
  pillTextInactive: {
    color: COLORS.textSecondary,
  },
});
