// components/events/create/LocationSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
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

      {/* Municipio: ocultar completamente si la provincia es CABA (02) */}
      {provinceId !== '02' && (
        <>
          <SelectField
            label="Municipio"
            value={municipalityName}
            placeholder="Seleccione un municipio"
            onPress={() => {
              setShowMunicipalities(!showMunicipalities);
              setShowProvinces(false);
              setShowLocalities(false);
            }}
            disabled={!provinceId}
            isOpen={showMunicipalities}
          />
          {showMunicipalities && (
            <View style={styles.dropdownContainer}>
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
                    onPress={() => handleSelectMunicipality(m.id, m.nombre)}
                  >
                    <Text>{m.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
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
        disabled={!municipalityId && !allowLocalitiesWithoutMunicipality}
        isOpen={showLocalities}
      />
      {showLocalities && (
        <View style={styles.dropdownContainer}>
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
                onPress={() => handleSelectLocality(l.id, l.nombre)}
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
