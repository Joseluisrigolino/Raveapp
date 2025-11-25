// app/tickets/components/buy/BuyerInfoSection.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputText from "@/components/common/inputText";
import { BuyerInfo } from "@/app/tickets/types/BuyProps";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  buyerInfo: BuyerInfo;
};

export default function BuyerInfoSection({ buyerInfo }: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>Tus datos</Text>
      <View style={styles.buyerForm}>
        <View style={styles.formRow}>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Nombre"
              value={buyerInfo.firstName}
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Apellido"
              value={buyerInfo.lastName}
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Tipo ID"
              value={buyerInfo.idType}
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Número ID"
              value={buyerInfo.idNumber}
              keyboardType="numeric"
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Email"
              value={buyerInfo.email}
              keyboardType="email-address"
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
              labelNumberOfLines={1}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <InputText
              label="Fecha de nacimiento"
              value={buyerInfo.birthDate}
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={[styles.inputLabel, { width: "100%" }]}
              labelNumberOfLines={1}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.fullInputContainer}>
            <InputText
              label="Teléfono"
              value={buyerInfo.phone}
              keyboardType="phone-pad"
              isEditing={true}
              editable={false}
              onBeginEdit={() => {}}
              onChangeText={() => {}}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputPaper}
              labelStyle={styles.inputLabel}
            />
          </View>
        </View>

        <Text style={styles.hintInfo}>
          En caso de que tus datos no estén actualizados, realizá el cambio
          desde tu perfil.
        </Text>
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
  inputPaper: {
    width: "100%",
    opacity: 0.7,
  },
  inputLabel: {
    opacity: 0.7,
  },
  hintInfo: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
