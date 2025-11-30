import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/app/auth/AuthContext";
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from "react-native";
import globalStyles, { COLORS } from "@/styles/globalStyles";

const formatRouteName = (name?: string) => {
  if (!name) return "RaveApp";
  const segment = name.split("/").pop() ?? name;
  // Insertar espacio antes de mayúsculas y capitalizar primera letra
  const spaced = segment.replace(/([A-Z])/g, " $1").replace(/^\s+/, "");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export default function RootLayout() {
  return (
    <PaperProvider>
      <SafeAreaProvider>
      <AuthProvider>
        <Stack
          initialRouteName="auth/screens/LoginScreen"
          screenOptions={{
            headerShown: false
          }}
        >
          {/* Dejá que expo-router registre las rutas automáticamente.
              Si necesitás overrides, agregalos apuntando a rutas existentes, por ejemplo:
              <Stack.Screen name="auth/screens/LoginScreen" options={{ title: "Ingresar" }} />
          */}
        </Stack>
      </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  titleWrapper: { paddingVertical: 6 },
  titleText: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
});
