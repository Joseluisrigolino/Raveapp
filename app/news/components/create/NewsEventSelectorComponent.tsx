// src/screens/admin/NewsScreens/components/create/NewsEventSelectorComponent.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import SelectField from "@/components/common/selectField";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export type NewsEventOption = {
  id: string;
  name: string;
  imageUrl?: string;
};

type Props = {
  options: NewsEventOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
};

export default function NewsEventSelectorComponent({
  options,
  selectedId,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedName =
    selectedId != null
      ? options.find((e) => e.id === selectedId)?.name
      : undefined;

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <View style={styles.container}>
      <SelectField
        label="Vincular evento"
        value={selectedName}
        placeholder="Seleccionar evento (opcional)"
        onPress={() => setOpen(!open)}
        isOpen={open}
        containerStyle={{ width: "100%", alignItems: "stretch" }}
        labelStyle={{ width: "100%", textAlign: "left" }}
        fieldStyle={{ width: "100%" }}
      />

      {open && (
        <View style={styles.dropdownContainer}>
          {options.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay eventos disponibles.</Text>
            </View>
          ) : (
            options.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.dropdownItem}
                onPress={() => handleSelect(e.id)}
              >
                <View style={styles.eventItem}>
                  {e.imageUrl ? (
                    <Image
                      source={{ uri: e.imageUrl }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.eventImage,
                        { backgroundColor: "#ccc" },
                      ]}
                    />
                  )}
                  <Text style={styles.eventName}>{e.name}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "stretch",
    marginBottom: 16,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginTop: 6,
    width: "100%",
    alignSelf: "stretch",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  eventName: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
  emptyBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
  },
});
