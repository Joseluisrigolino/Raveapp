import React from 'react';
import { View, Modal, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { COLORS, RADIUS } from '@/styles/globalStyles';

export default function CirculoCarga({ visible = true, text }: { visible?: boolean; text?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {text ? <Text style={styles.text}>{text}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    padding: 18,
    borderRadius: RADIUS.card,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    marginTop: 10,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
