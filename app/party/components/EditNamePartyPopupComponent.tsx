import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  visible: boolean;
  initialName: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (newName: string) => Promise<void> | void;
};

export default function EditNamePartyPopupComponent({ visible, initialName, saving = false, onCancel, onSave }: Props) {
  const [name, setName] = useState(initialName ?? "");

  // Sincronizar cuando cambie el initialName (al abrir con otro item)
  useEffect(() => {
    setName(initialName ?? "");
  }, [initialName, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.avoider}>
          <View style={styles.box}>
            <Text style={styles.title}>Editar fiesta</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la fiesta"
              style={styles.input}
              returnKeyType="done"
              editable={!saving}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel} disabled={saving}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.save, { opacity: saving || !name.trim() ? 0.6 : 1 }]}
                onPress={async () => {
                  if (!name.trim()) return;
                  await onSave(name.trim());
                }}
                disabled={saving || !name.trim()}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  avoider: { width: "100%", alignItems: "center" },
  box: { width: "100%", maxWidth: 420, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.card, padding: 16 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: COLORS.borderInput, borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.textPrimary, backgroundColor: COLORS.cardBg },
  actions: { flexDirection: "row", marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.card, alignItems: "center" },
  cancel: { backgroundColor: COLORS.textSecondary, marginRight: 8 },
  save: { backgroundColor: COLORS.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});
