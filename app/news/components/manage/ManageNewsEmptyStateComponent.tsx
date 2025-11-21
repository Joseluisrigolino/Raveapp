// src/screens/admin/NewsScreens/components/manage/ManageNewsEmptyStateComponent.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

export default function ManageNewsEmptyStateComponent() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No hay noticias por mostrar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
});
