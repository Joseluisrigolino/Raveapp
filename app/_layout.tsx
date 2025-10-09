import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        initialRouteName="login/login"
        screenOptions={({ route }) => ({
          headerTintColor: "#fff",
          headerTitle: () => (
            <View style={styles.titleWrapper}>
              <Text style={styles.titleText}>{formatRouteName(route?.name)}</Text>
            </View>
          ),
          headerBackground: () => (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          ),
        })}
      >
        {/* Rutas raíz dentro de la carpeta login */}
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="login/login" options={{ title: "Ingresar" }} />

  {/* No declarar segmentos padres sin ruta directa para evitar warnings */}
        </Stack>
      </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  titleWrapper: { paddingVertical: 6 },
  titleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
