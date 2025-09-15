// components/events/create/LocationSelector.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";

interface Option {
  id: string;
  nombre: string;
}

interface Props {
  provinces: Option[];
  municipalities: Option[];
  localities: Option[];

  provinceId: string;
  provinceName: string;
  municipalityId: string;
  municipalityName: string;
  localityId: string;
  localityName: string;

  street: string;
  setStreet: (t: string) => void;

  isAfter: boolean;
  setIsAfter: (v: boolean) => void;
  isLGBT: boolean;
  setIsLGBT: (v: boolean) => void;

  showProvinces: boolean;
  setShowProvinces: (v: boolean) => void;
  showMunicipalities: boolean;
  setShowMunicipalities: (v: boolean) => void;
  showLocalities: boolean;
  setShowLocalities: (v: boolean) => void;

  handleSelectProvince: (id: string, name: string) => Promise<void> | void;
  handleSelectMunicipality: (id: string, name: string) => Promise<void> | void;
  handleSelectLocality: (id: string, name: string) => void;
}

export default function LocationSelector(props: Props) {
  const {
    provinces,
    municipalities,
    localities,
    provinceId,
    provinceName,
    municipalityId,
    municipalityName,
    localityId,
    localityName,
    street,
    setStreet,
    isAfter,
    setIsAfter,
    isLGBT,
    setIsLGBT,
    showProvinces,
    setShowProvinces,
    showMunicipalities,
    setShowMunicipalities,
    showLocalities,
    setShowLocalities,
    handleSelectProvince,
    handleSelectMunicipality,
    handleSelectLocality,
  } = props;

  return (
    <View style={styles.card}>
      {/* Provincia */}
      <Text style={styles.label}>Provincia</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => {
          setShowProvinces(!showProvinces);
          setShowMunicipalities(false);
          setShowLocalities(false);
        }}
      >
        <Text style={styles.dropdownText}>
          {provinceName || "Seleccione una provincia"}
        </Text>
      </TouchableOpacity>
      {showProvinces && (
        <View style={styles.dropdownContainer}>
          {provinces.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectProvince(p.id, p.nombre)}
            >
              <Text>{p.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Municipio */}
      <Text style={styles.label}>Municipio</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        disabled={!provinceId}
        onPress={() => {
          setShowMunicipalities(!showMunicipalities);
          setShowProvinces(false);
          setShowLocalities(false);
        }}
      >
        <Text style={[styles.dropdownText, !provinceId && { opacity: 0.5 }]}>
          {municipalityName || "Seleccione un municipio"}
        </Text>
      </TouchableOpacity>
      {showMunicipalities && (
        <View style={styles.dropdownContainer}>
          {municipalities.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectMunicipality(m.id, m.nombre)}
            >
              <Text>{m.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Localidad */}
      <Text style={styles.label}>Localidad</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        disabled={!municipalityId}
        onPress={() => {
          setShowLocalities(!showLocalities);
          setShowProvinces(false);
          setShowMunicipalities(false);
        }}
      >
        <Text style={[styles.dropdownText, !municipalityId && { opacity: 0.5 }]}>
          {localityName || "Seleccione una localidad"}
        </Text>
      </TouchableOpacity>
      {showLocalities && (
        <View style={styles.dropdownContainer}>
          {localities.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectLocality(l.id, l.nombre)}
            >
              <Text>{l.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dirección */}
      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        placeholder="Dirección del evento"
        value={street}
        onChangeText={setStreet}
      />

      {/* Flags */}
      <View style={styles.flagsRow}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setIsAfter(!isAfter)}
        >
          <View style={[styles.checkBox, isAfter && styles.checkBoxOn]} />
          <Text style={styles.checkText}>¿Es after?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setIsLGBT(!isLGBT)}
        >
          <View style={[styles.checkBox, isLGBT && styles.checkBoxOn]} />
          <Text style={styles.checkText}>¿Es LGBT?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
  },

  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },

  // dropdowns
  dropdownButton: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    justifyContent: "center",
  },
  dropdownText: { color: COLORS.textPrimary },
  dropdownContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
    alignSelf: "center",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // flags
  flagsRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  checkRow: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  checkBoxOn: { backgroundColor: COLORS.primary },
  checkText: { color: COLORS.textPrimary },
});
