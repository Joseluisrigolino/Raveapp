// app/main/TicketsScreens/TicketPurchasedScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Image, Text, StyleSheet, TouchableOpacity, View, ActivityIndicator, Dimensions, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchEventById, EventItemWithExtras } from "@/utils/events/eventApi";
import { getEntradasUsuario } from "@/utils/auth/userHelpers";
import { getTipoMap } from "@/utils/events/entradaApi";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

const screenWidth = Dimensions.get("window").width;
const QR_SIZE = 140;

type UiUserEntry = {
  idEntrada: string;
  idFecha?: string;
  mdQR?: string;
  tipoCd?: number;
  tipoDs?: string;
  precio?: number;
};

function TicketPurchasedScreenContent() {
  const { id, eventId, count } = useLocalSearchParams<{ id?: string; eventId?: string; count?: string }>();
  const { user } = useAuth();
  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketsCount = typeof count === "string" && count.trim() ? Number(count) : undefined;
  const [entries, setEntries] = useState<UiUserEntry[]>([]);
  const qrRefs = useRef<Record<string, any>>({});

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
            return {
              idEntrada,
              idFecha: idFecha || undefined,
              mdQR,
              tipoCd: Number.isFinite(tipoCd) ? (tipoCd as number) : undefined,
              tipoDs,
              precio: Number.isFinite(precio) ? (precio as number) : undefined,
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f8fa; margin: 0; padding: 24px; }
            .card { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
            .title { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 12px; color: #111827; }
            .subtitle { font-size: 14px; text-align: center; color: #6b7280; margin: 0 0 16px; }
            .hero { text-align: center; margin-bottom: 16px; }
            .hero img { max-width: 100%; border-radius: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .item { background: #f9fafb; border-radius: 8px; padding: 10px 12px; }
            .item b { color: #374151; }
            .qrWrap { text-align: center; padding: 16px 0; }
            .qrWrap img { width: 340px; height: 340px; image-rendering: pixelated; }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <View style={styles.notFoundContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
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
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: eventData.imageUrl }} style={styles.eventImage} />

        <Text style={styles.title}>Entrada a: {eventData.title}</Text>
        {typeof ticketsCount === 'number' && ticketsCount > 1 ? (
          <Text style={styles.countBadge}>x{ticketsCount} entradas</Text>
        ) : null}

        {entries.length === 0 ? (
          <Text style={styles.noEntriesText}>No se encontraron entradas para este evento.</Text>
        ) : (
          <View style={{ width: '100%', rowGap: 12 }}>
            {entries.map((en, idx) => {
              const qrText = en.mdQR || `Entrada:${en.idEntrada}|Evento:${eventData.id}|Fecha:${en.idFecha ?? ''}`;
              return (
                <View key={`${en.idEntrada}-${idx}`} style={styles.entryCard}>
                  <Text style={styles.entryTitle}>Entrada #{idx + 1}</Text>
                  <View style={{ alignItems: 'center' }}>
                    <QRCode
                      value={qrText}
                      size={QR_SIZE}
                      color={COLORS.textPrimary}
                      backgroundColor={COLORS.cardBg}
                      getRef={(c: any) => { if (c) { qrRefs.current[en.idEntrada] = c; } }}
                    />
                  </View>
                  <Text style={styles.entryInfo}>
                    🆔 {en.idEntrada}{"\n"}
                    🏷️ {en.tipoDs ?? (en.tipoCd ?? '')}{"\n"}
                    💵 {typeof en.precio === 'number' ? `$${en.precio}` : ''}{"\n"}
                    📅 {eventData.date} {eventData.timeRange ? `· ${eventData.timeRange}` : ''}
                  </Text>
                  <TouchableOpacity
                    style={[styles.mapButton, { marginTop: 6 }]}
                    onPress={() => handleDownloadEntryPDF(en)}
                  >
                    <Text style={styles.mapButtonText}>Descargar entrada (PDF)</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                eventData.title
              )}`
            )
          }
        >
          <Text style={styles.mapButtonText}>Cómo llegar</Text>
        </TouchableOpacity>

        <Text style={styles.reviewNote}>
          * Una vez finalizado el evento, podrás dejar tu reseña...
        </Text>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción del evento</Text>
          <Text style={styles.sectionText}>
            {eventData.description || ""}
          </Text>
        </View>
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
  entryInfo: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: FONT_SIZES.body * 1.5,
  },
  noEntriesText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  }
});
