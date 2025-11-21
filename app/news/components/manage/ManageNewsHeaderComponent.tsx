// src/screens/admin/NewsScreens/components/manage/ManageNewsHeaderComponent.tsx

import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import SearchBarComponent from "@/components/common/SearchBarComponent";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

type Props = {
  searchText: string;
  onChangeSearch: (value: string) => void;
  onCreatePress: () => void;
};

export default function ManageNewsHeaderComponent({
  searchText,
  onChangeSearch,
  onCreatePress,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreatePress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color={COLORS.backgroundLight}
        />
        <Text style={styles.createButtonText}>Crear noticia</Text>
      </TouchableOpacity>

      <SearchBarComponent
        value={searchText}
        onChangeText={onChangeSearch}
        placeholder="Buscar noticias..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    height: 44,
    marginBottom: 12,
  },
  createButtonText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
