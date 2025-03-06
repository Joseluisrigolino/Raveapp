// ButtonInApp.tsx
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import globalStyles from "@/styles/globalStyles";

const ButtonInApp = ({
  icon = "google",
  text = "Default Text",
  width = "70%",
  height = 50,
  onPress = () => {},
}) => {
  return (
    <View style={styles.container}>
      <Button
        style={[styles.button, { width, height }]}
        icon={icon}
        mode="contained"
        onPress={onPress}
      >
        {text}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    // Usamos el color primario en lugar de "#000222"
    backgroundColor: globalStyles.COLORS.primary,
  },
});

export default ButtonInApp;
