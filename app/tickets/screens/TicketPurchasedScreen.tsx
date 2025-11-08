// app/main/TicketsScreens/TicketPurchasedScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ScrollView, Image, Text, StyleSheet, TouchableOpacity, View, ActivityIndicator, Dimensions, Linking, Alert, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CirculoCarga from "@/components/common/CirculoCarga";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchEventById, EventItemWithExtras } from "@/app/events/apis/eventApi";
import { getEntradasUsuario } from "@/app/auth/userHelpers";
import { getTipoMap } from "@/app/events/apis/entradaApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";
import { postResenia, getResenias, Review } from "@/utils/reviewsApi";

const screenWidth = Dimensions.get("window").width;
const QR_SIZE = 140;

type UiUserEntry = {
  idEntrada: string;
  idFecha?: string;
  mdQR?: string;
  tipoCd?: number;
  tipoDs?: string;
  precio?: number;
  nroEntrada?: number;
  qrImageUrl?: string;
  mediaId?: string; // idMedia asociado a la entrada (si existe)
  estadoCd?: number;
  estadoDs?: string;
  idFiesta?: string; // identificador de fiesta para reseñas
};

function TicketPurchasedScreenContent() {
  const { id, eventId, count, idCompra, openReview } = useLocalSearchParams<{ id?: string; eventId?: string; count?: string; idCompra?: string; openReview?: string }>();
  const { user } = useAuth();
  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketsCount = typeof count === "string" && count.trim() ? Number(count) : undefined;
  const [entries, setEntries] = useState<UiUserEntry[]>([]);
  const qrRefs = useRef<Record<string, any>>({});

  // Modal reseña
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [readOnlyReview, setReadOnlyReview] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  const userIdForReview: string | null =
    (user as any)?.id ??
    (user as any)?.idUsuario ??
    (user as any)?.userId ??
    null;

  // Determinar idFiesta para reseñas a partir de las entradas mapeadas (fallback a eventId si fuese igual)
  const fiestaIdForReview: string | null = useMemo(() => {
    if (Array.isArray(entries) && entries.length > 0) {
      const found = entries.find((e) => e.idFiesta)?.idFiesta;
      if (found) return String(found);
    }
    return eventId ? String(eventId) : null;
  }, [entries, eventId]);

  const handleSubmitReview = async () => {
    const trimmed = (comment ?? '').trim();
    if (!userIdForReview || !fiestaIdForReview) return;
    if (userReview) {
      Alert.alert('Reseña existente', 'Ya dejaste una reseña para esta fiesta.');
      setReadOnlyReview(true);
      setShowReview(true);
      return;
    }
    if (rating <= 0) {
      Alert.alert('Calificación requerida', 'Por favor seleccioná al menos 1 estrella.');
      return;
    }
    if (trimmed.length === 0) {
      Alert.alert('Comentario requerido', 'Por favor escribí tu reseña.');
      return;
    }
    try {
      setSubmitting(true);
      const created = await postResenia({
        idUsuario: String(userIdForReview),
        idFiesta: String(fiestaIdForReview),
        estrellas: rating,
        comentario: trimmed,
      });
      try { setUserReview(created); } catch {}
      setShowReview(false);
      Alert.alert('¡Gracias!', 'Tu reseña fue enviada correctamente.');
    } catch (e) {
      Alert.alert('Error', 'No pudimos enviar tu reseña. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Traer reseña existente del usuario para esta fiesta
  useEffect(() => {
    (async () => {
      try {
        setReviewLoaded(false);
        if (!fiestaIdForReview || !userIdForReview) return;
        const list = await getResenias({ idUsuario: String(userIdForReview), idFiesta: String(fiestaIdForReview) });
        const first = Array.isArray(list) && list.length ? list[0] : null;
        setUserReview(first);
      } catch {}
      finally {
        setReviewLoaded(true);
      }
    })();
  }, [fiestaIdForReview, userIdForReview]);

  // Abrir modal automáticamente si viene desde el menú con openReview=1
  useEffect(() => {
    if (!openReview) return;
    if (!reviewLoaded) return; // esperar a conocer si existe reseña
    if (openReview && typeof openReview === 'string') {
      const has = !!userReview;
      if (has) {
        setRating(Number(userReview?.estrellas || 0));
        setComment(String(userReview?.comentario || ''));
        setReadOnlyReview(true);
        setShowReview(true);
      } else {
        setRating(0);
        setComment("");
        setReadOnlyReview(false);
        setShowReview(true);
      }
    }
  }, [openReview, userReview, reviewLoaded]);

  // Helpers para Maps: construir destino robusto a partir de la dirección
  const getText = (v: any): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") {
      return (
        getText(v?.nombre) ||
        getText(v?.dsNombre) ||
        getText(v?.localidad) ||
        getText(v?.municipio) ||
        getText(v?.provincia) ||
        ""
      );
    }
    return "";
  };

  const addressDisplay = (() => {
    const parts = [
      getText(eventData?.address),
      getText((eventData as any)?.localidad),
      getText((eventData as any)?.municipio),
      getText((eventData as any)?.provincia),
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean);
    // evitar duplicados consecutivos sencillos
    const dedup: string[] = [];
    for (const p of parts) if (!dedup.includes(p)) dedup.push(p);
    return dedup.join(", ");
  })();

  const openMapsDirections = () => {
    const pieces = [
      getText(eventData?.address),
      getText((eventData as any)?.localidad),
      getText((eventData as any)?.municipio),
      getText((eventData as any)?.provincia),
      "Argentina",
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean);
    const uniq: string[] = [];
    for (const p of pieces) if (!uniq.includes(p)) uniq.push(p);
    const destination = uniq.join(", ");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || eventData?.title || "")}`;
    Linking.openURL(url);
  };

  // Formateador de fecha legible en español (ej: 28 Marzo 2025)
  const formatDateEs = (raw: string | undefined | null): string => {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    // Intentar parsear ISO o formatos comunes
    const tryList = [s];
    // Si viene como dd/mm/yyyy, reordenar
    const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) {
      const d = m[1].padStart(2, '0');
      const mo = m[2].padStart(2, '0');
      const y = m[3];
      tryList.push(`${y}-${mo}-${d}T12:00:00Z`);
    }
    for (const cand of tryList) {
      const dt = new Date(cand);
      if (!isNaN(dt.getTime())) {
        const dia = dt.getUTCDate();
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mes = meses[dt.getUTCMonth()];
        const anio = dt.getUTCFullYear();
        return `${dia} ${mes} ${anio}`;
      }
    }
    return s;
  };

  const formatTicketCode = (n: number) => `#${String(n).padStart(3, '0')}`;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let evt: EventItemWithExtras | null = null;
        if (eventId) {
          evt = await fetchEventById(String(eventId));
          setEventData(evt);
        } else {
          setEventData(null);
        }

        // Cargar entradas del usuario y filtrar por el evento actual y/o idCompra
        const userId: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
        if (userId) {
          const raw = await getEntradasUsuario(String(userId));
          const tipoMap = await getTipoMap().catch(() => new Map<number, string>());

          const getEventId = (r: any): string | null => {
            const ev = r?.evento ?? r?.event ?? null;
            const id = ev?.idEvento ?? ev?.id ?? r?.idEvento ?? r?.eventId ?? r?.id_evento;
            const s = String(id ?? "").trim();
            return s ? s : null;
          };
          const getCompraId = (r: any): string | null => {
            const idc = r?.idCompra ?? r?.IdCompra ?? r?.compraId ?? r?.purchaseId ?? r?.id_compra ?? r?.compra?.idCompra ?? r?.pago?.idCompra;
            const s = String(idc ?? "").trim();
            return s ? s : null;
          };
          const getFiestaId = (r: any): string | null => {
            const f = r?.fiesta ?? r?.evento ?? r?.event ?? null;
            const id = f?.idFiesta ?? f?.id_fiesta ?? r?.idFiesta ?? r?.fiestaId ?? r?.id_fiesta ?? null;
            const s = String(id ?? "").trim();
            return s ? s : null;
          };

          const all = Array.isArray(raw) ? raw : [];
          const filteredByEvent = all.filter((r) => {
            if (!eventId) return true;
            const eid = getEventId(r);
            return eid ? String(eid) === String(eventId) : false;
          });
          const filtered = filteredByEvent.filter((r) => {
            if (!idCompra) return true;
            const cid = getCompraId(r);
            return cid ? String(cid) === String(idCompra) : false;
          });

          const mapped: UiUserEntry[] = filtered.map((r: any) => {
            const idEntrada = String(r?.idEntrada ?? r?.entrada?.idEntrada ?? r?.id_entrada ?? "");
            const idFecha = String(
              r?.idFecha ?? r?.fecha?.idFecha ?? r?.entrada?.fecha?.idFecha ?? r?.id_fecha ?? ""
            );
            const mdQR = String(r?.mdQR ?? r?.qr ?? r?.codigoQr ?? r?.cod_qr ?? "").trim() || undefined;
            const tipo = r?.tipo ?? r?.entrada?.tipo ?? null;
            const tipoCd = Number(tipo?.cdTipo ?? r?.cdTipo ?? r?.tipoEntrada ?? NaN);
            const tipoDs = String(
              tipo?.dsTipo ?? r?.dsTipo ?? (Number.isFinite(tipoCd) ? (tipoMap.get(tipoCd as number) ?? "") : "")
            ).trim() || undefined;
            const precio = Number(r?.precio ?? r?.entrada?.precio ?? NaN);
            const nroEntradaRaw = Number(
              r?.nroEntrada ?? r?.entrada?.nroEntrada ?? r?.numero ?? r?.nro ?? NaN
            );
            const estadoCdRaw = Number(r?.cdEstado ?? r?.estado?.cdEstado ?? NaN);
            const estadoDsRaw = String(r?.dsEstado ?? r?.estado?.dsEstado ?? "").trim() || undefined;
            const idFiesta = getFiestaId(r) || undefined;
            return {
              idEntrada,
              idFecha: idFecha || undefined,
              mdQR,
              tipoCd: Number.isFinite(tipoCd) ? (tipoCd as number) : undefined,
              tipoDs,
              precio: Number.isFinite(precio) ? (precio as number) : undefined,
              nroEntrada: Number.isFinite(nroEntradaRaw) ? (nroEntradaRaw as number) : undefined,
              estadoCd: Number.isFinite(estadoCdRaw) ? (estadoCdRaw as number) : undefined,
              estadoDs: estadoDsRaw,
              idFiesta,
            };
          });
          // Obtener QR desde mediaApi por cada idEntrada y anexar su URL
          const withQrImages: UiUserEntry[] = await Promise.all(
            mapped.map(async (e) => {
              try {
                // Traemos la lista de media para capturar también el idMedia
                const data = await mediaApi.getByEntidad(e.idEntrada);
                const list: any[] = Array.isArray((data as any)?.media) ? (data as any).media : [];
                // Seleccionar la primera imagen (sin mdVideo), igual criterio que getFirstImage
                const img = list.find(
                  (m) =>
                    m &&
                    typeof m.url === "string" &&
                    m.url.trim().length > 0 &&
                    !m?.mdVideo &&
                    !/youtube\.com|youtu\.be/i.test(m.url)
                );
                const mediaId = img?.idMedia || img?.id || img?.IdMedia || undefined;
                const url = img?.url || "";
                return { ...e, qrImageUrl: url || undefined, mediaId };
              } catch {
                return e;
              }
            })
          );
          setEntries(withQrImages);
          try {
            // Loguear ids para diagnóstico rápido
            console.log('[TicketPurchasedScreen] Entradas e idMedia:', withQrImages.map((x) => ({ idEntrada: x.idEntrada, idMedia: x.mediaId })));
          } catch {}
        } else {
          setEntries([]);
        }
      } catch (e) {
        setEventData(null);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, user]);

  const handleDownloadEntryPDF = async (entry: UiUserEntry) => {
    if (!eventData) return;
    const qrText = entry.mdQR || `Entrada:${entry.idEntrada}|Evento:${eventData.id}|Fecha:${entry.idFecha ?? ''}`;
    // Preferir la imagen del QR desde mediaApi; si no, intentar extraer dataURL del componente QR
    let dataUrl: string | undefined;
    let url: string | undefined = entry.qrImageUrl;
    if (!url) {
      dataUrl = await new Promise((resolve) => {
        try {
          const ref = qrRefs.current[entry.idEntrada];
          if (ref && typeof ref.toDataURL === 'function') {
            ref.toDataURL((d: string) => resolve(`data:image/png;base64,${d}`));
          } else {
            resolve(undefined);
          }
        } catch {
          resolve(undefined);
        }
      });
    }

    const html = buildPurchasePdfHtml(eventData, [{ entry, dataUrl, url, text: qrText }], String(idCompra || ''));
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
  };

  // Generar UN SOLO PDF con TODAS las entradas para evitar múltiples diálogos de compartir
  const handleDownloadAll = async () => {
    if (!eventData || !entries.length) return;

    // Obtener dataURL para cada QR ya renderizado
    const qrImages: { entry: UiUserEntry; dataUrl?: string; url?: string; text: string }[] = [];
    for (const e of entries) {
      const qrText = e.mdQR || `Entrada:${e.idEntrada}|Evento:${eventData.id}|Fecha:${e.idFecha ?? ''}`;
      let dataUrl: string | undefined;
      const url = e.qrImageUrl;
      try {
        if (!url) {
          const ref = qrRefs.current[e.idEntrada];
          if (ref && typeof ref.toDataURL === 'function') {
            // eslint-disable-next-line no-await-in-loop
            dataUrl = await new Promise<string>((resolve) => ref.toDataURL((data: string) => resolve(`data:image/png;base64,${data}`)));
          }
        }
      } catch {}
      qrImages.push({ entry: e, dataUrl, url, text: qrText });
    }

    const html = buildPurchasePdfHtml(eventData, qrImages, String(idCompra || ''));
    try {
      // Generar el PDF y guardar localmente
      const { uri } = await Print.printToFileAsync({ html });
      // Mostrar vista previa del PDF (el usuario puede imprimir, guardar o compartir desde aquí)
      await Print.printAsync({ uri });
      // Si quieres compartir después de la vista previa, puedes dejar un botón aparte para compartir
      // await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err) {
      console.error('Error generando o mostrando PDF:', err);
    }
  }

  // Construye un PDF similar a la plantilla provista, con datos reales
  const buildPurchasePdfHtml = (
    ev: EventItemWithExtras,
    images: { entry: UiUserEntry; dataUrl?: string; url?: string; text: string }[],
    compraId?: string
  ) => {
    // Pega aquí el string base64 de tu logo (ejemplo: data:image/png;base64,xxxx)
    const LOGO_BASE64 = 'data:image/jpeg;base64,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';
    const fmtMoney = (n?: number) => (typeof n === 'number' && !isNaN(n) ? `$${n.toLocaleString('es-AR')}` : '-');
    const dateHuman = formatDateEs(ev.date);
    const headerTitle = `${(user && user.nombre) ? user.nombre : 'Usuario'}, aquí tienes tus entradas QR`;
  const eventLink = (ev as any)?.url || null;
    const headerSub = compraId ? `Compra ${compraId}` : '';
    const artistas = Array.isArray((ev as any)?.artistas) ? (ev as any).artistas.map((a: any) => a?.name || a?.nombre || a?.dsNombre).filter(Boolean).join(', ') : '';
    const address = [getText(ev.address), getText((ev as any)?.localidad), getText((ev as any)?.municipio), getText((ev as any)?.provincia)].filter(Boolean).join(', ');
    const fechaHora = `${dateHuman}${ev.timeRange ? `, ${ev.timeRange}` : ''}`;

    const sections = images.map(({ entry, dataUrl, url, text }, idx) => {
      const tipo = entry.tipoDs ?? (entry.tipoCd ?? 'Entrada');
      const precio = fmtMoney(entry.precio);
      return `
        <div class="qr-section">
          <div class="qr-img">${(dataUrl || url) ? `<img src="${dataUrl || url}" alt="QR" />` : `<div class="qr-fallback">${text}</div>`}</div>
          <div class="qr-info"><b>Tipo:</b> ${tipo}<br/><b>Precio:</b> ${precio}</div>
        </div>
      `;
    }).join('');

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              margin:0; padding:0; font-family: Arial, Helvetica, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#111827;
            }
            .watermark-overlay {
              position: fixed;
              top: 0; left: 0; width: 100vw; height: 100vh;
              z-index: 0;
              pointer-events: none;
              user-select: none;
            }
            .watermark-text {
              position: absolute;
              font-size: 48px;
              color: #ebebeb; /* color pedido */
              font-weight: 700;
              opacity: 0.6; /* aumentar visibilidad manteniendo sutileza */
              transform: rotate(-18deg);
              white-space: nowrap;
              pointer-events: none;
              user-select: none;
            }
            .wrap { max-width: 600px; margin: 0 auto; position: relative; z-index: 1; }
            .header {
              display:flex; align-items:center; justify-content:space-between;
              padding: 10px 0 12px; border-bottom: 2px solid #0F172A;
            }
            .header-title { font-weight: 700; font-size: 20px; color:#111; }
            .logo-ra { width: 54px; height: 54px; object-fit: contain; border-radius: 8px; }
            .event-link, .event-title-violet { color: #6C2BD7 !important; text-decoration: none; font-weight: bold; }
            .event-data { margin: 18px 0 10px; font-size: 15px; }
            .event-data .icon { margin-right: 6px; }
            .event-data-row { margin-bottom: 4px; display: flex; align-items: center; }
            .event-data-label { font-weight: bold; margin-right: 4px; }
            .qr-section { margin: 32px 0 0 0; text-align: center; }
            .qr-img img { width: 220px; height: 220px; max-width: 90vw; max-height: 220px; }
            .qr-info { margin-top: 10px; font-size: 16px; }
            hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 0 0; }
          </style>
        </head>
        <body>
          <div class="watermark-overlay">
            <!-- Filas diagonales estructuradas: 12 marcas distribuidas ordenadamente -->
            <span class="watermark-text" style="top:6%; left:6%;">RaveApp</span>
            <span class="watermark-text" style="top:22%; left:28%;">RaveApp</span>
            <span class="watermark-text" style="top:38%; left:50%;">RaveApp</span>
            <span class="watermark-text" style="top:54%; left:72%;">RaveApp</span>

            <span class="watermark-text" style="top:12%; left:38%;">RaveApp</span>
            <span class="watermark-text" style="top:28%; left:60%;">RaveApp</span>
            <span class="watermark-text" style="top:44%; left:82%;">RaveApp</span>

            <span class="watermark-text" style="top:68%; left:10%;">RaveApp</span>
            <span class="watermark-text" style="top:80%; left:34%;">RaveApp</span>
            <span class="watermark-text" style="top:86%; left:58%;">RaveApp</span>
            <span class="watermark-text" style="top:72%; left:76%;">RaveApp</span>
            <span class="watermark-text" style="top:48%; left:18%;">RaveApp</span>
          </div>
          <div class="wrap">
            <div class="header">
              <div class="header-title">${headerTitle}</div>
              <img class="logo-ra" src="${LOGO_BASE64}" alt="RA" />
            </div>
            <div class="event-data">
              <div class="event-data-row"><span class="event-data-label">Evento:</span> ${eventLink ? `<a class="event-link event-title-violet" href="${eventLink}">${ev.title}</a>` : `<span class="event-title-violet">${ev.title}</span>`}</div>
              <div class="event-data-row"><span class="event-data-label">Fecha y hora:</span> ${fechaHora}</div>
              <div class="event-data-row"><span class="event-data-label">Dirección:</span> ${address}</div>
              ${artistas ? `<div class="event-data-row"><span class="event-data-label">Artistas:</span> ${artistas}</div>` : ''}
            </div>
            <hr/>
            ${sections}
          </div>
        </body>
      </html>`;
  };

  // Determinar si TODAS las entradas están controladas
  const controlledMatch = useMemo(
    () => (s?: string) => {
      const t = (s || '').toLowerCase();
      return (
        t.includes('controlada') ||
        t.includes('controlado') ||
        t.includes('verificada') ||
        t.includes('escaneada') ||
        t.includes('canjeada')
      );
    },
    []
  );
  const allControlled = useMemo(
    () => entries.length > 0 && entries.every((e: any) => controlledMatch(e?.estadoDs)),
    [entries, controlledMatch]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <CirculoCarga visible text="Cargando entradas..." />
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Ticket no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Mis Entradas" />

  <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={getSafeImageSource(eventData.imageUrl)} style={styles.eventImage} />

        <Text style={styles.title}>{eventData.title}</Text>
        {typeof ticketsCount === 'number' && ticketsCount > 1 ? (
          <Text style={styles.countBadge}>x{ticketsCount} entradas</Text>
        ) : null}

        {/* Información del evento */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información del Evento</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{eventData.date}</Text>
          </View>
          {!!eventData.timeRange && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-time-three-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{eventData.timeRange}</Text>
            </View>
          )}
          {addressDisplay ? (
            <TouchableOpacity style={styles.infoRow} onPress={openMapsDirections} activeOpacity={0.8}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.infoText, styles.linkText]}>{addressDisplay}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Artistas (si hay) */}
        {Array.isArray((eventData as any)?.artistas) && (eventData as any).artistas.length > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Artistas</Text>
            {((eventData as any).artistas as any[]).map((a, idx) => {
              const name = a?.name || a?.nombre || a?.dsNombre || String(a?.idArtista || a?.id || idx);
              return (
                <View key={`${name}-${idx}`} style={styles.infoRow}>
                  <MaterialCommunityIcons name="music-note-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoText}>{name}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Descripción */}
        {!!eventData.description && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.sectionText}>{eventData.description}</Text>
          </View>
        )}

        {/* Mis Entradas */}
        {(() => {
          if (allControlled) {
            // Agrupar por tipo y precio para mostrar cantidad x precio
            const groups = new Map<string, { tipo: string; precio?: number; count: number }>();
            entries.forEach((e) => {
              const tipo = e.tipoDs ?? (e.tipoCd ?? 'Entrada');
              const key = `${String(tipo)}__${typeof e.precio === 'number' ? e.precio : ''}`;
              const g = groups.get(key) || { tipo: String(tipo), precio: e.precio, count: 0 };
              g.count += 1;
              groups.set(key, g);
            });
            const valido = formatDateEs(eventData.date);
            const formatMoney = (n?: number) => (typeof n === 'number' && !isNaN(n) ? `$${n}` : '');
            return (
              <>
                <View style={[styles.infoCard, { paddingBottom: 12 }]}> 
                  <Text style={styles.sectionTitle}>Mis Entradas</Text>
                  <View style={{ width: '100%', rowGap: 10 }}>
                    {Array.from(groups.values()).map((g, idx) => (
                      <View key={`${g.tipo}-${g.precio}-${idx}`} style={styles.controlRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.entryHeaderLeft}>{g.tipo}</Text>
                          <Text style={styles.entryPriceLine}>
                            {formatMoney(g.precio)} {g.precio ? '×' : ''} {g.count} {g.count === 1 ? 'entrada' : 'entradas'}
                          </Text>
                        </View>
                        <View style={styles.statusWrap}>
                          <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={styles.statusText}>Controlada</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Botón Dejar reseña */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    if (userReview) {
                      setRating(Number(userReview.estrellas || 0));
                      setComment(String(userReview.comentario || ''));
                      setReadOnlyReview(true);
                      setShowReview(true);
                    } else {
                      setRating(0);
                      setComment("");
                      setReadOnlyReview(false);
                      setShowReview(true);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="star" size={18} color={COLORS.backgroundLight} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>{userReview ? 'Ver reseña' : 'Dejar reseña'}</Text>
                </TouchableOpacity>
              </>
            );
          }

          // Caso no controladas: UI actual con QR
          return (
            <>
              <View style={[styles.infoCard, { paddingBottom: 8 }]}> 
                <Text style={styles.sectionTitle}>Mis Entradas</Text>
                {entries.length === 0 ? (
                  <Text style={styles.noEntriesText}>No se encontraron entradas para este evento.</Text>
                ) : (
                  <View style={{ width: '100%', rowGap: 12 }}>
                    {entries.map((en, idx) => {
                      const qrText = en.mdQR || `Entrada:${en.idEntrada}|Evento:${eventData.id}|Fecha:${en.idFecha ?? ''}`;
                      const tipo = en.tipoDs ?? (en.tipoCd ?? 'Entrada');
                      const ticketNumber = Number.isFinite(en.nroEntrada as number) ? (en.nroEntrada as number) : (idx + 1);
                      const code = formatTicketCode(ticketNumber);
                      const price = typeof en.precio === 'number' ? `$${en.precio}` : '';
                      const valido = formatDateEs(eventData.date);
                      return (
                        <View key={`${en.idEntrada}-${idx}`} style={styles.entryCard}>
                          <View style={styles.entryHeaderRow}>
                            <Text style={styles.entryHeaderLeft}>{String(tipo)}</Text>
                            <Text style={styles.entryHeaderRight}>{code}</Text>
                          </View>
                          <Text style={styles.entryPriceLine}>{price}</Text>
                          <View style={{ alignItems: 'center', marginTop: 6 }}>
                            {en.qrImageUrl ? (
                              <Image
                                source={{ uri: en.qrImageUrl }}
                                style={{ width: QR_SIZE, height: QR_SIZE, resizeMode: 'contain' }}
                                accessible
                                accessibilityLabel={`QR ${code}`}
                              />
                            ) : (
                              <QRCode
                                value={qrText}
                                size={QR_SIZE}
                                color={COLORS.textPrimary}
                                backgroundColor={COLORS.cardBg}
                                getRef={(c: any) => { if (c) { qrRefs.current[en.idEntrada] = c; } }}
                              />
                            )}
                          </View>
                          {/* Se removieron idEntrada, idMedia y la leyenda de validez por solicitud */}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Botón principal Descargar PDF (todas las entradas) */}
              {entries.length > 0 && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleDownloadAll} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="download" size={18} color={COLORS.backgroundLight} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Descargar PDF</Text>
                </TouchableOpacity>
              )}
            </>
          );
        })()}

        {/* Botón secundario Cómo llegar (outline) - ocultar si todas controladas */}
        {!allControlled && (
          <TouchableOpacity style={styles.secondaryButton} onPress={openMapsDirections} activeOpacity={0.85}>
            <MaterialCommunityIcons name="navigation-variant" size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Cómo llegar</Text>
          </TouchableOpacity>
        )}

        {/* Nota para reseña - ocultar si todas controladas */}
        {!allControlled && (
          <Text style={styles.reviewNote}>
            * Una vez finalizado el evento, podrás dejar tu reseña...
          </Text>
        )}

        {/* Descripción adicional ya mostrada arriba */}
      </ScrollView>

      {/* Modal reseña */}
      <Modal visible={showReview} transparent animationType="fade" onRequestClose={() => !submitting && setShowReview(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Deja tu reseña</Text>
            <Text style={styles.modalSubtitle}>
              Has asistido a un evento de la fiesta {eventData?.title}. Si lo deseas, puedes dejar tu reseña sobre la fiesta.
            </Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => !readOnlyReview && setRating(n)} disabled={submitting || readOnlyReview}>
                  <MaterialCommunityIcons
                    name={rating >= n ? 'star' : 'star-outline'}
                    size={28}
                    color="#fbbf24"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Comparte tu experiencia sobre la fiesta..."
              placeholderTextColor={COLORS.textSecondary}
              value={comment}
              onChangeText={setComment}
              editable={!submitting && !readOnlyReview}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => !submitting && setShowReview(false)} disabled={submitting}>
                <Text style={styles.btnGhostText}>Cerrar</Text>
              </TouchableOpacity>
              {!readOnlyReview && (
                <TouchableOpacity
                  style={[
                    styles.btnPrimary,
                    { opacity: rating > 0 && (comment?.trim()?.length ?? 0) > 0 && !submitting ? 1 : 0.6 },
                  ]}
                  onPress={handleSubmitReview}
                  disabled={rating <= 0 || (comment?.trim()?.length ?? 0) === 0 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.backgroundLight} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Enviar reseña</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

export default function TicketPurchasedScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <TicketPurchasedScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  loaderWrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  eventImage: {
    width: screenWidth - 32,
    height: 200,
    borderRadius: RADIUS.card,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  qrSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    marginBottom: 16,
    width: "100%",
  },
  ticketInfo: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: FONT_SIZES.body * 1.5,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  mapButtonText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
    textAlign: "center",
  },
  reviewNote: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: FONT_SIZES.smallText * 1.4,
  },
  descriptionSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
    width: "100%",
  },
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.5,
    textAlign: "justify",
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
    width: "100%",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    marginLeft: 8,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 'auto',
  },
  linkText: {
    color: COLORS.primary,
  },
  countBadge: {
    marginTop: -8,
    marginBottom: 12,
    backgroundColor: COLORS.alternative,
    color: COLORS.cardBg,
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    fontFamily: FONTS.subTitleMedium,
  },
  entryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
    width: '100%'
  },
  entryTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryHeaderLeft: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  entryHeaderRight: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  entryPriceLine: {
    marginTop: 2,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  entryValidText: {
    marginTop: 6,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  entryIdsLine: {
    marginTop: 6,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noEntriesText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  },
  // Fila compacta para estado Controlada
  controlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 12,
    backgroundColor: COLORS.cardBg,
  },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10 },
  statusText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular },
  primaryButton: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  // Modal reseña
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  modalTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
    minHeight: 90,
    textAlignVertical: 'top',
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    columnGap: 10,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  btnGhostText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.textPrimary,
  },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.textPrimary,
  },
  btnPrimaryText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
});
