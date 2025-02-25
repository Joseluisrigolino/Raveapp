import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const SoundCloud = ({ trackUrl }) => {
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300, // Ajusta la altura según lo necesites
  },
  webview: {
    flex: 1,
  },
});

export default SoundCloud;
