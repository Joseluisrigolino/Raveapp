import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { getResenias, getAvgResenias } from "@/utils/reviewsApi";
import { getUsuarioById } from "@/app/auth/userHelpers";
import { mediaApi } from "@/app/apis/mediaApi";

interface ReviewUI {
  id: string;
  userName: string;
  userAvatar?: string;
  estrellas: number;
  comentario: string;
  fechaISO: string;
  rawFecha?: string; // fecha original del backend para fallback si no se pudo parsear
}

interface Props {
  idFiesta?: string | number;
  limit?: number; // opcional para mostrar solo primeras N
}

export default function ResenasDelEvento({ idFiesta, limit }: Props) {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewUI[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avgApi, setAvgApi] = useState<number | null>(null);
  const [avgCountApi, setAvgCountApi] = useState<number | undefined>(undefined);
  const [avgLoading, setAvgLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!idFiesta) return;
        setLoading(true);
        setError(null);
        const raw = await getResenias({ idFiesta: String(idFiesta) }).catch(() => []);
        const uniqueUserIds = Array.from(new Set(raw.map(r => String(r.idUsuario || '').trim()).filter(Boolean)));
        const usersMap: Record<string, { name: string; avatar?: string }> = {};
        await Promise.all(uniqueUserIds.map(async uid => {
          try {
            const u = await getUsuarioById(uid);
            const name = `${u?.nombre ?? ''} ${u?.apellido ?? ''}`.trim() || (u as any)?.correo || 'Usuario';
            let avatar = '';
            try { avatar = await mediaApi.getFirstImage(uid); } catch {}
            usersMap[uid] = { name, avatar };
          } catch {
            usersMap[uid] = { name: 'Usuario', avatar: '' };
          }
        }));

        const pickFecha = (r: any): { iso: string; raw: string } => {
          try {
            const candidates: any[] = [
              r?.fecha,
              r?.dtResenia,
              r?.dtresenia,
              r?.createdAt,
              r?.updatedAt,
              r?.Fecha,
              r?.fechaResenia,
              r?.date,
              r?.fechaCreacion,
              r?.dt,
            ].filter(v => v !== undefined && v !== null);
            let firstRaw = '';
            for (const c of candidates) {
              if (typeof c === 'number') {
                const ms = c > 1e12 ? c : c * 1000;
                const d = new Date(ms);
                if (!isNaN(d.getTime())) return { iso: d.toISOString(), raw: String(c) };
                continue;
              }
              if (typeof c === 'string') {
                const s = c.trim();
                if (!s) continue;
                if (!firstRaw) firstRaw = s;
                // /Date(1699465200000)/
                const msMatch = /\/Date\((\d+)\)\//.exec(s);
                if (msMatch) {
                  const d2 = new Date(Number(msMatch[1]));
                  if (!isNaN(d2.getTime())) return { iso: d2.toISOString(), raw: s };
                }
                // 'YYYY-MM-DD HH:mm:ss'
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
                  const fixed = s.replace(' ', 'T') + 'Z';
                  const d3 = new Date(fixed);
                  if (!isNaN(d3.getTime())) return { iso: d3.toISOString(), raw: s };
                }
                // Normalizar YYYY/MM/DD
                const normalized = /\d{4}\/\d{2}\/\d{2}/.test(s) ? s.replace(/\//g, '-') : s;
                const d = new Date(normalized);
                if (!isNaN(d.getTime())) return { iso: d.toISOString(), raw: s };
              }
              if (c instanceof Date && !isNaN(c.getTime())) return { iso: c.toISOString(), raw: String(c) };
            }
            return { iso: '', raw: firstRaw };
          } catch {
            return { iso: '', raw: '' };
          }
        };

        const list: ReviewUI[] = raw.map(r => {
          const uid = String(r.idUsuario || '').trim();
          const u = usersMap[uid] || { name: 'Usuario', avatar: '' };
          const fechaReal = pickFecha(r);
          return {
            id: String(r.id || r.idResenia || Math.random()),
            userName: u.name,
            userAvatar: u.avatar,
            estrellas: Number(r.estrellas || 0),
            comentario: String(r.comentario || '').trim(),
            fechaISO: fechaReal.iso,
            rawFecha: fechaReal.raw,
          };
        });
        try { console.log('[ResenasDelEvento] fechas extraídas (primeros 3):', list.slice(0,3).map(x => ({ iso: x.fechaISO, raw: x.rawFecha })) ); } catch {}
        if (mounted) setReviews(list);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar las reseñas');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [idFiesta]);

  // Traer promedio real desde backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAvgLoading(true);
        setAvgApi(null);
        setAvgCountApi(undefined);
        if (!idFiesta) return;
        const list = await getAvgResenias({ idFiesta: String(idFiesta) }).catch(() => []);
        const item = Array.isArray(list) && list.length ? list[0] : null;
        if (mounted && item) {
          const avg = typeof item.avg === 'number' && isFinite(item.avg) ? item.avg : null;
          setAvgApi(avg);
          setAvgCountApi(typeof item.count === 'number' && isFinite(item.count) ? item.count : undefined);
        }
      } finally {
        if (mounted) setAvgLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [idFiesta]);

  const limited = useMemo(() => {
    if (typeof limit === 'number' && limit > 0) return reviews.slice(0, limit);
    return reviews;
  }, [reviews, limit]);

  const avgLocal = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.estrellas, 0);
    return sum / reviews.length;
  }, [reviews]);

  const avgToShow = useMemo(() => {
    return (typeof avgApi === 'number' && isFinite(avgApi)) ? avgApi : avgLocal;
  }, [avgApi, avgLocal]);
  const countToShow = useMemo(() => {
    return typeof avgCountApi === 'number' ? avgCountApi : reviews.length;
  }, [avgCountApi, reviews.length]);

  const renderStars = (rating: number, size = 16) => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      const name = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half-full' : 'star-outline';
      stars.push(<MaterialCommunityIcons key={i} name={name as any} size={size} color="#FFCC00" />);
    }
    return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
  };

  // Formatear fecha real en español: "9 de noviembre de 2025" y hora opcional
  const formatFechaEs = (iso?: string): string => {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const dia = d.getDate();
      const mes = meses[d.getMonth()];
      const anio = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const showHora = !(hh === '00' && min === '00');
      const fechaTxt = `${dia} de ${mes} de ${anio}`;
      return showHora ? `${fechaTxt} - ${hh}:${min}` : fechaTxt;
    } catch { return ''; }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reseñas de la fiesta</Text>
        <View style={styles.avgRow}>
          {renderStars(avgToShow, 16)}
          <Text style={styles.avgText}>{avgToShow.toFixed(1)} ({countToShow} reseña{countToShow !== 1 ? 's' : ''})</Text>
        </View>
      </View>
      {loading && (
        <View style={{ paddingVertical: 12 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      {!loading && error && <Text style={styles.emptyText}>{error}</Text>}
      {!loading && !error && !limited.length && (
        <Text style={styles.emptyText}>Todavía no hay reseñas.</Text>
      )}
      {limited.map((r, idx) => (
        <View key={r.id} style={styles.reviewItem}>
          <View style={styles.reviewRow}>
            {r.userAvatar && r.userAvatar.trim().length > 0 ? (
              <Image source={{ uri: r.userAvatar }} style={styles.avatarCircleImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="account" size={20} color={COLORS.textPrimary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{r.userName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.timeAgo}>{formatFechaEs(r.fechaISO) || r.rawFecha || '-'}</Text>
                </View>
              </View>
              <View style={styles.starsRow}>{renderStars(r.estrellas, 18)}</View>
              <Text style={styles.comment}>{r.comentario || 'Sin comentario'}</Text>
            </View>
          </View>
          {idx < limited.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 30,
    padding: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
  avgRow: { alignItems: "flex-end" },
  starsRowSmall: { flexDirection: "row", marginBottom: 2 },
  avgText: { color: COLORS.primary, fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body - 1 },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body - 1, paddingVertical: 4 },
  reviewItem: { paddingVertical: 8 },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarCircleImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewerName: { fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary, fontSize: FONT_SIZES.body },
  timeAgo: { color: COLORS.primary, fontSize: FONT_SIZES.body - 2 },
  starsRow: { flexDirection: "row", marginBottom: 8 },
  comment: { color: COLORS.textPrimary, fontFamily: FONTS.bodyRegular, lineHeight: FONT_SIZES.body * 1.4 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 8 },
});
