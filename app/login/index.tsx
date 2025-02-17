import ButtonInApp from "@/components/ButtonComponent";
import InputField from "@/components/InputFieldComponent";
import TitlePers from "@/components/TitleComponent";
import { Link } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

export default function Index() {
  return (
    <View style={styles.container}>
      <TitlePers text="Bienvenido a Raveapp"></TitlePers>
      <InputField label="Correo Electronico" />
      <InputField label="Contraseña" secureTextEntry={true} />
      <ButtonInApp
        icon=""
        text="Ingresar con Cuenta"
        width="75%"
        height={50}
        onPress={() => console.log("Ingresar con Cuenta Normal")}
      />
      <ButtonInApp
        icon="google"
        text="Ingresar con Google"
        width="75%"
        height={50}
        onPress={() => console.log("Ingresar con Google")}
      />
      <View style={styles.registerText}>
        <Text variant="labelLarge">
          <Link href="/login/RegisterUserScreen">
            ¿Aun no tenes cuenta?, registrate aqui
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  registerText: {
    color: "#000000",
    marginTop: 10,
    alignItems: "center",
  },
});
