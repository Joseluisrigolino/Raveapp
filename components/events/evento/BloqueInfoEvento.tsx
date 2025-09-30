import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { styles } from "./styles";

type Artista = { nombre?: string };

type FechaLite = { idFecha?: string; inicio?: string; fin?: string };
type Props = {
  artistas?: Artista[];
  // legacy single-date props (fallback)
  date?: string;
  timeRange?: string;
  // new multi-date support
  fechas?: FechaLite[];
  address?: string;
  onSeeAllArtists?: () => void;
  onCómoLlegar?: () => void;
};

export default function BloqueInfoEvento({ artistas = [], date, timeRange, fechas, address, onSeeAllArtists, onCómoLlegar }: Props) {
  // Helper: formatear fecha (dd/MM/yyyy) y hora en formato corto con am/pm (local 'es-AR')
  const fmtDate = (iso?: string) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso || "";
    }
  };

  const fmtTime = (iso?: string) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      // hour12 por defecto en es-AR, fuerza formato HH:MM a.m./p.m.
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <View style={styles.eventInfoBlockImproved}>
      {artistas && artistas.length > 0 && (
        <View style={styles.artistRowImproved}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="volume-high" size={18} color="#222" />
          </View>
          <Text style={styles.infoLabel}>Artistas:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {artistas.slice(0, 2).map((a) => a.nombre).join(", ")}
            {artistas.length > 2 ? "..." : null}
          </Text>
          {artistas.length > 2 && (
            <TouchableOpacity style={styles.seeAllArtistsBtn} onPress={onSeeAllArtists}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Fechas: si vienen múltiples fechas las mostramos todas con su horario */}
      {Array.isArray(fechas) && fechas.length > 0 ? (
        fechas.map((f, idx) => {
          const fechaTxt = fmtDate(f.inicio);
          const inicioTxt = fmtTime(f.inicio);
          const finTxt = fmtTime(f.fin);
          const timeRangeCombined = inicioTxt ? (finTxt ? `${inicioTxt} - ${finTxt}` : inicioTxt) : "";
          const combined = [fechaTxt, timeRangeCombined].filter(Boolean).join("  •  ");
          return (
            <View style={styles.infoRowCompact} key={f.idFecha || idx}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="calendar-month" size={16} color="#222" />
              </View>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>{combined}</Text>
            </View>
          );
        })
      ) : (
        // Fallback a props legacy
        <>
          <View style={styles.infoRowCompact}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="calendar-month" size={16} color="#222" />
            </View>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{date}</Text>
          </View>

          <View style={styles.infoRowCompact}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#222" />
            </View>
            <Text style={styles.infoLabel}>Horario:</Text>
            <Text style={styles.infoValue}>{timeRange}</Text>
          </View>
        </>
      )}

      <View style={styles.infoRowCompact}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
        </View>
        <Text style={styles.infoValue} numberOfLines={2} ellipsizeMode="tail">{address}</Text>
        <TouchableOpacity style={[styles.arrivalBtnImproved, { marginLeft: 12, paddingHorizontal: 16 }]} activeOpacity={0.9} onPress={onCómoLlegar}>
          <Text style={styles.arrivalBtnTextImproved}>CÓMO LLEGAR</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
