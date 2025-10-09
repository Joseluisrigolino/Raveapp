import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { Party } from "@/utils/partysApi";
import InputText from "@/components/common/inputText";
import SelectField from "@/components/common/selectField";

type EventType = "1d" | "2d" | "3d";

interface Props {
  eventName: string;
  onChangeEventName: (t: string) => void;

  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  myParties: Party[];
  partyLoading: boolean;
  selectedPartyId: string | null;
  setSelectedPartyId: (id: string | null) => void;
  showPartyDropdown: boolean;
  setShowPartyDropdown: (v: boolean) => void;
  newPartyName: string;
  setNewPartyName: (t: string) => void;
  newPartyLocked: boolean;
  setNewPartyLocked: (v: boolean) => void;
  onPickParty: (p: Party) => void;
  onPressAddNewParty: () => void;

  eventType: EventType;
  setEventType: (t: EventType) => void;
}

export default function EventBasicData(props: Props) {
  const {
    eventName,
    onChangeEventName,
    isRecurring,
    setIsRecurring,
    myParties,
    partyLoading,
    selectedPartyId,
    setShowPartyDropdown,
    showPartyDropdown,
    newPartyName,
    setNewPartyName,
    newPartyLocked,
    onPickParty,
    onPressAddNewParty,
    eventType,
    setEventType,
  } = props;

  return (
    <View style={styles.card}>
      <InputText
        label="Nombre del evento"
        value={eventName}
        isEditing={true}
        onBeginEdit={() => {}}
        onChangeText={onChangeEventName}
        placeholder="Nombre del evento"
        labelStyle={{ width: "100%", alignSelf: "flex-start", marginLeft: 2 }}
        inputStyle={{ width: "100%" }}
      />

      <View style={[styles.flagsRow, { marginTop: 10 }]}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => props.setIsRecurring(!isRecurring)}
        >
          <View style={[styles.checkBox, isRecurring && styles.checkBoxOn]} />
          <Text style={styles.checkText}>Este evento es recurrente</Text>
        </TouchableOpacity>
      </View>

      {isRecurring && (
        <View style={styles.recurringBox}>
          <SelectField
            label="Seleccioná una fiesta"
            value={
              partyLoading
                ? "Cargando…"
                : selectedPartyId
                ? myParties.find((p) => p.idFiesta === selectedPartyId)?.nombre || "Sin nombre"
                : ""
            }
            placeholder={partyLoading ? "Cargando…" : "Seleccioná una opción"}
            onPress={() => setShowPartyDropdown(!showPartyDropdown)}
            isOpen={showPartyDropdown}
            containerStyle={{ width: "100%" }}
            labelStyle={{ width: "100%", marginLeft: 2 }}
            fieldStyle={{ width: "100%" }}
          />

          {showPartyDropdown && (
            <View style={styles.dropdownContainer}>
              {partyLoading && (
                <View style={styles.dropdownItem}>
                  <Text style={styles.hint}>Cargando…</Text>
                </View>
              )}
              {!partyLoading && myParties.length === 0 && (
                <View style={styles.dropdownItem}>
                  <Text style={styles.hint}>No tenés fiestas aún.</Text>
                </View>
              )}
              {!partyLoading &&
                myParties.map((p) => (
                  <TouchableOpacity
                    key={p.idFiesta}
                    style={styles.dropdownItem}
                    onPress={() => props.onPickParty(p)}
                  >
                    <Text>{p.nombre || "(sin nombre)"}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", columnGap: 8, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <InputText
                label="O crear una nueva"
                value={newPartyName}
                isEditing={true}
                onBeginEdit={() => {}}
                onChangeText={setNewPartyName}
                placeholder="Nombre de la nueva fiesta"
                labelStyle={{ width: "100%", alignSelf: "flex-start", marginLeft: 2 }}
                inputStyle={{ width: "100%" }}
                editable={!newPartyLocked}
              />
            </View>
            <TouchableOpacity
              style={[styles.addIconBtn, { opacity: newPartyLocked || !newPartyName.trim() ? 0.5 : 1 }]}
              onPress={props.onPressAddNewParty}
              disabled={newPartyLocked || !newPartyName.trim()}
            >
              <Text style={styles.addIconText}>+</Text>
            </TouchableOpacity>
          </View>

          {newPartyLocked && (
            <Text style={[styles.hint, { marginTop: 6 }]}>
              Se creará con ese nombre al enviar el evento.
            </Text>
          )}
        </View>
      )}

      <View style={styles.line} />
      <Text style={[styles.label, { marginBottom: 10 }]}>Tipo de evento</Text>
      <View style={styles.segment}>
        {(["1d", "2d", "3d"] as EventType[]).map((v) => {
          const active = eventType === v;
          return (
            <TouchableOpacity
              key={v}
              style={[styles.segmentItem, active && styles.segmentItemOn]}
              onPress={() => setEventType(v)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextOn]}>
                {v === "1d" ? "1 día" : v === "2d" ? "2 días" : "3 días"}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  inputDisabled: {
    backgroundColor: COLORS.borderInput,
    color: COLORS.textSecondary,
  },
  hint: { color: COLORS.textSecondary, fontSize: 12 },
  flagsRow: { flexDirection: "row", alignItems: "center" },
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
  recurringBox: {
    marginTop: 12,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  recurringTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  segment: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    flexDirection: "row",
    overflow: "hidden",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentItemOn: {
    backgroundColor: COLORS.primary,
  },
  segmentText: { color: COLORS.textPrimary, fontWeight: "600" },
  segmentTextOn: { color: COLORS.cardBg },
  line: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    width: "100%",
    marginVertical: 12,
  },
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },
});
