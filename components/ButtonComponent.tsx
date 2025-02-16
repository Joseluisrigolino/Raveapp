import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

// Definición de props sin interfaz (tipado directo)
const ButtonInApp = ({
  icon = 'google', 
  text = 'Default Text', 
  width = '70%', 
  height = 50, 
  onPress = () => console.log('')
}: {
  icon?: string;
  text?: string;
  width?: string | number;
  height?: string | number;
  onPress?: () => void;
}) => {
  return (
    <View style={styles.container}>
      <Button
        style={[styles.button, { width, height }]} // Aquí personalizamos el tamaño
        icon={icon}
        mode="contained"
        onPress={onPress}
      >
        {text}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000222'
  },
});

export default ButtonInApp;
