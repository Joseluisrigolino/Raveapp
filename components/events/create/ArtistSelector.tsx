// components/events/create/ArtistSelector.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import { Artist } from "@/interfaces/Artist";

type ArtistLike = Artist & { __isNew?: boolean };

interface Props {
  artistInput: string;
  setArtistInput: (t: string) => void;
  artistLoading: boolean;
  suggestions: Artist[];
  onSelectSuggestion: (a: Artist) => void;
  onAddManual: (name: string) => void;
  selectedArtists: ArtistLike[];
  onRemoveArtist: (name: string) => void;
}

export default function ArtistSelector({
  artistInput,
  setArtistInput,
  artistLoading,
  suggestions,
  onSelectSuggestion,
  onAddManual,
  selectedArtists,
  onRemoveArtist,
}: Props) {
  const showDropdown =
    artistInput.trim().length > 0 && (artistLoading || suggestions.length >= 0);

  return (
    <View style={styles.card}>
      <View style={{ position: "relative" }}>
        <View style={styles.artistRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Escribe el nombre del artista"
            value={artistInput}
            onChangeText={setArtistInput}
          />
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => onAddManual(artistInput)}
          >
            <Text style={styles.addIconText}>+</Text>
          </TouchableOpacity>
        </View>

        {showDropdown && (
          <View style={styles.dropdownContainer}>
            {artistLoading && (
              <View style={styles.dropdownItem}>
                <Text style={styles.hint}>Buscando…</Text>
              </View>
            )}
            {!artistLoading && suggestions.length === 0 && (
              <View style={styles.dropdownItem}>
                <Text style={styles.hint}>Sin resultados</Text>
              </View>
            )}
            {!artistLoading &&
              suggestions.map((a) => (
                <TouchableOpacity
                  key={`${a.idArtista ?? ""}-${a.name}`}
                  style={styles.dropdownItem}
                  onPress={() => onSelectSuggestion(a)}
                >
                  <Text>{a.name}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      {selectedArtists.length > 0 && (
        <>
          <View style={styles.line} />
          <View style={{ gap: 8 }}>
            {selectedArtists.map((a) => (
              <View key={a.name} style={styles.artistPickedWrapper}>
                <View style={styles.artistPickedRow}>
                  <MaterialCommunityIcons
                    name={a.__isNew ? "clock-outline" : "check"}
                    size={18}
                    color={a.__isNew ? "#f5a623" : "#17a34a"}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.artistPickedName}>{a.name}</Text>
                  <TouchableOpacity
                    style={styles.removeBubble}
                    onPress={() => onRemoveArtist(a.name)}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {selectedArtists.some((x) => (x as any).__isNew) && (
              <View style={styles.notePill}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#f5a623" style={{ marginRight: 8 }} />
                <Text style={styles.notePillText}>
                  Los artistas añadidos manualmente quedan en estado pendiente y deberán ser autorizados por un administrador antes de su publicación.
                </Text>
              </View>
            )}
          </View>
        </>
      )}
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
  input: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
    color: COLORS.textPrimary,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
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
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  artistPickedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  artistPickedName: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  removeBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.negative,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  line: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    width: "100%",
    marginVertical: 12,
  },
  artistPickedWrapper: {
    gap: 6,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 26,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#f5a623',
  },
  notePillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    maxWidth: 280,
  },
});
