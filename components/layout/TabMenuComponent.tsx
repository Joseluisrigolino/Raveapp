// components/layout/TabMenuComponent.tsx
import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { TabMenuProps } from "@/interfaces/TabMenuProps";
import globalStyles, { COLORS, FONT_SIZES } from "@/styles/globalStyles";

export default function TabMenuComponent({ tabs }: TabMenuProps) {
  const router = useRouter();
  const centerIfTwo = tabs.length === 2;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabScroll,
          centerIfTwo && styles.centerTabs,
        ]}
      >
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tabButton, tab.isActive && styles.activeTab]}
            onPress={() => !tab.isActive && router.push(tab.route)}
          >
            <Text style={[styles.tabText, tab.isActive && styles.activeText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: globalStyles.COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
    zIndex: 1000,
    elevation: 4,
  },
  tabScroll: {
    flexDirection: "row",
    paddingHorizontal: 8,
    flexGrow: 1,           // <— para que ocupe todo el ancho
  },
  centerTabs: {
    justifyContent: "center",  // <— ahora sí centra si son solo 2
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: FONT_SIZES.body,
    fontWeight: "500",
    color: globalStyles.COLORS.textSecondary,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
