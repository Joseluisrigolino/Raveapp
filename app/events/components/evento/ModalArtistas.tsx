import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { styles } from "./styles";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  artistas?: any[];
  visible: boolean;
  onClose: () => void;
};

export default function ModalArtistas({ artistas = [], visible, onClose }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.artistsModalOverlay}>
      <View style={styles.artistsModalContent}>
        <Text style={styles.artistsModalTitle}>Artistas</Text>
        <ScrollView style={{ maxHeight: 260 }}>
          {(artistas ?? []).map((a: any, idx: number) => (
            <View key={idx} style={styles.artistsModalItem}>
              <MaterialCommunityIcons name="account-music" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
              {typeof a.nombre === "string" ? (
                <Text style={styles.artistsModalName}>{a.nombre}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.artistsModalCloseBtn} onPress={onClose}>
          <Text style={styles.artistsModalCloseText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
