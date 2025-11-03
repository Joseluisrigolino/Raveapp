import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { styles } from "./styles";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  isLGBT?: boolean;
  isAfter?: boolean;
};

export default function BadgesEvento({ isLGBT, isAfter }: Props) {
  if (!isLGBT && !isAfter) return null;
  return (
    <View style={styles.tagsRowImproved}>
      {isLGBT ? (
        <View style={[styles.tagItemImproved, styles.lgbtTag]}>
          <View style={styles.lgbtFlagBox}>
            <View style={[styles.flagStripe, { backgroundColor: "#E40303" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FF8C00" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FFED00" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#008026" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#004DFF" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#750787" }]} />
          </View>
          <Text style={[styles.lgbtTagText]}>LGBT</Text>
        </View>
      ) : null}
      {isAfter ? (
        <View style={[styles.tagItemImproved, styles.afterTag]}>
          <MaterialCommunityIcons name="party-popper" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={[styles.tagTextImproved, styles.afterTagText]}>AFTER</Text>
        </View>
      ) : null}
    </View>
  );
}
