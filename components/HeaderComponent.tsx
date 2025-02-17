import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "react-native-paper";

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
    marginBottom: 5,
    backgroundColor: "#000000",
    width: "100%",
    height: 70,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
  },
});

export default Header;
