import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSafeImageSource } from "@/utils/image";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { EventItem } from "@/interfaces/EventItem";
import { mediaApi } from "@/app/apis/mediaApi";
import { getUsuarioById } from "@/app/auth/userApi";

// Componente tarjeta para mostrar un evento por validar
// Comentarios en español explicando lo básico
interface Props {
  event: EventItem;
  genreMap: Map<number, string>;
  onVerify: (id: string) => void;
}

export default function CardManageEventToValidateComponent({
  event,
  genreMap,
  onVerify,
}: Props) {
  const raw: any = event as any;

  // Resolver ownerId usando el campo normalizado si existe, si no caer a raw
  const ownerId = String(
    (event as any).ownerId ??
      raw.ownerId ??
      raw.propietario?.idUsuario ??
      raw.__raw?.propietario?.idUsuario ??
      raw.__raw?.usuario?.idUsuario ??
      raw.owner?.id ??
      ""
  ).trim();

  // Estado local para avatar y email (cada tarjeta se encarga de obtener lo que necesita)
  const [avatar, setAvatar] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // avatar
        if (ownerId) {
          try {
            const url = await mediaApi.getFirstImage(ownerId);
            if (mounted && url) setAvatar(url);
          } catch {}
        }

        // email: preferir campo normalizado, sino pedir perfil
        const normalizedEmail =
          (event as any).ownerEmail ??
          raw?.__raw?.propietario?.correo ??
          raw?.__raw?.usuario?.correo ??
          null;
        if (normalizedEmail) {
          if (mounted) setEmail(String(normalizedEmail));
        } else if (ownerId) {
          try {
            const profile = await getUsuarioById(ownerId);
            if (mounted && profile?.correo) setEmail(String(profile.correo));
          } catch {}
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [ownerId, event, raw]);

  const ownerEmail = email;
  const ownerName =
    (event as any).ownerName ??
    (ownerEmail ? String(ownerEmail).split("@")[0] : "N/D");

  // genera texto de géneros simple
  const codes: number[] = Array.isArray(raw?.genero) ? raw.genero : [];
  const genreText =
    codes.length && genreMap.size
      ? codes
          .map((c: number) => genreMap.get(Number(c)))
          .filter(Boolean)
          .join(", ")
      : event.type || "Otros";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onVerify(event.id)}
    >
      <Image
        source={getSafeImageSource(
          event.imageUrl ||
            "https://via.placeholder.com/400x200?text=Sin+imagen"
        )}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.rowSpace}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.dateText}>{event.date}</Text>
          </View>
          <View style={styles.genreChip}>
            <MaterialCommunityIcons
              name="music"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.genreChipText} numberOfLines={1}>
              {genreText}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.ownerRow}>
          {avatar ? (
            <Image
              source={getSafeImageSource(avatar)}
              style={styles.ownerAvatar}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color={COLORS.textPrimary}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerName}
            </Text>
            {ownerEmail ? (
              <Text style={styles.ownerEmail} numberOfLines={1}>
                {ownerEmail}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={() => onVerify(event.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.verifyBtnText}>Verificar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  image: { width: "100%", height: 140, backgroundColor: COLORS.borderInput },
  body: { padding: 10 },
  rowSpace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { color: COLORS.textSecondary, fontSize: 13 },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  genreChipText: { color: COLORS.textSecondary, fontSize: 12, maxWidth: 140 },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  ownerName: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 14,
  },
  ownerEmail: { color: COLORS.textSecondary, fontSize: 13 },
  verifyBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
  },
});

