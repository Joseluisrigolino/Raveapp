// src/screens/NewsScreens/components/new/NewsBodyComponent.tsx

import React, { ReactNode } from "react";
import { Text, StyleSheet, Linking } from "react-native";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

type Props = {
  content?: string | null;
};

export default function NewsBodyComponent({ content }: Props) {
  if (!content) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const renderText = (): ReactNode => {
    const tokens = content.split(urlRegex);
    return tokens.map((token, i) =>
      urlRegex.test(token) ? (
        <Text
          key={`url-${i}`}
          style={styles.link}
          onPress={() => Linking.openURL(token)}
        >
          {token}
        </Text>
      ) : (
        <Text key={`txt-${i}`} style={styles.textChunk}>
          {token}
        </Text>
      )
    );
  };

  return <Text style={styles.wrapper}>{renderText()}</Text>;
}

const styles = StyleSheet.create({
  wrapper: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginTop: 12,
    marginBottom: 16,
    alignSelf: "stretch",
  },
  textChunk: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    textDecorationLine: "underline",
  },
});
