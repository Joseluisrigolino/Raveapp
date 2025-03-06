import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import globalStyles from "@/styles/globalStyles";

const TitlePers = ({ text = "" }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: globalStyles.FONTS.titleBold,   // Poppins-Bold
    fontSize: globalStyles.FONT_SIZES.titleMain, 
    color: globalStyles.COLORS.textPrimary,
  },
});

export default TitlePers;
