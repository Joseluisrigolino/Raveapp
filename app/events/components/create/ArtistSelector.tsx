// components/events/create/ArtistSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import { Artist } from "@/app/artists/types/Artist";
import InputText from "@/components/common/inputText";

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
          <View style={{ flex: 1 }}>
            <InputText
              label="O crear uno nuevo"
              value={artistInput}
              isEditing={true}
              onBeginEdit={() => {}}
              onChangeText={setArtistInput}
              placeholder="Escribe el nombre del artista"
              labelStyle={{ width: "100%", alignSelf: "flex-start", marginLeft: 2 }}
              inputStyle={{ width: "100%" }}
              autoFocus={false}
            />
          </View>
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
          <View style={styles.tagsRow}>
            {selectedArtists.map((a) => {
              const isNew = Boolean((a as any).__isNew);
              return (
                <View key={a.name} style={[styles.tagPill, isNew && styles.tagPillNew]}>
                  {isNew && (
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      color="#7A5E00"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={[styles.tagText, isNew && styles.tagTextNew]}>{a.name}</Text>
                  <TouchableOpacity onPress={() => onRemoveArtist(a.name)} style={[styles.tagRemove, isNew && styles.tagRemoveNew]}>
                    <MaterialCommunityIcons name="close" size={12} color={isNew ? "#7A5E00" : "#fff"} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          {selectedArtists.some((x) => (x as any).__isNew) && (
            <View style={styles.notePill}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#f5a623" style={{ marginRight: 8 }} />
              <Text style={styles.notePillText}>
                Los artistas añadidos manualmente quedan en estado pendiente y deberán ser autorizados por un administrador antes de su publicación.
              </Text>
            </View>
          )}
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
    width: 56,
    height: 56,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  tagText: { color: '#fff', fontWeight: '600', marginRight: 8 },
  tagRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  // estilos para artistas agregados manualmente (pendientes)
  tagPillNew: {
    backgroundColor: '#FFF4CC',
    borderWidth: 1,
    borderColor: '#F6C343',
  },
  tagTextNew: {
    color: '#5C4A00',
  },
  tagRemoveNew: {
    backgroundColor: 'rgba(0,0,0,0.06)'
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
