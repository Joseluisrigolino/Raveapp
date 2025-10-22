// app/main/TicketsScreens/TicketPurchasedScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Image, Text, StyleSheet, TouchableOpacity, View, ActivityIndicator, Dimensions, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CirculoCarga from "@/components/general/CirculoCarga";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchEventById, EventItemWithExtras } from "@/utils/events/eventApi";
import { getEntradasUsuario } from "@/utils/auth/userHelpers";
import { getTipoMap } from "@/utils/events/entradaApi";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

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
};

function TicketPurchasedScreenContent() {
  const { id, eventId, count } = useLocalSearchParams<{ id?: string; eventId?: string; count?: string }>();
  const { user } = useAuth();
  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketsCount = typeof count === "string" && count.trim() ? Number(count) : undefined;
  const [entries, setEntries] = useState<UiUserEntry[]>([]);
  const qrRefs = useRef<Record<string, any>>({});

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

        // Cargar entradas del usuario y filtrar por el evento actual
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

          const filtered = (Array.isArray(raw) ? raw : []).filter((r) => {
            const eid = getEventId(r);
            return eid && eventId ? String(eid) === String(eventId) : false;
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
            return {
              idEntrada,
              idFecha: idFecha || undefined,
              mdQR,
              tipoCd: Number.isFinite(tipoCd) ? (tipoCd as number) : undefined,
              tipoDs,
              precio: Number.isFinite(precio) ? (precio as number) : undefined,
              nroEntrada: Number.isFinite(nroEntradaRaw) ? (nroEntradaRaw as number) : undefined,
            };
          });
          setEntries(mapped);
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
    const qrText = entry.mdQR || `Entrada:${entry.idEntrada}|Evento:${eventData.id}|Fecha:${entry.idFecha ?? ""}`;

    // Capturar el QR renderizado como base64 para embebido en el PDF
    const qrDataUrl: string | undefined = await new Promise((resolve) => {
      try {
        const ref = qrRefs.current[entry.idEntrada];
        if (ref && typeof ref.toDataURL === 'function') {
          ref.toDataURL((data: string) => resolve(`data:image/png;base64,${data}`));
        } else {
          resolve(undefined);
        }
      } catch {
        resolve(undefined);
      }
    });

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f8fa; margin: 0; padding: 0; }
            .card { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 18mm; box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
            .title { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 12px; color: #111827; }
            .subtitle { font-size: 14px; text-align: center; color: #6b7280; margin: 0 0 16px; }
            .hero { text-align: center; margin: 4mm 0 6mm; }
            .hero img { max-width: 100%; border-radius: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .item { background: #f9fafb; border-radius: 8px; padding: 10px 12px; }
            .item b { color: #374151; }
            .qrWrap { text-align: center; padding: 8mm 0; }
            .qrWrap img { width: 70mm; height: 70mm; image-rendering: pixelated; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 12px; }
            .note { background: #eef2ff; color: #3730a3; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">Entrada a: ${eventData.title}</h1>
            <p class="subtitle">Mostrá este QR en puerta para validar tu acceso</p>
            <div class="hero">
              <img src="${eventData.imageUrl}" alt="Evento" />
            </div>
            <div class="grid">
              <div class="item"><b>Evento ID:</b><br />${eventData.id}</div>
              <div class="item"><b>Entrada ID:</b><br />${entry.idEntrada}</div>
              <div class="item"><b>Fecha:</b><br />${eventData.date}</div>
              <div class="item"><b>Horario:</b><br />${eventData.timeRange || "-"}</div>
              <div class="item"><b>Tipo:</b><br />${entry.tipoDs ?? (entry.tipoCd ?? "-")}</div>
              <div class="item"><b>Precio:</b><br />${typeof entry.precio === 'number' ? `$${entry.precio}` : '-'}</div>
            </div>
            <div class="qrWrap">
              ${qrDataUrl
                ? `<img src="${qrDataUrl}" alt="QR" />`
                : `<div class="note">No se pudo generar la imagen del QR automáticamente. Presentá este texto: <br/><br/><code>${qrText}</code></div>`}
            </div>
            <div class="footer">Raveapp · Ticket digital</div>
          </div>
        </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  };

  // Generar UN SOLO PDF con TODAS las entradas para evitar múltiples diálogos de compartir
  const handleDownloadAll = async () => {
    if (!eventData || !entries.length) return;

    // Obtener dataURL para cada QR ya renderizado
    const qrImages: { entry: UiUserEntry; dataUrl?: string; text: string }[] = [];
    for (const e of entries) {
      const qrText = e.mdQR || `Entrada:${e.idEntrada}|Evento:${eventData.id}|Fecha:${e.idFecha ?? ''}`;
      let dataUrl: string | undefined;
      try {
        const ref = qrRefs.current[e.idEntrada];
        if (ref && typeof ref.toDataURL === 'function') {
          // eslint-disable-next-line no-await-in-loop
          dataUrl = await new Promise<string>((resolve) => ref.toDataURL((data: string) => resolve(`data:image/png;base64,${data}`)));
        }
      } catch {}
      qrImages.push({ entry: e, dataUrl, text: qrText });
    }

    const htmlSections = qrImages.map(({ entry, dataUrl, text }, idx) => {
      const tipo = entry.tipoDs ?? (entry.tipoCd ?? 'Entrada');
      const ticketNumber = Number.isFinite(entry.nroEntrada as number) ? (entry.nroEntrada as number) : (idx + 1);
      const code = formatTicketCode(ticketNumber);
      const price = typeof entry.precio === 'number' ? `$${entry.precio}` : '';
      const valido = formatDateEs(eventData.date);
      return `
        <div class="entry">
          <div class="row">
            <div class="left">${tipo}</div>
            <div class="right">${code}</div>
          </div>
          <div class="sub">${price}</div>
          <div class="qr">${dataUrl ? `<img src="${dataUrl}" alt="QR" />` : `<div class="note">${text}</div>`}</div>
          <div class="valid">Entrada válida para el ${valido}</div>
        </div>`;
    }).join('\n');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f8fa; margin: 0; padding: 0; }
            .card { max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 18mm; box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
            .title { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 12px; color: #111827; }
            .hero { text-align: center; margin: 4mm 0 6mm; }
            .hero img { max-width: 100%; border-radius: 10px; }
            .entry { border-top: 1px solid #eee; padding-top: 5mm; margin-top: 5mm; page-break-inside: avoid; }
            .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
            .left { font-weight: 600; color: #111827; }
            .right { color: #6b7280; font-weight: 600; }
            .sub { color: #374151; font-size: 14px; margin: 2mm 0 4mm; text-align: center; }
            .qr { text-align: center; margin: 4mm 0 3mm; }
            .qr img { width: 70mm; height: 70mm; image-rendering: pixelated; }
            .note { background: #eef2ff; color: #3730a3; border-radius: 8px; padding: 8px 10px; font-size: 12px; text-align: center; }
            .valid { color: #6b7280; font-size: 12px; text-align: center; margin-bottom: 2mm; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">${eventData.title}</h1>
            <div class="hero"><img src="${eventData.imageUrl}" alt="Evento" /></div>
            ${htmlSections}
          </div>
        </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err) {
      console.error('Error generando PDF combinado:', err);
    }
  }

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
                      <QRCode
                        value={qrText}
                        size={QR_SIZE}
                        color={COLORS.textPrimary}
                        backgroundColor={COLORS.cardBg}
                        getRef={(c: any) => { if (c) { qrRefs.current[en.idEntrada] = c; } }}
                      />
                    </View>
                    <Text style={styles.entryValidText}>Entrada válida para el {valido}</Text>
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

        {/* Botón secundario Cómo llegar (outline) */}
        <TouchableOpacity style={styles.secondaryButton} onPress={openMapsDirections} activeOpacity={0.85}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>Cómo llegar</Text>
        </TouchableOpacity>

        <Text style={styles.reviewNote}>
          * Una vez finalizado el evento, podrás dejar tu reseña...
        </Text>

        {/* Descripción adicional ya mostrada arriba */}
      </ScrollView>

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
  noEntriesText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  },
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
  }
});
