import React, { useState } from "react"; // React y hook de estado
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native"; // Componentes base de React Native
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"; // Scroll que se adapta al teclado
import { Text, TextInput, Button } from "react-native-paper"; // Componentes de UI de react-native-paper
import { MaterialIcons as Icon } from "@expo/vector-icons"; // Iconos para back y candado
import { Link, useRouter } from "expo-router"; // Navegación con expo-router

import { COLORS } from "@/styles/globalStyles"; // Paleta de colores global
import ROUTES from "@/routes"; // Mapa de rutas de la app
import * as nav from "@/utils/navigation"; // Helpers propios para navegación
import useSendRecoveryPass from "@/app/auth/services/user/useSendRecoveryPass"; // Hook que llama a la API de recuperación
import { getProfile } from "@/app/auth/userApi";
import InfoTyc from "@/components/infoTyc"; // Términos y Condiciones y Política de Privacidad reutilizable

// Tipo simple para el callback opcional del popup
type PopupOnClose = (() => void) | null;

/**
 * Pantalla de "Recuperar contraseña".
 *
 * En esta screen el usuario:
 * - Ingresa su email
 * - Dispara el envío de un enlace de recuperación
 * - Ve un popup de éxito o error
 * - Puede volver al login o navegar hacia atrás
 */
export default function RecoverPasswordScreen() {
  // Router de expo-router para poder navegar / reemplazar screens
  const router = useRouter();

  // Estado del input de email
  const [email, setEmail] = useState("");

  // Hook que abstrae el llamado al endpoint de recuperación
  const { sending, sendRecovery } = useSendRecoveryPass();

  // Estado para manejar el popup "modal"
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupOnClose, setPopupOnClose] = useState<PopupOnClose>(null);

  /**
   * Muestra el popup con título, mensaje y una acción opcional al cerrar.
   * La acción se guarda en estado para ejecutarla luego cuando el usuario toque "Aceptar".
   */
  const showPopup = (title: string, message: string, onClose?: () => void) => {
    setPopupTitle(title);
    setPopupMessage(message);
    // Guardamos una función; si no viene nada, queda en null
    setPopupOnClose(() => onClose || null);
    setPopupVisible(true);
  };

  /**
   * Handler del botón "Enviar enlace":
   * - Valida que haya email
   * - Llama al hook de recuperación
   * - Muestra popup de éxito o de error
   */
  const handleSend = async () => {
    const trimmedEmail = email.trim();

    // Validación rápida: email no puede ir vacío
    if (!trimmedEmail) {
      showPopup("Error", "Por favor ingresá tu email.");
      return;
    }

    // Antes de pedir que el backend envíe el mail, validamos que el email
    // exista en nuestra base llamando a `getProfile`. Si no existe, avisamos
    // inmediatamente al usuario con el popup "Email incorrecto".
    try {
      await getProfile(trimmedEmail);
    } catch (err: any) {
      console.error("getProfile error", err);
      // Si la API devolvió explícitamente que el correo no está registrado,
      // mostramos el mensaje apropiado. Para otros errores de red/servidor
      // mostramos un mensaje genérico pero con el mismo título pedido.
      if (err?.response?.status === 500 && err?.response?.data?.message === "Correo no registrado") {
        showPopup(
          "Email incorrecto",
          "El email ingresado no es válido o no está registrado."
        );
      } else {
        showPopup(
          "Email incorrecto",
          "No se pudo verificar el email. Probá de nuevo en unos minutos."
        );
      }
      return;
    }

    try {
      // Llamamos al servicio que envía el mail de recuperación
      await sendRecovery(trimmedEmail);

      // Si no explota, mostramos popup de éxito
      // Al cerrar el popup, redirigimos al login
      showPopup(
        "Enlace enviado",
        "Te enviamos un enlace de recuperación a tu correo electrónico. Revisá tu bandeja de entrada.",
        () => nav.replace(router, ROUTES.LOGIN.LOGIN)
      );
    } catch (err: any) {
      console.error("sendRecovery error", err);
      // Si el backend responde que el correo no está registrado, mostramos
      // el mismo mensaje específico que usamos en la verificación previa.
      if (err?.response?.status === 500 && err?.response?.data?.message === "Correo no registrado") {
        showPopup(
          "Email incorrecto",
          "El email ingresado no es válido o no está registrado."
        );
      } else {
        // Error al enviar el mail: mostramos mensaje genérico con título pedido
        showPopup(
          "Email incorrecto",
          "No se pudo enviar el enlace de recuperación. Probá de nuevo en unos minutos."
        );
      }
    }
  };

  /**
   * Render principal de la screen.
   * Usamos KeyboardAvoidingView + KeyboardAwareScrollView para que el teclado no tape el formulario.
   */
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })} // Comportamiento distinto según plataforma
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 64 })} // Offset para no pisar headers/navbars
      style={{ flex: 1 }}
    >
      {/* Overlay del popup de resultado (éxito / error) */}
      {popupVisible && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupModal}>
            {/* Iconito circular de "ok" */}
            <View style={styles.popupHeaderIcon}>
              <Text style={styles.popupCheck}>✖</Text>
            </View>

            {/* Título y mensaje del popup (dinámicos según el caso) */}
            <Text style={styles.popupTitle}>{popupTitle}</Text>
            <Text style={styles.popupText}>{popupMessage}</Text>

            {/* Botón para cerrar el popup.
                Si hay una acción definida (por ejemplo, ir al login),
                la ejecutamos después de cerrar. */}
            <Button
              mode="contained"
              style={styles.popupButton}
              contentStyle={{ height: 48 }}
              onPress={() => {
                setPopupVisible(false);
                if (popupOnClose) popupOnClose();
              }}
            >
              Aceptar
            </Button>
          </View>
        </View>
      )}

      {/* Scroll principal de la pantalla de recuperación */}
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={120} // Margen extra para que el teclado no tape el input
        contentContainerStyle={styles.container}
        style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}
        keyboardShouldPersistTaps="always" // Permite tocar inputs/botones aunque el teclado esté abierto
      >
        {/* Header con logo, nombre de la app y slogan */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../../assets/images/raveapplogo/logo3.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>RaveApp</Text>
          <Text style={styles.subtitle}>Tu pase al mejor ritmo</Text>
        </View>

        {/* Botón "Volver" que usa nuestro helper de navegación */}
        <Pressable style={styles.back} onPress={() => nav.back(router)}>
          <Icon name="arrow-back" size={22} color="#374151" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        {/* Tarjeta central con el formulario de recuperación */}
        <View style={styles.card}>
          {/* Icono de candado dentro de un círculo para reforzar visualmente "seguridad/contraseña" */}
          <View style={styles.iconRow}>
            <View style={styles.lockCircle}>
              <Icon name="lock" size={30} color="#6b7280" />
            </View>
          </View>

          {/* Título y texto guía */}
          <Text style={styles.heading}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.lead}>
            Ingresá tu correo y te vamos a enviar un enlace para restablecerla.
          </Text>

          {/* Campo de email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            mode="outlined"
            placeholder="tu@email.com"
            autoCapitalize="none" // No queremos que el email se capitalice
            autoCorrect={false} // Evitamos correcciones automáticas raras en el mail
            keyboardType="email-address" // Teclado optimizado para emails
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            textColor="#0f172a"
            placeholderTextColor="#4b5563"
            outlineColor="#e6e9ef"
            activeOutlineColor="#0f172a"
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />} // Icono de mail a la izquierda del input
          />

          {/* Botón para enviar el enlace de recuperación */}
          <Button
            mode="contained"
            onPress={handleSend}
            contentStyle={styles.buttonContent}
            style={styles.button}
            labelStyle={{ fontWeight: "700", color: "#ffffff" }}
            disabled={sending} // Deshabilitado mientras está enviando
            loading={sending} // Muestra spinner mientras espera la respuesta
          >
            Enviar enlace
          </Button>

          {/* Link para volver al login si el usuario se acordó de la contraseña */}
          <View style={styles.rowCenter}>
            <Text style={styles.smallText}>¿Te acordaste de tu contraseña? </Text>
            <Link href={ROUTES.LOGIN.LOGIN as any} style={styles.link}>
              Iniciar sesión
            </Link>
          </View>
        </View>

        {/* Términos y Condiciones y Política de Privacidad (reutilizado en varias screens) */}
        <InfoTyc />
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Estilos de la pantalla de recuperación de contraseña.
 */
const styles = StyleSheet.create({
  // ===== Popup (overlay modal) =====
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.18)", // fondo semi-transparente
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999, // por encima del contenido normal
  },
  popupModal: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  popupHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eaf7ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  popupCheck: {
    color: "#16a34a",
    fontSize: 24,
    fontWeight: "700",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  popupText: {
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  popupButton: {
    alignSelf: "stretch",
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },

  // ===== Layout general =====
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  logo: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 4,
  },

  // ===== Botón volver =====
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#374151",
  },

  // ===== Tarjeta principal =====
  card: {
    marginHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    marginBottom: 24,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  lockCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  lead: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 52,
    overflow: "hidden",
  },
  button: {
    borderRadius: 22,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  buttonContent: {
    height: 48,
  },

  // ===== Texto/link inferior =====
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  smallText: {
    color: "#6b7280",
  },
  link: {
    color: "#0f172a",
    fontWeight: "600",
  },

  // (Estos de términos casi no se usan acá, pero los dejo por si se reutilizan)
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  termsText: {
    color: "#6b7280",
    fontSize: 12,
  },
  termsLink: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 12,
  },
});
