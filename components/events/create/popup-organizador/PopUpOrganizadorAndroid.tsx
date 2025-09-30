import React, { useEffect } from 'react';
import { Animated, Easing, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_SIZES } from '@/styles/globalStyles';

const PopUpOrganizadorAndroid: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.modalCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>¡Importante!</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: COLORS.negative, fontWeight: 'bold' }}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>
          Al crear un evento, tu usuario pasará a ser <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Organizador</Text> y tendrás acceso a nuevas funcionalidades para administrar tus eventos.
        </Text>
        <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>
          Si continúas y el evento se crea correctamente, tu cuenta será actualizada automáticamente.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '92%',
    alignSelf: 'center',
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: FONT_SIZES.subTitle,
  },
});

export default PopUpOrganizadorAndroid;
