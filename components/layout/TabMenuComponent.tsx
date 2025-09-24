// components/layout/TabMenuComponent.tsx
import React, { useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { TabMenuProps } from "@/interfaces/TabMenuProps";
import { COLORS } from "@/styles/globalStyles";

export default function TabMenuComponent({ tabs }: TabMenuProps) {
  const router = useRouter();
  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.isActive)),
    [tabs]
  );
  const count = tabs.length || 1;
  const segmentWidthPct = 100 / count;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={`${tab.label}-${i}`}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => !tab.isActive && nav.push(router, tab.route as any)}
          >
            <Text style={[styles.tabText, tab.isActive && styles.tabTextActive]}>
              {tab.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.baseline} />
      <View
        style={[
          styles.indicator,
          { width: `${segmentWidthPct}%`, left: `${segmentWidthPct * activeIndex}%` },
        ]}
      />
    </View>
  );
}

const INACTIVE = "#9CA3AF";
const BASELINE = "#E5E7EB";
const INDICATOR = "#BFC3C9";

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    borderBottomColor: BASELINE,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,   // ↓ más bajo
  },
  tabText: {
    fontSize: 13,          // ↓ texto mucho más chico
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: INACTIVE,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  baseline: {
    height: 2,
    backgroundColor: BASELINE,
    width: "100%",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: INDICATOR,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
