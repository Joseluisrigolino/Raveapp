import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import ROUTES from "@/routes";
import { loginControllerUser } from "@/app/auth/apis/user-controller/controllerApi";

// Hook sencillo para manejar el login del controlador
// Comentarios en español para explicar lo básico
export default function useLoginUserController() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // helper: revisa si una cadena no está vacía
  const isNotEmpty = (value: string) => value.trim().length > 0;

  // función que realiza el login y navega si es correcto
  const login = async (user: string, password: string) => {
    if (!isNotEmpty(user) || password.length === 0) return false; // no enviar si falta info
    setLoading(true);
    try {
      const ok = await loginControllerUser(user.trim(), password);
      if (!ok) {
        // aviso sencillo si las credenciales no son correctas
        Alert.alert("Acceso denegado", "Usuario o contraseña inválidos para controlador.");
        return false;
      }
      // navegación al scanner (mantenemos el contrato existente)
      router.replace({ pathname: ROUTES.CONTROLLER.SCANNER, params: { user: user.trim() } });
      return true;
    } catch (err: any) {
      // aviso genérico de error
      Alert.alert("Error", "No se pudo validar las credenciales del controlador.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading } as const;
}
