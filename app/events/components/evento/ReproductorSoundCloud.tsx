import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { styles } from "./styles";
import { Linking } from "react-native";

type Props = { soundCloudUrl?: string | null };

function getWebView() {
  try {
    // Require dynamically to avoid breaking if package missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("react-native-webview");
    return m?.WebView ?? m?.default ?? null;
  } catch {
    return null;
  }
}

export default function ReproductorSoundCloud({ soundCloudUrl }: Props) {
  if (!soundCloudUrl) return null;

  const WebViewComp: any = getWebView();
  if (WebViewComp) {
    console.log("[ReproductorSoundCloud] WebView disponible, mostrando embed:", soundCloudUrl);
    const embed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      soundCloudUrl
    )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
  const html = `<!doctype html><html><head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/><style>html,body{height:100%;margin:0;background:transparent;}iframe{display:block;border:0;width:100%;height:100%;}</style></head><body><iframe scrolling="no" frameborder="no" src="${embed}"></iframe></body></html>`;
    const handleShouldStartLoad = (request: any) => {
      try {
        const url: string = request?.url || request?.navigationUrl || '';
        if (!url) return true;
        // If the navigation is to the SoundCloud player internals, allow it.
        if (url.includes('w.soundcloud.com/player')) return true;
        // For other http(s) urls (external links like 'soundcloud.com/...'), open externally
        if (/^https?:\/\//i.test(url)) {
          Linking.openURL(url).catch(() => {});
          return false;
        }
      } catch (e) {
        // fallback to allow
        return true;
      }
      return true;
    };

    return (
      <View style={styles.mediaBlock}>
        <View style={styles.mediaWrapperFixed}>
          <WebViewComp
            originWhitelist={["*"]}
            source={{ html }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onNavigationStateChange={(navState: any) => {
              // Some platforms use onNavigationStateChange; intercept external navigations here too
              const url = navState?.url;
              if (url && !url.includes('w.soundcloud.com/player') && /^https?:\/\//i.test(url)) {
                Linking.openURL(url).catch(() => {});
              }
            }}
          />
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    // @ts-ignore
    return (
      // @ts-ignore
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <iframe src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundCloudUrl)}&visual=true`} style={{ width: "100%", height: 300, border: "none" }} title="SoundCloud" />
      </div>
    );
  }

  return (
    <View style={styles.mediaBlock}>
      <TouchableOpacity onPress={() => Linking.openURL(soundCloudUrl)}>
        <Text style={{ color: "#1976D2" }}>Abrir en SoundCloud</Text>
      </TouchableOpacity>
    </View>
  );
}
