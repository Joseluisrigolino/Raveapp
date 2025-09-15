// components/events/create/EventBasicData.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { Party } from "@/utils/partysApi";

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
      <Text style={styles.label}>Nombre del evento</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del evento"
        value={eventName}
        onChangeText={onChangeEventName}
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
          <Text style={styles.recurringTitle}>Seleccioná una fiesta:</Text>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowPartyDropdown(!showPartyDropdown)}
          >
            <Text style={styles.dropdownText}>
              {partyLoading
                ? "Cargando…"
                : selectedPartyId
                ? myParties.find((p) => p.idFiesta === selectedPartyId)?.nombre ||
                  "Sin nombre"
                : "Seleccioná una opción"}
            </Text>
            <MaterialCommunityIcons
              name={showPartyDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.textPrimary}
              style={{ position: "absolute", right: 10 }}
            />
          </TouchableOpacity>

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

          <Text style={[styles.recurringTitle, { marginTop: 12 }]}>
            O crear una nueva:
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                newPartyLocked && styles.inputDisabled,
              ]}
              placeholder="Nombre de la nueva fiesta"
              value={newPartyName}
              onChangeText={setNewPartyName}
              editable={!newPartyLocked}
            />
            <TouchableOpacity
              style={[
                styles.addIconBtn,
                { marginLeft: 8, opacity: newPartyLocked ? 0.5 : 1 },
              ]}
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
    padding: 10,
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
    padding: 10,
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
