import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Platform, Linking, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";
import { extractYouTubeId } from "@/app/events/utils/youtube";

type Props = {
  youTubeEmbedUrl?: string | null;
  // backward compatibility (optional)
  rawUrl?: string | null;
  videoId?: string | null;
  title?: string | null;
  description?: string | null;
};

export default function ReproductorYouTube({ youTubeEmbedUrl, rawUrl, videoId: propVideoId, title, description }: Props) {
  // Prefer explicit videoId prop, otherwise try the new youTubeEmbedUrl then rawUrl
  const resolvedVideoId = useMemo(() => {
    if (propVideoId) return propVideoId;
    const candidate = youTubeEmbedUrl || rawUrl || undefined;
    try {
      return extractYouTubeId(candidate);
    } catch {
      return null;
    }
  }, [propVideoId, youTubeEmbedUrl, rawUrl]);

  if (!resolvedVideoId) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${resolvedVideoId}`;
  const androidScheme = `vnd.youtube://watch?v=${resolvedVideoId}`;
  const iosScheme = `youtube://watch?v=${resolvedVideoId}`;

  const openExternal = async () => {
    try {
      // Try vnd.youtube first (common on Android), then youtube:// (iOS/alt), then web
      const canVnd = await Linking.canOpenURL(androidScheme).catch(() => false);
      if (canVnd) return Linking.openURL(androidScheme).catch(() => Linking.openURL(watchUrl));

      const canYoutube = await Linking.canOpenURL(iosScheme).catch(() => false);
      if (canYoutube) return Linking.openURL(iosScheme).catch(() => Linking.openURL(watchUrl));

      return Linking.openURL(watchUrl).catch(() => {});
    } catch {
      // ignore
    }
  };

  if (Platform.OS === "web") {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${resolvedVideoId}`;
    // keep iframe minimal and include referrerPolicy
    // @ts-ignore react-native-web supports raw DOM in web builds
    return (
      // @ts-ignore
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: 300, border: "none" }}
          title="YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  // Native platforms: card with thumbnail + meta and full-width button
  return (
    <View style={localStyles.container}>
      <View style={localStyles.previewCard}>
        <View style={localStyles.row}>
          <View style={localStyles.thumbWrap}>
            <View style={localStyles.playIconBg}>
              <MaterialCommunityIcons name="youtube" size={28} color="#ffffff" />
            </View>
          </View>
          <View style={localStyles.metaCol}>
            <Text numberOfLines={1} style={localStyles.metaTitle}>{title || 'Video del artista principal'}</Text>
            <Text numberOfLines={2} style={localStyles.metaDesc}>{description || 'Mirá el video que el organizador del evento dejó, sobre el artista principal.'}</Text>
            <Text style={localStyles.domain}>youtube.com</Text>
          </View>
        </View>

        <TouchableOpacity style={localStyles.ctaButton} onPress={openExternal} accessibilityRole="button">
          <MaterialCommunityIcons name="open-in-new" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={localStyles.ctaText}>Ver en YouTube</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { width: "100%", marginTop: 12 },
  card: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderInput },
  title: { color: COLORS.textPrimary, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: COLORS.textSecondary, marginBottom: 12 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: "flex-start" },
  buttonText: { color: COLORS.cardBg, fontWeight: "700" },
  previewCard: { backgroundColor: COLORS.cardBg, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderInput },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumbWrap: { width: 64, height: 64, marginRight: 12 },
  playIconBg: { flex: 1, backgroundColor: '#e6e6e6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  metaCol: { flex: 1 },
  metaTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  metaDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  domain: { color: COLORS.textSecondary, fontSize: 12, marginTop: 8 },
  ctaButton: { marginTop: 12, backgroundColor: '#0b1220', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
