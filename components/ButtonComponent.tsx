// ButtonInApp.tsx
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "@/styles/globalStyles";

const ButtonInApp = ({
  icon = "google",
  text = "Default Text",
  width = "70%" as unknown as number | string,
  height = 50 as number,
  onPress = () => {},
}: {
  icon?: string;
  text?: string;
  width?: number | string;
  height?: number;
  onPress?: () => void;
}) => {
  return (
    <View style={styles.container}>
      <Button
        style={[styles.button, { width, height } as any]}
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
    // Usamos el color primario definido en tokens
    backgroundColor: COLORS.primary,
  },
});

export default ButtonInApp;
