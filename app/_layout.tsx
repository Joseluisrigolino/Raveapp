import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        // Debe coincidir EXACTO con la ruta del archivo: app/login/Login.tsx -> /login/login
        initialRouteName="login/login"
        screenOptions={{
          headerStyle: { backgroundColor: "#f4511e" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {/* Rutas raíz */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Coincide con app/login/Login.tsx */}
        <Stack.Screen name="login/Login" options={{ title: "Ingresar" }} />

        {/* Segmentos padres (no hace falta listar todo lo demás) */}
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="main" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
