import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";

import { updateEstadoPorCompra, updateEstadoPorEntrada, getEstadoMap } from "@/app/events/apis/entradaApi";
import { useAuth } from '@/app/auth/AuthContext';
import { getEntradasUsuario } from '@/app/auth/userHelpers';

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import ROUTES from "@/routes";

export default function VueltaCompraPantalla() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const compraId = id ? String(id) : undefined;
        if (!compraId) return;
        setProcessing(true);
        // Intentar resolver el código de estado para "pagado" consultando los estados conocidos
        let estadoCode: number | undefined;
        try {
          const map = await getEstadoMap();
          for (const [code, name] of map.entries()) {
            const n = String(name || "").toLowerCase();
            if (n.includes("pag") || n.includes("pago") || n.includes("pagado") || n.includes("pagada") || n.includes("pagadas")) {
              estadoCode = Number(code);
              break;
            }
          }
        } catch (e) {
          // ignore
        }
  // fallback a 4 (estado 'PAGA') si no encontramos mapeo
  if (typeof estadoCode === "undefined") estadoCode = 4;

        // Primero intentamos localizar las entradas creadas asociadas a esta compra
        try {
          const uid: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
          let entradas: any[] = [];

          if (uid) {
            try {
              entradas = await getEntradasUsuario(String(uid)).catch(() => []);
            } catch (e) {
              console.warn('[VueltaCompraPantalla] getEntradasUsuario error:', e);
              entradas = [];
            }
          }

          // Filtrar entradas que pertenezcan a la compra (acomodar varios nombres de campo)
          const matched = (entradas || []).filter((it: any) => {
            const idc = it?.idCompra ?? it?.IdCompra ?? it?.compraId ?? it?.purchaseId ?? it?.id_compra ?? it?.compra?.idCompra ?? it?.pago?.idCompra;
            return idc && String(idc) === String(compraId);
          });

          if (matched.length > 0) {
            // Actualizar cada entrada por su id
            for (const m of matched) {
              const idEntrada = m?.idEntrada ?? m?.IdEntrada ?? m?.id ?? m?.entradaId ?? m?.id_entrada ?? m?.entrada?.idEntrada;
              if (idEntrada) {
                try {
                  await updateEstadoPorEntrada(String(idEntrada), estadoCode);
                  console.log('[VueltaCompraPantalla] Entrada marcada como pagada:', idEntrada);
                } catch (err) {
                  console.warn('[VueltaCompraPantalla] Error actualizando entrada', idEntrada, err);
                }
              }
            }
            console.log("[VueltaCompraPantalla] Estado actualizado para compra:", compraId, "->", estadoCode);
          } else {
            // Si no encontramos entradas por usuario+compra, intentamos el endpoint por compra (si existe)
            try {
              await updateEstadoPorCompra(compraId, estadoCode);
              console.log('[VueltaCompraPantalla] updateEstadoPorCompra ok for compraId', compraId);
            } catch (err) {
              console.warn('[VueltaCompraPantalla] updateEstadoPorCompra failed:', err);
              Alert.alert('Pago recibido', "Hemos recibido la confirmación del pago. Si no ves tu entrada en 'Mis entradas', contactá con soporte.");
            }
          }
        } catch (e) {
          console.warn('[VueltaCompraPantalla] Error procesando actualización de estado:', e);
          try {
            await updateEstadoPorCompra(compraId, estadoCode);
          } catch (err) {
            console.warn('[VueltaCompraPantalla] updateEstadoPorCompra fallback failed:', err);
            Alert.alert('Pago recibido', "Hemos recibido la confirmación del pago. Si no ves tu entrada en 'Mis entradas', contactá con soporte.");
          }
        }
      } finally {
        setProcessing(false);
      }
    })();
  }, [id]);

  const handleGoToTickets = () => {
    router.replace(ROUTES.MAIN.TICKETS.MENU);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.title}>¡Gracias por tu compra!</Text>
          <Text style={styles.subtitle}>
            Una vez que se procese el pago, recibirás por mail la entrada del evento, y también
            podrás ver tu entrada en la sección <Text style={styles.link} onPress={handleGoToTickets}>mis entradas</Text>.
          </Text>
        </View>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "94%",
    backgroundColor: "#EFFFF3",
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#BDE5C8",
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CFF6DA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconText: {
    color: "#2E7D32",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: FONT_SIZES.body * 1.4,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
