import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { Portal } from "react-native-paper";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { getTycPdfUrl } from "@/app/tyc/api/tycApi";

// Componente reutilizable que muestra el texto de TyC y abre un modal
// con el PDF incrustado (WebView / iframe / fallback a abrir en navegador).
export default function InfoTyc() {
  const [tycVisible, setTycVisible] = useState(false);
  const [tycUrl, setTycUrl] = useState<string | null>(null);
  const [tycLoading, setTycLoading] = useState(false);
  const [tycError, setTycError] = useState<string | null>(null);

  const buildViewerUrl = (url: string) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
        url
      )}`;
    }
    return url;
  };

  const openTycModal = async () => {
    setTycVisible(true);
    setTycError(null);
    try {
      setTycLoading(true);
      const url = await getTycPdfUrl();
      setTycUrl(url);
    } catch (e: any) {
      setTycError(e?.message || "No se pudo cargar el archivo.");
    } finally {
      setTycLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>
          Al continuar, aceptas nuestros{" "}
          <Text style={styles.link} onPress={openTycModal}>
            Terminos y condiciones, y tambien nuestra Politica de privacidad
          </Text>
        </Text>
      </View>

      <Portal>
        {tycVisible && (
          <View style={styles.portalWrapper} pointerEvents="box-none">
            {Platform.OS === "ios" ? (
              <BlurView intensity={20} style={styles.modalBlurBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Términos y Condiciones
                    </Text>
                    <TouchableOpacity onPress={() => setTycVisible(false)}>
                      <MaterialCommunityIcons
                        name="close"
                        size={22}
                        color={COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    {tycLoading && (
                      <View style={styles.center}>
                        <ActivityIndicator />
                        <Text
                          style={{ marginTop: 8, color: COLORS.textSecondary }}
                        >
                          Cargando…
                        </Text>
                      </View>
                    )}
                    {!tycLoading && !tycError && !tycUrl && (
                      <View style={styles.center}>
                        <Text style={{ color: COLORS.textSecondary }}>
                          No hay archivo disponible.
                        </Text>
                      </View>
                    )}
                    {!tycLoading && tycError && (
                      <View style={styles.center}>
                        <Text
                          style={{ color: COLORS.negative, marginBottom: 8 }}
                        >
                          {tycError}
                        </Text>
                        <TouchableOpacity
                          style={styles.fileBtn}
                          onPress={openTycModal}
                        >
                          <Text style={styles.fileBtnText}>Reintentar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {!tycLoading && tycUrl && (
                      <>
                        {(() => {
                          let WebViewComp: any = null;
                          try {
                            WebViewComp =
                              require("react-native-webview").WebView;
                          } catch {}
                          if (WebViewComp) {
                            return (
                              <WebViewComp
                                source={{ uri: buildViewerUrl(tycUrl!) }}
                                style={{ flex: 1, borderRadius: RADIUS.card }}
                              />
                            );
                          }
                          // @ts-ignore - iframe sólo web
                          if (Platform.OS === "web") {
                            // @ts-ignore – iframe sólo web
                            return (
                              <iframe
                                src={buildViewerUrl(tycUrl!)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                }}
                                title="Términos y Condiciones"
                              />
                            );
                          }
                          return (
                            <View style={styles.center}>
                              <Text
                                style={{
                                  color: COLORS.textSecondary,
                                  marginBottom: 10,
                                }}
                              >
                                No se pudo incrustar el PDF en este dispositivo.
                              </Text>
                              <TouchableOpacity
                                style={styles.fileBtn}
                                onPress={() => Linking.openURL(tycUrl!)}
                              >
                                <Text style={styles.fileBtnText}>
                                  Abrir en el navegador
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })()}
                      </>
                    )}
                  </View>
                </View>
              </BlurView>
            ) : (
              <View style={styles.modalBackdrop} pointerEvents="box-none">
                <BlurView
                  intensity={100}
                  tint="dark"
                  style={[styles.absoluteFill, { zIndex: 10000 } as any]}
                  collapsable={false}
                />
                <View style={styles.darkOverlay} />
                <View
                  style={styles.modalContentWrapper}
                  pointerEvents="box-none"
                >
                  <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        Términos y Condiciones
                      </Text>
                      <TouchableOpacity onPress={() => setTycVisible(false)}>
                        <MaterialCommunityIcons
                          name="close"
                          size={22}
                          color={COLORS.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                      {tycLoading && (
                        <View style={styles.center}>
                          <ActivityIndicator />
                          <Text
                            style={{
                              marginTop: 8,
                              color: COLORS.textSecondary,
                            }}
                          >
                            Cargando…
                          </Text>
                        </View>
                      )}
                      {!tycLoading && !tycError && !tycUrl && (
                        <View style={styles.center}>
                          <Text style={{ color: COLORS.textSecondary }}>
                            No hay archivo disponible.
                          </Text>
                        </View>
                      )}
                      {!tycLoading && tycError && (
                        <View style={styles.center}>
                          <Text
                            style={{ color: COLORS.negative, marginBottom: 8 }}
                          >
                            {tycError}
                          </Text>
                          <TouchableOpacity
                            style={styles.fileBtn}
                            onPress={openTycModal}
                          >
                            <Text style={styles.fileBtnText}>Reintentar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {!tycLoading && tycUrl && (
                        <>
                          {(() => {
                            let WebViewComp: any = null;
                            try {
                              WebViewComp =
                                require("react-native-webview").WebView;
                            } catch {}
                            if (WebViewComp) {
                              return (
                                <WebViewComp
                                  source={{ uri: buildViewerUrl(tycUrl!) }}
                                  style={{ flex: 1, borderRadius: RADIUS.card }}
                                />
                              );
                            }
                            // @ts-ignore - iframe sólo web
                            if (Platform.OS === "web") {
                              // @ts-ignore – iframe sólo web
                              return (
                                <iframe
                                  src={buildViewerUrl(tycUrl!)}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                  }}
                                  title="Términos y Condiciones"
                                />
                              );
                            }
                            return (
                              <View style={styles.center}>
                                <Text
                                  style={{
                                    color: COLORS.textSecondary,
                                    marginBottom: 10,
                                  }}
                                >
                                  No se pudo incrustar el PDF en este
                                  dispositivo.
                                </Text>
                                <TouchableOpacity
                                  style={styles.fileBtn}
                                  onPress={() => Linking.openURL(tycUrl!)}
                                >
                                  <Text style={styles.fileBtnText}>
                                    Abrir en el navegador
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })()}
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 8 },
  text: { color: COLORS.textSecondary, fontSize: FONT_SIZES.smallText },
  link: { color: COLORS.info, textDecorationLine: "underline" },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 16,
  },
  modalBlurBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  portalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  absoluteFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  modalContentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 16,
    zIndex: 10001,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    maxHeight: "90%",
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: COLORS.textPrimary, fontWeight: "700" },
  modalBody: { width: 320, height: 460, padding: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  fileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  fileBtnText: { color: COLORS.cardBg, fontWeight: "700" },
});
