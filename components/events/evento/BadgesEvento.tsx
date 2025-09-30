import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { styles } from "./styles";

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
            <Text style={styles.lgbtFlagEmoji}>🏳️‍🌈</Text>
          </View>
          <Text style={[styles.lgbtTagText]}>LGBT</Text>
        </View>
      ) : null}
      {isAfter ? (
        <View style={[styles.tagItemImproved, styles.afterTag]}>
          <MaterialCommunityIcons name="party-popper" size={16} color="#FF6D3A" style={{ marginRight: 6 }} />
          <Text style={[styles.tagTextImproved, styles.afterTagText]}>AFTER</Text>
        </View>
      ) : null}
    </View>
  );
}
