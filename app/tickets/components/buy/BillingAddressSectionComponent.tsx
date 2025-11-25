// app/tickets/components/buy/BillingAddressSection.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import InputText from "@/components/common/inputText";
import { BillingAddress } from "@/app/tickets/types/BuyProps";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Option = { id: string; nombre: string };

type Props = {
  billingAddress: BillingAddress;
  onChangeField: (field: keyof BillingAddress, value: string) => void;
  provinces: Option[];
  municipalities: Option[];
  localities: Option[];
  provinceId: string;
  municipalityId: string;
  showProvinces: boolean;
  showMunicipalities: boolean;
  showLocalities: boolean;
  setShowProvinces: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowMunicipalities: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowLocalities: (v: boolean | ((prev: boolean) => boolean)) => void;
  handleSelectProvince: (id: string, nombre: string) => void;
  handleSelectMunicipality: (id: string, nombre: string) => void;
  handleSelectLocality: (id: string, nombre: string) => void;
  isBillingComplete: boolean;
};

export default function BillingAddressSection({
  billingAddress,
  onChangeField,
  provinces,
  municipalities,
  localities,
  provinceId,
  municipalityId,
  showProvinces,
  showMunicipalities,
  showLocalities,
  setShowProvinces,
  setShowMunicipalities,
  setShowLocalities,
  handleSelectProvince,
  handleSelectMunicipality,
  handleSelectLocality,
  isBillingComplete,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>Domicilio de facturación</Text>
      <View style={styles.buyerForm}>
        {/* Dirección */}
        <View style={styles.formRow}>
          <View style={styles.fullInputContainer}>
            <InputText
              label="Dirección"
              value={billingAddress.direccion}
              isEditing={true}
              editable={true}
              onBeginEdit={() => {}}
              onChangeText={(t) => onChangeField("direccion", t)}
              containerStyle={styles.inputContainer}
              inputStyle={styles.editableInputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
        </View>

        {/* Provincia */}
        <View style={styles.formRow}>
          <View style={styles.fullInputContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                setShowProvinces((s) => !s);
                setShowMunicipalities(false);
                setShowLocalities(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {billingAddress.provincia || "Seleccione provincia"}
              </Text>
            </TouchableOpacity>
            {showProvinces && (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={[styles.dropdownContainer, { maxHeight: 180 }]}
              >
                {provinces.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectProvince(p.id, p.nombre)}
                  >
                    <Text style={styles.dropdownItemText}>{p.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Municipio / Localidad */}
        <View style={styles.formRow}>
          <View style={styles.halfInputContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                !provinceId && { opacity: 0.5 },
              ]}
              disabled={!provinceId}
              onPress={() => {
                setShowMunicipalities((s) => !s);
                setShowProvinces(false);
                setShowLocalities(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !provinceId && { opacity: 0.5 },
                ]}
              >
                {billingAddress.municipio || "Seleccione municipio"}
              </Text>
            </TouchableOpacity>
            {showMunicipalities && (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={[styles.dropdownContainer, { maxHeight: 180 }]}
              >
                {municipalities.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectMunicipality(m.id, m.nombre)}
                  >
                    <Text style={styles.dropdownItemText}>{m.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.halfInputContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                !municipalityId && provinceId !== "02" && { opacity: 0.5 },
              ]}
              disabled={!municipalityId && provinceId !== "02"}
              onPress={() => {
                setShowLocalities((s) => !s);
                setShowProvinces(false);
                setShowMunicipalities(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !municipalityId && provinceId !== "02" && { opacity: 0.5 },
                ]}
              >
                {billingAddress.localidad || "Seleccione localidad"}
              </Text>
            </TouchableOpacity>
            {showLocalities && (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={[styles.dropdownContainer, { maxHeight: 180 }]}
              >
                {localities.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectLocality(l.id, l.nombre)}
                  >
                    <Text style={styles.dropdownItemText}>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {!isBillingComplete && (
          <View style={styles.validationContainer}>
            <Text style={styles.validationText}>
              Completá todos los campos de domicilio para poder continuar.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  buyerForm: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  halfInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  fullInputContainer: {
    flex: 1,
  },
  inputContainer: {
    alignItems: "stretch",
    marginBottom: 0,
  },
  inputLabel: {
    opacity: 0.7,
  },
  editableInputPaper: {
    width: "100%",
    opacity: 1,
    backgroundColor: "#ffffff",
  },
  dropdownButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "#d1d5db",
    borderWidth: 1,
    minHeight: 48,
    padding: 12,
    marginBottom: 4,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  dropdownText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
  },
  validationContainer: {
    paddingHorizontal: 16,
    marginTop: -6,
  },
  validationText: {
    color: "#dc2626",
    fontSize: FONT_SIZES.smallText,
    textAlign: "left",
    marginTop: 6,
  },
});
