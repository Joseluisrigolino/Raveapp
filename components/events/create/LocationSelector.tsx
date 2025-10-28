// components/events/create/LocationSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import SelectField from "@/components/common/selectField";
import InputText from "@/components/common/inputText";

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
  // Si true, permitimos mostrar localidades sin que exista municipio seleccionado
  allowLocalitiesWithoutMunicipality?: boolean;

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
    allowLocalitiesWithoutMunicipality,
  } = props;

  const isCABA = provinceId === '02';
  const disabledMunicipality = isCABA; // bloquear cuando es CABA
  const disabledLocality = isCABA; // bloquear cuando es CABA

  return (
    <View style={styles.card}>
      {/* Provincia */}
      <SelectField
        label="Provincia"
        value={provinceName}
        placeholder="Seleccione una provincia"
        onPress={() => {
          setShowProvinces(!showProvinces);
          setShowMunicipalities(false);
          setShowLocalities(false);
        }}
        isOpen={showProvinces}
      />
      {showProvinces && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={{ paddingVertical: 4 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {provinces.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.dropdownItem}
                onPress={() => handleSelectProvince(p.id, p.nombre)}
              >
                <Text>{p.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Municipio: siempre visible; si CABA, deshabilitado y con lista abierta si el padre lo indica */}
      <SelectField
        label="Municipio"
        value={municipalityName}
        placeholder="Seleccione un municipio"
        onPress={() => {
          setShowMunicipalities(!showMunicipalities);
          setShowProvinces(false);
          setShowLocalities(false);
        }}
        disabled={!provinceId || disabledMunicipality}
        isOpen={showMunicipalities}
      />
      {showMunicipalities && (
        <View style={[styles.dropdownContainer, disabledMunicipality && { opacity: 0.6 }] }>
          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={{ paddingVertical: 4 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {municipalities.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.dropdownItem}
                disabled={disabledMunicipality}
                onPress={() => {
                  if (!disabledMunicipality) handleSelectMunicipality(m.id, m.nombre);
                }}
              >
                <Text>{m.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Localidad */}
      <SelectField
        label="Localidad"
        value={localityName}
        placeholder="Seleccione una localidad"
        onPress={() => {
          setShowLocalities(!showLocalities);
          setShowProvinces(false);
          setShowMunicipalities(false);
        }}
        disabled={disabledLocality || (!municipalityId && !allowLocalitiesWithoutMunicipality)}
        isOpen={showLocalities}
      />
      {showLocalities && (
        <View style={[styles.dropdownContainer, disabledLocality && { opacity: 0.6 }] }>
          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={{ paddingVertical: 4 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {localities.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.dropdownItem}
                disabled={disabledLocality}
                onPress={() => {
                  if (!disabledLocality) handleSelectLocality(l.id, l.nombre);
                }}
              >
                <Text>{l.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Dirección */}
      <InputText
        label="Dirección"
        value={street}
        isEditing={true}
        onBeginEdit={() => {}}
        onChangeText={setStreet}
        placeholder="Dirección del evento"
        labelStyle={{ width: "100%", alignSelf: "flex-start", marginLeft: 2 }}
        inputStyle={{ width: "100%" }}
      />

      {/* Flags (After / LGBT) como botones tipo segmento */}
      <Text style={[styles.label, { marginTop: 10, marginBottom: 8 }]}>Tipo de evento</Text>
      <View style={styles.flagSegment}>
        <TouchableOpacity
          style={[styles.flagItem, isAfter && styles.flagItemOn]}
          onPress={() => setIsAfter(!isAfter)}
        >
          <View style={styles.flagItemContent}>
            <MaterialCommunityIcons
              name="weather-night"
              size={16}
              color={isAfter ? '#fff' : COLORS.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.flagText, isAfter && styles.flagTextOn]}>After</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.flagItem, isLGBT && styles.flagItemOn]}
          onPress={() => setIsLGBT(!isLGBT)}
        >
          <View style={styles.flagItemContent}>
            {/* Banderita LGBT */}
            <View style={styles.lgbtFlag}>
              <View style={[styles.lgbtStripe, { backgroundColor: '#E40303' }]} />
              <View style={[styles.lgbtStripe, { backgroundColor: '#FF8C00' }]} />
              <View style={[styles.lgbtStripe, { backgroundColor: '#FFED00' }]} />
              <View style={[styles.lgbtStripe, { backgroundColor: '#008026' }]} />
              <View style={[styles.lgbtStripe, { backgroundColor: '#004DFF' }]} />
              <View style={[styles.lgbtStripe, { backgroundColor: '#750787' }]} />
            </View>
            <Text style={[styles.flagText, isLGBT && styles.flagTextOn]}>LGTB</Text>
          </View>
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
  // dropdowns (legacy styles retained for container lists)
  dropdownContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 8,
    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  menuScrollView: {
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  // flags como segment buttons
  flagSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  flagItemOn: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  flagItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { color: COLORS.textPrimary, fontWeight: '700' },
  flagTextOn: { color: '#fff' },
  lgbtFlag: {
    width: 18,
    height: 12,
    marginRight: 8,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#ccc',
  },
  lgbtStripe: {
    flex: 1,
    width: '100%',
  },
});
