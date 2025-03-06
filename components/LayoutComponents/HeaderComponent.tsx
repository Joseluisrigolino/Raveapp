// HeaderComponent.tsx (ejemplo)
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import globalStyles from "@/styles/globalStyles";

const Header = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>RAVE APP</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: globalStyles.COLORS.secondary, // Negro
    width: "100%",
    height: 70,
  },
  text: {
    color: "#fff",
    fontFamily: globalStyles.FONTS.titleBold,  // Poppins-Bold
    fontSize: globalStyles.FONT_SIZES.titleMain,
  },
});

export default Header;
