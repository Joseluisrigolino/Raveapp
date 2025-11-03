import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { styles } from "./styles";
import { Linking } from "react-native";
import { COLORS } from "@/styles/globalStyles";

type Props = { youTubeEmbedUrl?: string | null };

function getWebView() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("react-native-webview");
    return m?.WebView ?? m?.default ?? null;
  } catch {
    return null;
  }
}

export default function ReproductorYouTube({ youTubeEmbedUrl }: Props) {
  if (!youTubeEmbedUrl) return null;

  const [embedError, setEmbedError] = useState(false);

  const WebViewComp: any = getWebView();

  // Build embed URL with recommended params (memoized so the string doesn't change each render)
  const embedWithParams = useMemo(() => {
    const sep = youTubeEmbedUrl.includes("?") ? "&" : "?";
    return `${youTubeEmbedUrl}${sep}rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }, [youTubeEmbedUrl]);

  // Inject JS to detect YouTube player error UI and notify RN
  const injectedJS = useMemo(() => `(${String(function () {
    // poll DOM for common error indicators and postMessage once
    function check() {
      try {
        var text = (document.body && document.body.innerText) || '';
        if (/Video player configuration error|Error 153|Watch video on YouTube/i.test(text)) {
          try { (window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage && (window as any).ReactNativeWebView.postMessage('YT_PLAYER_ERROR'); } catch(e){}
          return;
        }
      } catch (e) {}
      setTimeout(check, 1000);
    }
    check();
  })})();`, [youTubeEmbedUrl]);

  const userAgentAndroid =
    'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36';

  const html = `<!doctype html><html><head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/><style>html,body{height:100%;margin:0;background:transparent;}iframe{display:block;border:0;width:100%;height:100%;}</style></head><body><iframe src="${embedWithParams}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></body></html>`;

  useEffect(() => {
    if (!embedError) return;
    (async () => {
      try {
        // Try to open in native YouTube app first
        const vid = (function extractId(u: string) {
          try {
            const url = new URL(u);
            if (url.pathname.includes('/embed/')) return url.pathname.split('/embed/')[1];
            return url.searchParams.get('v');
          } catch { return null; }
        })(youTubeEmbedUrl || '');

        if (!vid) return;

        const androidScheme = `vnd.youtube://view?video_id=${vid}`;
        const iosScheme = `youtube://watch?v=${vid}`;
        const scheme = Platform.OS === 'android' ? androidScheme : iosScheme;
        const can = await Linking.canOpenURL(scheme).catch(() => false);
        if (can) {
          await Linking.openURL(scheme);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [embedError]);

  if (WebViewComp) {
    console.log("[ReproductorYouTube] WebView disponible, mostrando embed:", youTubeEmbedUrl);

    return (
      <View style={styles.mediaBlock}>
        <View style={styles.mediaWrapperFixed}>
          {!embedError ? (
            <WebViewComp
              originWhitelist={["*"]}
              source={{ html }}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              style={styles.webview}
              mixedContentMode="always"
              allowUniversalAccessFromFileURLs={true}
              onMessage={(evt: any) => {
                const d = evt?.nativeEvent?.data;
                if (d === 'YT_PLAYER_ERROR') {
                  console.warn('[ReproductorYouTube] Detectado error del player via injectedJS');
                  setEmbedError(true);
                }
              }}
              injectedJavaScript={injectedJS}
              {...(Platform.OS === 'android' ? { userAgent: userAgentAndroid } : {})}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 }}>
              <Text style={{ color: '#fff', marginBottom: 12 }}>No se pudo reproducir el video aquí.</Text>
              <TouchableOpacity onPress={() => {
                // convert embed url to watch url
                const watch = youTubeEmbedUrl.replace('/embed/', '/watch?v=');
                Linking.openURL(watch);
              }} style={{ backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Ver en YouTube</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    // @ts-ignore
    return (
      // @ts-ignore
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <iframe src={youTubeEmbedUrl} style={{ width: "100%", height: 300, border: "none" }} title="YouTube" />
      </div>
    );
  }

  // Fallback: abrir en navegador
  return (
    <View style={styles.mediaBlock}>
      <TouchableOpacity onPress={() => Linking.openURL(youTubeEmbedUrl)}>
        <Text style={{ color: "#1976D2" }}>Abrir en YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}
