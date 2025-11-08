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

  // Build embed URL with normalization and recommended params (helps avoid Error 153)
  const embedWithParams = useMemo(() => {
    const raw = (youTubeEmbedUrl || '').trim();
    let videoId: string | null = null;
    try {
      if (/youtu\.be\//i.test(raw)) {
        videoId = raw.split(/youtu\.be\//i)[1].split(/[?&#]/)[0];
      } else if (/youtube\.com\/watch/i.test(raw)) {
        const url = new URL(raw);
        videoId = url.searchParams.get('v');
      } else if (/youtube\.com\/embed\//i.test(raw)) {
        videoId = raw.split(/embed\//i)[1].split(/[?&#]/)[0];
      } else if (/youtube\.com\/shorts\//i.test(raw)) {
        videoId = raw.split(/shorts\//i)[1].split(/[?&#]/)[0];
      }
    } catch {}
    if (!videoId) {
      const m = raw.match(/[\/?=]([A-Za-z0-9_-]{11})(?:[&?/]|$)/);
      videoId = m ? m[1] : null;
    }
  // Preferir dominio sin cookies: puede evitar bloqueos de configuración en algunos entornos
  const base = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : raw;
    const sep = base.includes('?') ? '&' : '?';
    const originParam = 'origin=https://www.youtube.com';
    return `${base}${sep}rel=0&modestbranding=1&playsinline=1&enablejsapi=1&${originParam}`;
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
    console.log("[ReproductorYouTube] WebView disponible, mostrando embed normalizado:", embedWithParams);

    return (
      <View style={styles.mediaBlock}>
        <View style={styles.mediaWrapperFixed}>
          {!embedError ? (
            <WebViewComp
              originWhitelist={["*"]}
              source={{ html }}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
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
              onError={() => {
                console.warn('[ReproductorYouTube] onError WebView');
                setEmbedError(true);
              }}
              onHttpError={() => {
                console.warn('[ReproductorYouTube] onHttpError WebView');
                setEmbedError(true);
              }}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 }}>
              <Text style={{ color: '#fff', marginBottom: 12, textAlign: 'center' }}>No se pudo reproducir el video aquí (Error 153 / configuración del player).
Puede deberse a restricciones del video (privado, edad, región o embed deshabilitado).</Text>
              <TouchableOpacity onPress={() => {
                // convert embed url to watch url
                const watch = embedWithParams.replace('/embed/', '/watch?v=').split('?')[0];
                Linking.openURL(watch);
              }} style={{ backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Ver en YouTube</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(embedWithParams)} style={{ marginTop: 8 }}>
                <Text style={{ color: COLORS.info, textDecorationLine: 'underline', fontSize: 12 }}>Abrir versión embed directa</Text>
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
        <iframe src={embedWithParams} style={{ width: "100%", height: 300, border: "none" }} title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="origin-when-cross-origin" allowFullScreen />
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
