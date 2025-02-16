import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

const InputField = ({ label = "", secureTextEntry = false }) => {
  const [text, setText] = React.useState("");

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        label={label}
        value={text}
        onChangeText={setText}
        secureTextEntry={secureTextEntry} // Oculta texto si es una contraseña
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    width: "85%",
  },
});

export default InputField;
