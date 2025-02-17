import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/TitleComponent";
import { View, StyleSheet } from "react-native";

export default function RegisterUserScreen() {
  return (
    <View style={styles.container}>
      <TitlePers text="Registrate en Raveapp"></TitlePers>
      <InputField label="Nombre" />
      <InputField label="Apellido" />
      <InputField label="Fecha de nacimiento DD/MM/AAAA" />
      <InputField label="Dni/pasaporte" />
      <InputField label="Correo electrónico" />
      <InputField label="Usuario" />
      <InputField label="Contraseña" />
      <ButtonInApp
        icon=""
        text="Registrar cuenta"
        width="75%"
        height={50}
        onPress={() => console.log("Crear cuenta")}
      />
      <ButtonInApp
        icon="google"
        text="Registrarse con google"
        width="75%"
        height={50}
        onPress={() => console.log("Crear cuenta con google")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
