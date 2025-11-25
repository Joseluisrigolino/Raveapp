// app/events/screens/EventScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "react-native-paper";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { Linking } from "react-native";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/app/events/components/ReviewComponent";

import TituloEvento from "@/app/events/components/evento/TituloEvento";
import HeroImagen from "@/app/events/components/evento/HeroImagen";
import BadgesEvento from "@/app/events/components/evento/BadgesEvento";
import ReproductorSoundCloud from "@/app/events/components/evento/ReproductorSoundCloud";
import ReproductorYouTube from "@/app/events/components/evento/ReproductorYouTube";
import { styles as eventoStyles } from "@/app/events/components/evento/styles";
import SeccionEntradas from "../components/SeccionEntradas";
import ModalArtistas from "@/app/events/components/evento/ModalArtistas";
import ResenasDelEvento from "@/app/events/components/evento/ResenasDelEvento";

import { fetchEventById, getEventFlags, fetchGenres } from "@/app/events/apis/eventApi";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

import { useAuth } from "@/app/auth/AuthContext";
import {
  getEventosFavoritos,
  putEventoFavorito,
  getProfile,
  getUsuarioById,
} from "@/app/auth/userHelpers";

import {
  fetchEntradasFechaRaw,
  fetchTiposEntrada,
  getTipoMap,
  getEstadoMap,
  UiEntrada,
  reservarEntradas,
  fetchReservaActiva,
} from "@/app/events/apis/entradaApi";
import { EventItemWithExtras } from "@/app/events/apis/eventApi";
import { ESTADO_CODES } from "@/app/events/apis/eventApi";

type FechaLite = { idFecha: string; inicio: string; fin: string };

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user, isAuthenticated, hasRole } = useAuth();

  const userId: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const [fechas, setFechas] = useState<FechaLite[]>([]);
  const [entradasPorFecha, setEntradasPorFecha] = useState<Record<string, UiEntrada[]>>({});
  const [loadingEntradas, setLoadingEntradas] = useState(false);

  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showArtistsModal, setShowArtistsModal] = useState(false);
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

  const mockReviews: ReviewItem[] = [
    { id: 1, user: "Usuario99", comment: "Me gustó mucho la fiesta.", rating: 5, daysAgo: 6 },
    { id: 2, user: "Usuario27", comment: "Buena organización, pero faltó variedad.", rating: 4, daysAgo: 6 },
  ];

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || null;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
        if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1] || null;
        if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1] || null;
      }
    } catch {}
    return null;
  };

  const findYouTubeUrl = (ev: any): string | null => {
    if (!ev) return null;
    const candidates: string[] = [];
    if (typeof ev.video === "string" && ev.video.trim()) candidates.push(ev.video.trim());
    if (typeof ev.musica === "string" && ev.musica.trim()) candidates.push(ev.musica.trim());
    if (Array.isArray(ev.media)) {
      for (const m of ev.media) {
        if (typeof m?.mdVideo === "string" && m.mdVideo.trim()) candidates.push(m.mdVideo.trim());
        if (typeof m?.url === "string" && m.url.trim()) candidates.push(m.url.trim());
      }
    }
    for (const url of candidates) {
      if (/youtu\.?be/i.test(url)) return url;
    }
    return null;
  };

  const findSoundCloudUrl = (ev: any): string | null => {
    if (!ev) return null;
    const candidates: string[] = [];
    if (typeof ev.soundCloud === "string" && ev.soundCloud.trim()) candidates.push(ev.soundCloud.trim());
    if (typeof ev.soundcloud === "string" && ev.soundcloud.trim()) candidates.push(ev.soundcloud.trim());
    if (typeof ev.sound_cloud === "string" && ev.sound_cloud.trim()) candidates.push(ev.sound_cloud.trim());
    if (typeof ev.musica === "string" && ev.musica.trim()) candidates.push(ev.musica.trim());
    if (typeof ev.video === "string" && ev.video.trim()) candidates.push(ev.video.trim());
    if (Array.isArray(ev.media)) {
      for (const m of ev.media) {
        if (typeof m?.mdAudio === "string" && m.mdAudio.trim()) candidates.push(m.mdAudio.trim());
        if (typeof m?.url === "string" && m.url.trim()) candidates.push(m.url.trim());
      }
    }
    for (const url of candidates) {
      if (/soundcloud/i.test(url)) return url;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const evt = await fetchEventById(String(id));
        if (evt && mounted) {
          setEventData(evt);
          setFechas(evt.fechas || []);

          if (userId) {
            try {
              const favIds = await getEventosFavoritos(String(userId));
              setIsFavorite(favIds.map(String).includes(String(evt.id)));
            } catch {}
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, userId]);

  // Cargar mapa de géneros una vez
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchGenres();
        if (!mounted) return;
        const map = new Map<number, string>(list.map((g: any) => [Number(g.cdGenero), String(g.dsGenero)]));
        setGenreMap(map);
      } catch (e) {
        if (mounted) setGenreMap(new Map());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!fechas.length) return;
      setLoadingEntradas(true);
      try {
        await fetchTiposEntrada();
        const tipoMap = await getTipoMap();

        const results = await Promise.all(
          fechas.map(async (f): Promise<[string, UiEntrada[]]> => {
            const raw = await fetchEntradasFechaRaw(f.idFecha, 0).catch(() => []);
            const merged: UiEntrada[] = (raw || []).map((r: any, idx: number) => {
              const tipoObj = r.tipo ?? null;
              const fechaObj = r.fecha ?? null;
              const cdTipo = Number(tipoObj?.cdTipo ?? 0);
              const nombreTipo = tipoMap.get(cdTipo) ?? tipoObj?.dsTipo ?? String(cdTipo);
              const cantidad = typeof r.cantidad === "number" ? Number(r.cantidad) : undefined;
              const maxPorUsuario = typeof r.maxPorUsuario === "number" ? r.maxPorUsuario : undefined;
              const idEntradaRaw = r.idEntrada ?? null;
              const idEntrada = String(idEntradaRaw ?? `gen-${f.idFecha}-${cdTipo}-${idx}`);
              return {
                idEntrada,
                idFecha: String(fechaObj?.idFecha ?? f.idFecha),
                cdTipo,
                precio: Number(r.precio ?? 0),
                stock: cantidad,
                maxPorUsuario,
                nombreTipo,
                maxCompra: typeof maxPorUsuario === "number" ? maxPorUsuario : typeof cantidad === "number" ? cantidad : 10,
              } as UiEntrada;
            });
            return [f.idFecha, merged];
          })
        );

        if (mounted) {
          const dict: Record<string, UiEntrada[]> = {};
          results.forEach(([idFecha, arr]) => {
            dict[idFecha] = arr;
          });
          setEntradasPorFecha(dict);
        }
      } catch (e) {
        console.warn("[EventScreen] Error cargando entradas", e);
        if (mounted) setEntradasPorFecha({});
      } finally {
        if (mounted) setLoadingEntradas(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fechas]);

  const youTubeEmbedUrl = useMemo(() => {
    if (!eventData) return null;
    const url = findYouTubeUrl(eventData);
    const vid = url ? extractYouTubeId(url) : null;
    return vid ? `https://www.youtube.com/embed/${vid}` : null;
  }, [eventData]);

  const soundCloudUrl = useMemo(() => {
    if (!eventData) return null;
    const url = findSoundCloudUrl(eventData);
    return url || null;
  }, [eventData]);

  // Resolver idFiesta real a partir del evento cargado (varias variantes posibles en el payload)
  const idFiestaResolved = useMemo(() => {
    try {
      const raw = (eventData as any)?.__raw || eventData || {};
      const candidates = [
        (eventData as any)?.idFiesta,
        raw?.idFiesta,
        raw?.IdFiesta,
        raw?.idfiesta,
        raw?.fiestaId,
        raw?.FiestaId,
        raw?.fiesta?.idFiesta,
        raw?.fiesta?.IdFiesta,
        raw?.fiesta?.id,
        raw?.Fiesta?.IdFiesta,
      ]
        .map((v: any) => (typeof v === 'string' || typeof v === 'number') ? String(v) : '')
        .map((s: string) => s.trim())
        .filter(Boolean);
      const val = candidates[0] || '';
      if (val) return val;
    } catch {}
    return '';
  }, [eventData]);

  // Log de diagnóstico (una sola vez por evento)
  useEffect(() => {
    if (!eventData) return;
    try {
      console.log('[EventScreen] idEvento vs idFiesta ->', {
        idEvento: String(eventData?.id || ''),
        idFiesta: String(idFiestaResolved || ''),
      });
    } catch {}
  }, [eventData, idFiestaResolved]);

  const genreNames = useMemo(() => {
    try {
      const codes = Array.isArray((eventData as any)?.genero) ? (eventData as any).genero : [];
      if (!codes.length) return [] as string[];
      const seen = new Set<string>();
      const names = codes
        .map((c: any) => {
          const num = Number(c);
          const name = genreMap.get(num);
          return name ? name : String(num);
        })
        .map((s: string) => s.trim())
        .filter((s: string) => {
          const k = s.toLowerCase();
          if (!k) return false;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      return names;
    } catch {
      return [] as string[];
    }
  }, [eventData, genreMap]);

  const addressDisplay = useMemo(() => {
    const addr = String(eventData?.address ?? "").trim();
    const getText = (val: any): string => {
      if (typeof val === "string") return val;
      if (typeof val === "number") return String(val);
      if (val && typeof val === "object") {
        return val.nombre || val.dsNombre || val.localidad || val.municipio || val.provincia || "";
      }
      return "";
    };
    const loc = String(getText((eventData as any)?.domicilio?.localidad) ?? "").trim();
    const mun = String(getText((eventData as any)?.domicilio?.municipio) ?? "").trim();
    const prov = String(getText((eventData as any)?.domicilio?.provincia) ?? "").trim();
    const suffix = loc || mun || prov || "";
    if (addr && suffix) {
      return addr.toLowerCase().includes(suffix.toLowerCase()) ? addr : `${addr}, ${suffix}`;
    }
    return addr || suffix || "-";
  }, [eventData?.address, (eventData as any)?.domicilio?.localidad, (eventData as any)?.domicilio?.municipio, (eventData as any)?.domicilio?.provincia]);

  const shortAddressDisplay = useMemo(() => {
    if (!addressDisplay) return addressDisplay;
    try { return addressDisplay.replace(/Ciudad Autónoma de Buenos Aires/gi, "CABA"); } catch { return addressDisplay; }
  }, [addressDisplay]);

  const openMapsDirections = () => {
    const getText = (val: any): string => {
      if (typeof val === "string") return val;
      if (typeof val === "number") return String(val);
      if (val && typeof val === "object") return val.nombre || val.dsNombre || val.localidad || val.municipio || val.provincia || "";
      return "";
    };
    const addr = String(eventData?.address ?? "").trim();
    const loc = String(getText((eventData as any)?.domicilio?.localidad) ?? "").trim();
    const mun = String(getText((eventData as any)?.domicilio?.municipio) ?? "").trim();
    const prov = String(getText((eventData as any)?.domicilio?.provincia) ?? "").trim();
    const parts = [addr, loc, mun, prov, "Argentina"].map((s) => String(s || "").trim()).filter(Boolean);
    const seen = new Set<string>();
    const unique = parts.filter((p) => { const k = p.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    const destination = unique.join(", ");
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    Linking.openURL(url).catch(() => { try { const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`; Linking.openURL(fallback); } catch {} });
  };

  const formatFechaRango = (fs: FechaLite[]): string | null => {
    try {
      if (!fs || fs.length === 0) return null;
      const dates = fs.map((f) => new Date(f.inicio)).sort((a, b) => a.getTime() - b.getTime());
      if (dates.length === 0 || isNaN(dates[0].getTime())) return null;
      const first = dates[0];
      const last = dates[dates.length - 1];
      const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
      if (sameMonth) return `${first.getDate()}-${last.getDate()} ${monthNames[first.getMonth()]} ${last.getFullYear()}`;
      return `${first.getDate()} ${monthNames[first.getMonth()]} ${first.getFullYear()} - ${last.getDate()} ${monthNames[last.getMonth()]} ${last.getFullYear()}`;
    } catch { return null; }
  };

  // Formato completo: "Jueves, 11 de Diciembre, 2025"
  const formatFullDateEs = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(String(iso));
    if (isNaN(d.getTime())) return '';
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const diaSemana = dias[d.getDay()];
    const dia = String(d.getDate()).padStart(2,'0');
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${diaSemana}, ${dia} de ${mes}, ${anio}`;
  };
  const displayDate = useMemo(() => {
    // Prioridad: primera fecha de evento con inicio ISO;
    const firstInicio = Array.isArray((eventData as any)?.fechas) && (eventData as any).fechas.length
      ? (eventData as any).fechas[0]?.inicio
      : undefined;
    return formatFullDateEs(firstInicio) || formatFullDateEs(eventData?.date) || formatFechaRango(fechas) || '';
  }, [eventData?.date, (eventData as any)?.fechas, fechas]);
  const displayTime = useMemo(() => { return eventData?.timeRange || ""; }, [eventData?.timeRange]);

  const getArtistName = (a: any): string => a?.nombreArtistico || a?.name || a?.nombre || (typeof a === "string" ? a : "");

  useEffect(() => { if (eventData?.id) { const flags = getEventFlags(eventData); console.log("Evento cargado -> id:", String(eventData.id), { isLGBT_api: flags.isLGBT, isAfter_api: flags.isAfter }); } }, [eventData]);

  const toggleFavorite = async () => {
    if (!eventData?.id) return;
    if (!userId) { Alert.alert("Iniciá sesión", "Necesitás estar logueado para marcar favoritos."); return; }
    const prev = isFavorite; setIsFavorite(!prev); setFavBusy(true);
    try { await putEventoFavorito({ idUsuario: String(userId), idEvento: String(eventData.id) }); } catch { setIsFavorite(prev); Alert.alert("Error", "No se pudo actualizar el favorito. Probá de nuevo."); } finally { setFavBusy(false); }
  };

  const setTicketQty = (key: string, qty: number) => { setSelectedTickets((prev) => ({ ...prev, [key]: Math.max(0, Math.min(10, qty)) })); };

  const subtotal = useMemo(() => { let sum = 0; Object.entries(entradasPorFecha).forEach(([idFecha, arr]) => { arr.forEach((ent) => { const entryKey = `entrada-${ent.idEntrada}`; const qty = selectedTickets[entryKey] || 0; sum += qty * (ent.precio || 0); }); }); return sum; }, [entradasPorFecha, selectedTickets]);

  const noEntradasAvailable = useMemo(() => { if (loadingEntradas) return false; if (!fechas || fechas.length === 0) return true; const hasAny = Object.values(entradasPorFecha).some((arr) => Array.isArray(arr) && arr.length > 0); return !hasAny; }, [loadingEntradas, fechas, entradasPorFecha]);

  const handleBuyPress = () => {
    (async () => {
      if (!eventData) return;
      const byFechaTipo = new Map<string, Map<number, number>>();
      Object.entries(entradasPorFecha).forEach(([idFecha, arr]) => { for (const ent of arr) { const key = `entrada-${ent.idEntrada}`; const qty = Number(selectedTickets[key] || 0); if (!qty || qty <= 0) continue; const mapTipo = byFechaTipo.get(idFecha) ?? new Map<number, number>(); const prev = mapTipo.get(ent.cdTipo) ?? 0; mapTipo.set(ent.cdTipo, prev + qty); byFechaTipo.set(idFecha, mapTipo); } });
      if (byFechaTipo.size === 0) { Alert.alert('No seleccionaste entradas', 'Seleccioná al menos una entrada antes de comprar.'); return; }
      const uid = userId; if (!uid) { Alert.alert('Iniciá sesión', 'Necesitás estar logueado para reservar entradas.'); return; }
      setLoading(true);
      const collectedCompras: string[] = [];
      try {
        for (const [idF, mapTipo] of byFechaTipo.entries()) {
          const entradas = Array.from(mapTipo.entries()).map(([cdTipo, cantidad]) => ({ tipoEntrada: cdTipo, cantidad }));
          try {
            console.debug('[EventScreen] Reservando fecha', idF, 'payload:', { idUsuario: uid, idFecha: idF, entradas });
            const resp = await reservarEntradas({ idUsuario: String(uid), idFecha: idF, entradas });
            const idCompra = resp?.idCompra ?? resp?.body?.idCompra ?? null;
            console.debug('[EventScreen] reservarEntradas resp:', resp);
            if (idCompra) { collectedCompras.push(String(idCompra)); } else {
              const check = await fetchReservaActiva(String(uid)).catch(() => null);
              console.debug('[EventScreen] fetchReservaActiva after reserve:', check);
              if (Array.isArray(check) && check.length > 0 && (check[0] as any).idCompra) { collectedCompras.push(String((check[0] as any).idCompra)); }
              else if (check && (check as any).idCompra) { collectedCompras.push(String((check as any).idCompra)); }
              else { throw new Error('No se logró obtener idCompra tras reservar.'); }
            }
          } catch (e) {
            console.warn('[EventScreen] Error reservando fecha', idF, e);
            try { for (const c of collectedCompras) { await (await import('@/app/events/apis/entradaApi')).cancelarReserva(String(c)); } } catch (rbErr) { console.warn('[EventScreen] Error en rollback de reservas:', rbErr); }
            Alert.alert('Error', 'No se pudo reservar las entradas. Probá de nuevo.');
            return;
          }
        }
        const sel = encodeURIComponent(JSON.stringify(selectedTickets));
        const reservasParam = encodeURIComponent(JSON.stringify(collectedCompras));
        nav.push(router, { pathname: ROUTES.MAIN.TICKETS.BUY, params: { id: eventData.id, selection: sel, reservas: reservasParam } });
      } finally { setLoading(false); }
    })();
  };

  if (loading) return (<SafeAreaView style={styles.loaderWrapper}><ActivityIndicator size="large" color={COLORS.primary} /></SafeAreaView>);
  if (!eventData) return (<SafeAreaView style={styles.loaderWrapper}><Text style={styles.errorText}>Evento no encontrado.</Text></SafeAreaView>);

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroContainer}>
            <HeroImagen imageUrl={eventData.imageUrl} onPress={() => eventData?.id && console.log("Evento id (image press):", String(eventData.id))} />
          </View>
          <View style={styles.badgesRow}>
            <BadgesEvento isLGBT={getEventFlags(eventData).isLGBT} isAfter={getEventFlags(eventData).isAfter} />
          </View>
          <TituloEvento
            title={eventData.title}
            isFavorite={isFavorite}
            favBusy={favBusy}
            onToggleFavorite={toggleFavorite}
            showFavorite={!hasRole("admin")}
            dateText={displayDate}
          />
          {/* Géneros */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Géneros</Text>
            {genreNames.length > 0 ? (
              genreNames.map((g: string, idx: number) => (
                <View key={`${g}-${idx}`} style={styles.listRow}>
                  <MaterialCommunityIcons name="tag-multiple-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{g}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.listTextMuted}>Próximamente</Text>
            )}
          </View>
          <View style={styles.card}><Text style={styles.cardTitle}>Artistas</Text>{(Array.isArray(eventData.artistas) ? eventData.artistas : []).slice(0, 8).map((art, idx) => (<View key={idx} style={styles.listRow}><MaterialCommunityIcons name="music" size={18} color={COLORS.info} style={{ marginRight: 8 }} /><Text style={styles.listText}>{getArtistName(art)}</Text></View>))}{(!eventData.artistas || eventData.artistas.length === 0) && (<Text style={styles.listTextMuted}>Próximamente</Text>)}</View>
          {/* Fechas y horarios por día */}
          {fechas && fechas.length > 0 ? (
            fechas.map((f, idx) => {
              const inicioDate = new Date(f.inicio);
              const finDate = new Date(f.fin);
              const validInicio = !isNaN(inicioDate.getTime());
              const validFin = !isNaN(finDate.getTime());
              const pad = (n: number) => String(n).padStart(2, '0');
              const formatTime12 = (d: Date) => {
                let h = d.getHours();
                const m = d.getMinutes();
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                if (h === 0) h = 12; // 12 AM/PM
                return `${pad(h)}:${pad(m)} ${ampm}`;
              };
              const fechaStr = validInicio ? formatFullDateEs(f.inicio) : '';
              const horaInicioStr = validInicio ? formatTime12(inicioDate) : '';
              const horaFinStr = validFin ? formatTime12(finDate) : '';
              const rangoHora = horaInicioStr && horaFinStr ? `${horaInicioStr} - ${horaFinStr}` : horaInicioStr || horaFinStr || '';
              return (
                <View key={f.idFecha || idx} style={styles.card}>
                  <Text style={styles.cardTitle}>{`Fecha y Horario día ${idx + 1}`}</Text>
                  {!!fechaStr && (
                    <View style={styles.listRow}>
                      <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                      <Text style={styles.listText}>{fechaStr}</Text>
                    </View>
                  )}
                  {!!rangoHora && (
                    <View style={styles.listRow}>
                      <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                      <Text style={styles.listText}>{rangoHora}</Text>
                    </View>
                  )}
                  {!fechaStr && !rangoHora && (
                    <Text style={styles.listTextMuted}>Horario próximamente</Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Fecha y Horario</Text>
              {!!displayDate && (
                <View style={styles.listRow}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{displayDate}</Text>
                </View>
              )}
              {!!displayTime && (
                <View style={styles.listRow}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                  <Text style={styles.listText}>{displayTime}</Text>
                </View>
              )}
              {!displayDate && !displayTime && (
                <Text style={styles.listTextMuted}>Horario próximamente</Text>
              )}
            </View>
          )}
          <View style={styles.card}><Text style={styles.cardTitle}>Dirección</Text><TouchableOpacity onPress={openMapsDirections} disabled={!shortAddressDisplay || shortAddressDisplay === "-"} activeOpacity={0.75}><View style={styles.addressRow}><MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.info} style={styles.addressIcon} /><View style={styles.addressTextCol}><Text style={styles.addressLinkText}>{shortAddressDisplay}</Text><Text style={styles.addressHintText}>Tocar para ver cómo llegar en Google Maps</Text></View></View></TouchableOpacity></View>
          {(() => { console.log("[EventScreen] multimedia URLs -> soundCloud:", soundCloudUrl, " youtube:", youTubeEmbedUrl); return null; })()}
          <ModalArtistas artistas={eventData.artistas} visible={showArtistsModal} onClose={() => setShowArtistsModal(false)} />
          <SeccionEntradas fechas={fechas} entradasPorFecha={entradasPorFecha} loadingEntradas={loadingEntradas} selectedTickets={selectedTickets} setTicketQty={setTicketQty} subtotal={subtotal} noEntradasAvailable={noEntradasAvailable} onBuy={handleBuyPress} isAdmin={hasRole("admin")} />
          <View style={styles.mediaSection}><ReproductorSoundCloud soundCloudUrl={soundCloudUrl} /><ReproductorYouTube youTubeEmbedUrl={youTubeEmbedUrl} /></View>
          {/* Sección de reseñas: solo mostrar si el evento tiene idFiesta real (no usar idEvento como fallback) */}
          {(() => {
            const idFiestaFinal = String(idFiestaResolved || '').trim();
            if (!idFiestaFinal) return null; // si no hay idFiesta -> no se renderiza
            return <ResenasDelEvento idFiesta={idFiestaFinal} limit={6} />;
          })()}
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const HERO_RATIO = 16 / 9;

const styles = StyleSheet.create({
  heroContainer: { position: "relative", marginBottom: 6 },
  badgesRow: { paddingHorizontal: 16, marginBottom: 4, flexDirection: 'row', justifyContent: 'flex-start' },
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 32 },
  mediaSection: { paddingHorizontal: 16, marginBottom: 24 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.card, padding: 16, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e6e9ef' },
  cardTitle: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle, color: COLORS.textPrimary, marginBottom: 10 },
  listRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  listText: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.textPrimary },
  listTextMuted: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: '#6b7280' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressIcon: { marginRight: 8, marginTop: 2 },
  addressTextCol: { flex: 1, flexShrink: 1 },
  addressLinkText: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.info, textDecorationLine: 'underline', fontWeight: 'bold' },
  addressHintText: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  errorText: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.negative },
});
