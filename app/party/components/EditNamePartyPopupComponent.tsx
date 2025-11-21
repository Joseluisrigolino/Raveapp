// components/party/EditNamePartyPopupComponent.tsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
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

export default function EditNamePartyPopupComponent({
  visible,
  initialName,
  saving = false,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName ?? "");

  // Cada vez que cambia el nombre inicial o se abre el modal,
  // sincronizamos el estado interno del input.
  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
    }
  }, [initialName, visible]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    await onSave(trimmed);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
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
            <TouchableOpacity
              style={[styles.btn, styles.cancel]}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.save,
                { opacity: saving || !name.trim() ? 0.6 : 1 },
              ]}
              onPress={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  title: {
    fontSize: FONT_SIZES.title ?? 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBg,
  },
  actions: { flexDirection: "row", marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  cancel: { backgroundColor: COLORS.textSecondary, marginRight: 8 },
  save: { backgroundColor: COLORS.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});
