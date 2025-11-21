// src/screens/admin/NewsScreens/components/manage/ManageNewsCardComponent.tsx

import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  item: NewsItem;
  onEdit: (idNoticia: string) => void;
  onDelete: (idNoticia: string) => void;
};

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function ManageNewsCardComponent({
  item,
  onEdit,
  onDelete,
}: Props) {
  const dateText = useMemo(() => {
    if (!item.dtPublicado) return "";
    const d = new Date(item.dtPublicado);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  }, [item.dtPublicado]);

  return (
    <View style={styles.card}>
      <Image
        source={getSafeImageSource(item.imagen || PLACEHOLDER_IMAGE)}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.dateText}>{dateText}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.modifyBtn]}
            onPress={() => onEdit(item.idNoticia)}
          >
            <Text style={styles.modifyBtnText}>Modificar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => onDelete(item.idNoticia)}
          >
            <Text style={styles.deleteBtnText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    marginVertical: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.borderInput,
  },
  cardContent: {
    padding: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modifyBtn: {
    backgroundColor: "#F1F5F9",
  },
  modifyBtnText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  deleteBtn: {
    backgroundColor: "#374151",
  },
  deleteBtnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
