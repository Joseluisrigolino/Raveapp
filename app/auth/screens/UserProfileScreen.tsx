// app/auth/screens/UserProfileScreen.tsx
// Pantalla de perfil de usuario: datos personales, domicilio, foto, cambio de contraseña y eliminación de cuenta.

import React, { useEffect, useState } from "react"; // React + hooks básicos
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native"; // Componentes base de React Native
import { SafeAreaView } from "react-native-safe-area-context"; // Respeta áreas seguras (notch, barras, etc.)
import { MaterialIcons } from "@expo/vector-icons"; // Iconos Material
import * as ImagePicker from "expo-image-picker"; // Picker de imágenes de la galería
import * as FileSystem from "expo-file-system/legacy"; // Para chequear tamaño de archivo
import { useRouter } from "expo-router"; // Navegación con expo-router

import * as nav from "@/utils/navigation"; // Helpers de navegación (replace, back, etc.)
import ROUTES from "@/routes"; // Constantes de rutas centralizadas

import Header from "@/components/layout/HeaderComponent"; // Header general de la app
import Footer from "@/components/layout/FooterComponent"; // Footer general de la app
import SelectField from "@/components/common/selectField"; // Campo select custom reutilizable

import { useAuth } from "@/app/auth/AuthContext"; // Contexto de autenticación (usuario logueado, logout, etc.)
import { getProfile, ApiUserFull } from "@/app/auth/userApi"; // API de usuario + tipos
import useUpdateUserProfile from "@/app/auth/services/user/useUpdateUserProfile"; // Hook para actualizar perfil
import { mediaApi } from "@/app/apis/mediaApi"; // API para media (foto de usuario)
import { apiClient } from "@/app/apis/apiClient"; // Cliente HTTP principal
import useDeleteAccountProfile from "@/app/auth/services/user/useDeleteAccountProfile"; // Hook de eliminación de cuenta
import useVerifyEmail from "@/app/auth/services/user/useVerifyEmail"; // Hook para enviar mail de verificación
import ProfileUserPopupUpdateOk from "@/app/auth/components/user/profile-user/ProfileUserPopupUpdateOk"; // Popup de éxito actualización
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalitiesByProvince,
  fetchLocalities,
} from "@/app/apis/georefApi"; // APIs geográficas (provincias/municipios/localidades)
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles"; // Estilos globales
import { formatDateForUI } from "@/utils/formatDate"; // Formateo de fecha para UI

// -----------------------------------------------------------------------------
// Tipos de ayuda internos
// -----------------------------------------------------------------------------

// Forma del formulario local (lo que el usuario edita en la UI)
interface UserProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
  cbu: string;
  birthdate: string; // yyyy-mm-dd
  addressProvince: string;
  addressLocality: string;
  addressStreet: string;
}

// Item simple para listas geográficas (provincias, municipios, localidades)
interface GeoRefItem {
  id: string;
  nombre: string;
}

// Tipo para callback opcional del popup
type PopupOnClose = (() => void) | null;

// Fallback de provincias en caso de que la API de georef falle o devuelva vacío
const FALLBACK_PROVINCES: string[] = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

// -----------------------------------------------------------------------------
// Componente principal: pantalla de perfil de usuario
// -----------------------------------------------------------------------------

/**
 * UserProfileScreen
 *
 * Pantalla donde el usuario:
 * - Ve y edita sus datos personales (nombre, mail, CBU, etc.)
 * - Administra su domicilio (provincia/municipio/localidad/dirección)
 * - Sube o cambia su foto de perfil
 * - Cambia su contraseña
 * - Verifica su correo
 * - Puede eliminar su cuenta
 */
export default function UserProfileScreen() {
  // Tomamos usuario y logout del contexto de auth
  const { user, logout } = useAuth();

  // Router de expo-router para navegar
  const router = useRouter();

  // Perfil completo tal como viene de la API
  const [profile, setProfile] = useState<ApiUserFull | null>(null);

  // Flag de carga inicial
  const [loading, setLoading] = useState<boolean>(true);

  // Estado local del formulario editable
  const [form, setForm] = useState<UserProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    dni: "",
    phone: "",
    cbu: "",
    birthdate: "",
    addressProvince: "",
    addressLocality: "",
    addressStreet: "",
  });

  // Flags de edición (datos personales / domicilio)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);

  // Foto de perfil (URL o URI local)
  const [photo, setPhoto] = useState<string | null>(null);

  // Listas geográficas (simplificadas)
  const [provinces, setProvinces] = useState<GeoRefItem[]>([]);
  const [municipalities, setMunicipalities] = useState<GeoRefItem[]>([]);
  const [localities, setLocalities] = useState<GeoRefItem[]>([]);

  // IDs seleccionados para provincia/municipio/localidad
  const [provinceId, setProvinceId] = useState<string>("");
  const [municipalityId, setMunicipalityId] = useState<string>("");
  const [localityId, setLocalityId] = useState<string>("");

  // Flags para mostrar/ocultar pickers
  const [showProvincePicker, setShowProvincePicker] = useState<boolean>(false);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState<boolean>(false);
  const [showLocalityPicker, setShowLocalityPicker] = useState<boolean>(false);

  // Flag especial para manejar el caso CABA
  const [isCABA, setIsCABA] = useState<boolean>(false);

  // Hooks de modales/acciones de backend
  const { sending: sendingVerify, sendVerifyEmail } = useVerifyEmail();
  const { updating: updatingProfile, updateUserProfile } = useUpdateUserProfile();
  const { deleting: deletingAccount, deleteAccount } = useDeleteAccountProfile();

  // Modal de "correo de verificación enviado"
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);

  // Popup de actualización exitosa
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // Modal para confirmar eliminación de cuenta
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Estado para popup genérico (errores / mensajes)
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string>("");
  const [popupMessage, setPopupMessage] = useState<string>("");
  const [popupOnClose, setPopupOnClose] = useState<PopupOnClose>(null);

  // Estados relacionados al cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [showChangeModal, setShowChangeModal] = useState<boolean>(false);
  const [showChangeResultModal, setShowChangeResultModal] = useState<boolean>(false);
  const [changeResultMsg, setChangeResultMsg] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Helper genérico para actualizar un campo del formulario
  function setField<K extends keyof UserProfileForm>(key: K, value: UserProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Mostrar popup genérico con título, mensaje y acción opcional al cerrar
  const showPopup = (title: string, message: string, onClose?: () => void) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupOnClose(() => onClose || null);
    setPopupVisible(true);
  };

  // Seleccionar imagen de galería y validar tamaño máximo (2MB)
  async function pickImage() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      // Si el usuario canceló o no hay assets, salimos
      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      const info = await FileSystem.getInfoAsync(asset.uri);

      // Validar tamaño (2MB)
      if (info?.size && info.size > 2 * 1024 * 1024) {
        showPopup(
          "Imagen demasiado grande",
          "La imagen seleccionada supera el máximo permitido (2MB). Elegí una imagen más liviana."
        );
        return;
      }

      // Guardamos la URI local por ahora (subida real puede ser en otro flujo)
      setPhoto(asset.uri);
    } catch {
      showPopup("Error", "No se pudo seleccionar la imagen.");
    }
  }

  // ---------------------------------------------------------------------------
  // Carga inicial del perfil (y datos geográficos básicos)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true; // flag simple para evitar setState si el componente se desmonta

    (async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Tomamos el username del AuthContext (en tu modelo es el correo)
        const username = user.username;

        // 1) Traer perfil completo desde la API
        const u = await getProfile(username);
        if (!mounted) return;

        setProfile(u);

        // 2) Inicializar formulario con datos del perfil
        setForm({
          firstName: u.nombre || "",
          lastName: u.apellido || "",
          email: u.correo || "",
          dni: u.dni || "",
          phone: u.telefono || "",
          cbu: u.cbu || "",
          birthdate: u.dtNacimiento ? u.dtNacimiento.split("T")[0] : "",
          addressProvince: u.domicilio?.provincia?.nombre || "",
          addressLocality: u.domicilio?.localidad?.nombre || "",
          addressStreet: u.domicilio?.direccion || "",
        });

        // 3) Cargar foto de perfil si existe en mediaApi
        try {
          const media = await mediaApi.getByEntidad(u.idUsuario);
          const m = media?.media?.[0];
          let finalUrl = m?.url ?? m?.imagen ?? "";

          // Si viene ruta relativa, la completamos con baseURL
          if (finalUrl && m?.imagen && !/^https?:\/\//.test(finalUrl)) {
            finalUrl = `${apiClient.defaults.baseURL}${
              finalUrl.startsWith("/") ? "" : "/"
            }${finalUrl}`;
          }

          setPhoto(finalUrl || null);
        } catch {
          setPhoto(null);
        }

        // 4) Cargar provincias desde georefApi
        try {
          const provs = await fetchProvinces();
          const normalizedProvs: GeoRefItem[] =
            provs?.map((p: any) => ({
              id: String(p?.id),
              nombre: String(p?.nombre ?? ""),
            })) ?? [];

          setProvinces(normalizedProvs);

          // Resolver provincia seleccionada a partir del perfil
          const profileProvCode = u.domicilio?.provincia?.codigo;
          const profileProvName = u.domicilio?.provincia?.nombre;

          const matchedProv =
            normalizedProvs.find(
              (p) =>
                String(p.id) === String(profileProvCode) ||
                String(p.nombre).toLowerCase() ===
                  String(profileProvName || "").toLowerCase()
            ) ?? null;

          if (matchedProv) {
            const pid = matchedProv.id;
            setProvinceId(pid);

            const provName = matchedProv.nombre || profileProvName || "";

            // Detectar si la provincia es CABA (Ciudad Autónoma de Buenos Aires)
            const lower = provName.toLowerCase();
            const caba =
              lower.includes("buenos") &&
              lower.includes("aires") &&
              lower.includes("ciudad");
            setIsCABA(caba);

            // Cargar municipios de esa provincia
            try {
              const mun = await fetchMunicipalities(pid);
              const normalizedMun: GeoRefItem[] =
                mun?.map((m: any) => ({
                  id: String(m?.id),
                  nombre: String(m?.nombre ?? ""),
                })) ?? [];
              setMunicipalities(normalizedMun);
            } catch {
              setMunicipalities([]);
            }

            // Cargar localidades de esa provincia
            try {
              const locs = await fetchLocalitiesByProvince(pid);
              const normalizedLocs: GeoRefItem[] =
                locs?.map((l: any) => ({
                  id: String(l?.id),
                  nombre: String(l?.nombre ?? ""),
                })) ?? [];
              setLocalities(normalizedLocs);
            } catch {
              setLocalities([]);
            }
          }
        } catch {
          // Si falla georef, usamos fallback luego en el picker
        }
      } catch (e) {
        console.warn("load profile error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // cleanup del effect
    return () => {
      mounted = false;
    };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Guardar perfil (datos personales + domicilio)
  // ---------------------------------------------------------------------------

  async function handleSave() {
    if (!profile) return;

    // Validaciones mínimas
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showPopup("Error", "El nombre y apellido son obligatorios.");
      return;
    }
    if (!form.email.trim() || !form.dni.trim()) {
      showPopup("Error", "El correo y DNI son obligatorios.");
      return;
    }

    try {
      // Armamos payload en el formato que espera el backend
      const payload: any = {
        idUsuario: profile.idUsuario,
        nombre: form.firstName.trim(),
        apellido: form.lastName.trim(),
        correo: form.email.trim(),
        dni: form.dni.trim(),
        telefono: form.phone?.trim() || "",
        cbu: form.cbu?.trim() || "",

        // Fecha de nacimiento en ISO; si no hay cambio, usamos la original
        dtNacimiento: form.birthdate
          ? new Date(form.birthdate + "T00:00:00Z").toISOString()
          : profile.dtNacimiento,

        // Campos extra que el backend requiere
        nombreFantasia: profile?.nombreFantasia || "",
        bio: profile?.bio || "",

        // cdRoles es requerido: si no viene, ponemos [0] por defecto
        cdRoles:
          Array.isArray(profile?.cdRoles) && profile.cdRoles.length
            ? profile.cdRoles
            : [0],

        // isVerificado normalizado a número
        isVerificado:
          typeof profile?.isVerificado === "number"
            ? profile.isVerificado
            : profile?.isVerificado
            ? 1
            : 0,

        domicilio: {
          provincia: {
            nombre: form.addressProvince || "",
            codigo: provinceId || profile.domicilio?.provincia?.codigo || "",
          },
          municipio: {
            nombre:
              municipalities.find((m) => String(m.id) === String(municipalityId))
                ?.nombre || profile.domicilio?.municipio?.nombre || "",
            codigo: municipalityId || profile.domicilio?.municipio?.codigo || "",
          },
          localidad: {
            nombre:
              form.addressLocality || profile.domicilio?.localidad?.nombre || "",
            codigo: localityId || profile.domicilio?.localidad?.codigo || "",
          },
          direccion: form.addressStreet || profile.domicilio?.direccion || "",
          latitud:
            typeof profile?.domicilio?.latitud === "number"
              ? profile.domicilio.latitud
              : 0,
          longitud:
            typeof profile?.domicilio?.longitud === "number"
              ? profile.domicilio.longitud
              : 0,
        },
        socials: {
          idSocial: profile?.socials?.idSocial || "",
          mdInstagram: profile?.socials?.mdInstagram || "",
          mdSpotify: profile?.socials?.mdSpotify || "",
          mdSoundcloud: profile?.socials?.mdSoundcloud || "",
        },
      };

      // Llamamos al hook de actualización
      const updated = await updateUserProfile(payload);

      // Guardamos perfil actualizado en estado
      setProfile(updated as ApiUserFull);
      setIsEditing(false);
      setIsEditingAddress(false);

      // Mostramos popup de éxito
      setShowUpdateModal(true);
    } catch (err: any) {
      console.error("update profile error", err);
      showPopup(
        "Error",
        err?.response?.data?.title ||
          "Hubo un problema actualizando tus datos. Intentá nuevamente."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Enviar mail de verificación de correo
  // ---------------------------------------------------------------------------

  async function handleSendVerify() {
    if (!form.email?.trim()) {
      showPopup("Error", "El correo está vacío.");
      return;
    }

    try {
      await sendVerifyEmail({
        to: form.email.trim(),
        name: `${form.firstName} ${form.lastName}`.trim() || "Usuario",
      });
      setShowVerifyModal(true);
    } catch (e: any) {
      showPopup(
        "Error",
        e?.response?.data?.title ||
          e?.message ||
          "No se pudo enviar el correo de verificación."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Eliminar cuenta
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!profile?.idUsuario) return;
    try {
      await deleteAccount(); // Este hook, según tu lógica, ya hace logout + redirect
    } catch (e: any) {
      showPopup(
        "Error",
        e?.response?.data?.title ||
          e?.message ||
          "No pudimos eliminar tu cuenta."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Cambio de contraseña
  // ---------------------------------------------------------------------------

  async function handleConfirmChangePassword() {
    // Validaciones de front básicas
    if (!currentPassword) {
      Alert.alert("Error", "Ingresá tu contraseña actual.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert(
        "Error",
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setChangingPassword(true);
      setCurrentPasswordError(null);

      // Endpoint de backend para cambio de contraseña
      // PUT /v1/Usuario/ResetPass?Correo={correo}&Pass={old}&NewPass={new}
      await apiClient.put("/v1/Usuario/ResetPass", null, {
        params: {
          Correo: form.email || profile?.correo,
          Pass: currentPassword,
          NewPass: newPassword,
        },
      });

      // Si todo sale bien, mostramos modal de resultado OK
      setChangeResultMsg("Contraseña actualizada correctamente.");
      setShowChangeResultModal(true);
      setShowChangeModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.log("change password error", e?.message || e);

      const status = e?.response?.status;
      const data = e?.response?.data;
      const text = String(data?.title || data?.message || "").toLowerCase();
      const looksLikeBadCurrent =
        /contraseñ|password|pass|actual/.test(text);

      // Si el backend devuelve 401/403 o texto que parece "password incorrecta"
      if (status === 401 || status === 403 || looksLikeBadCurrent) {
        setChangeResultMsg("La contraseña original no es correcta.");
        setShowChangeResultModal(true);
        setShowChangeModal(false);
      } else {
        const msg =
          data?.title ||
          data?.message ||
          e?.message ||
          "No se pudo actualizar la contraseña.";
        setChangeResultMsg(msg);
        setShowChangeResultModal(true);
        setShowChangeModal(false);
      }
    } finally {
      setChangingPassword(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading inicial
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render principal
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Popup genérico (éxito/error) por encima de todo */}
      {popupVisible && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupModal}>
            <View style={styles.popupHeaderIcon}>
              <Text style={styles.popupCheck}>✓</Text>
            </View>
            <Text style={styles.popupTitle}>{popupTitle}</Text>
            <Text style={styles.popupText}>{popupMessage}</Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => {
                setPopupVisible(false);
                if (popupOnClose) popupOnClose();
              }}
            >
              <Text style={styles.popupButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header global de la app */}
      <Header />

      {/* Contenido scrolleable del perfil */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título principal */}
        <Text style={styles.title}>Mi perfil</Text>

        {/* Foto de perfil + botón para cambiarla */}
        <View style={styles.photoRow}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={photo ? { uri: photo } : undefined}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <MaterialIcons name="edit" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Card: datos personales */}
        <View style={styles.card}>
          <View className="rowBetween">
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Tus datos</Text>
              <TouchableOpacity onPress={() => setIsEditing((v) => !v)}>
                <MaterialIcons
                  name={isEditing ? "check" : "edit"}
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
            value={form.firstName}
            onChangeText={(t) => setField("firstName", t)}
            placeholder="Nombre"
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
            value={form.lastName}
            onChangeText={(t) => setField("lastName", t)}
            placeholder="Apellido"
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.rowWithButton}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                !isEditing && styles.inputDisabled,
              ]}
              editable={isEditing}
              value={form.email}
              onChangeText={(t) => setField("email", t)}
              placeholder="Correo"
            />
            {/* Botón de "Verificar" si el correo no está verificado */}
            {profile?.isVerificado !== 1 && (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleSendVerify}
                disabled={sendingVerify}
              >
                <Text style={styles.verifyText}>
                  {sendingVerify ? "Enviando..." : "Verificar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
            value={form.dni}
            onChangeText={(t) => setField("dni", t)}
            placeholder="DNI"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Fecha de nacimiento</Text>
          {/* Fecha mostrada formateada, solo lectura */}
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            editable={false}
            value={formatDateForUI(form.birthdate)}
            placeholder="dd/mm/aaaa"
          />

          <Text style={styles.label}>CBU</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
            value={form.cbu}
            onChangeText={(t) => setField("cbu", t)}
            placeholder="CBU"
          />
        </View>

        {/* Card: seguridad (cambio de contraseña) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seguridad</Text>
          <Text
            style={[styles.label, { marginTop: 8, fontWeight: "400" }]}
          >
            Administrá el acceso a tu cuenta.
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, { marginTop: 12 }]}
            onPress={() => setShowChangeModal(true)}
          >
            <Text style={styles.saveText}>Cambiar contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Modal: cambiar contraseña */}
        <Modal
          visible={showChangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChangeModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCardCompact}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar contraseña</Text>
                <TouchableOpacity
                  onPress={() => setShowChangeModal(false)}
                  style={styles.closeBtn}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalMsg, { marginBottom: 12 }]}>
                Ingresá tu contraseña actual y la nueva contraseña.
              </Text>

              {/* Contraseña actual */}
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={(t) => {
                    setCurrentPassword(t);
                    setCurrentPasswordError(null);
                  }}
                  placeholder="Contraseña actual"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowCurrentPassword((v) => !v)
                  }
                  style={styles.eyeBtn}
                >
                  <MaterialIcons
                    name={
                      showCurrentPassword
                        ? "visibility"
                        : "visibility-off"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {currentPasswordError ? (
                <Text style={styles.inputError}>{currentPasswordError}</Text>
              ) : null}

              {/* Nueva contraseña */}
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nueva contraseña"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <MaterialIcons
                    name={
                      showNewPassword
                        ? "visibility"
                        : "visibility-off"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Repetir nueva contraseña */}
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repetir nueva contraseña"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  style={styles.eyeBtn}
                >
                  <MaterialIcons
                    name={
                      showConfirmPassword
                        ? "visibility"
                        : "visibility-off"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Botones del modal de cambio de contraseña */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowChangeModal(false)}
                  disabled={changingPassword}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    changingPassword && { opacity: 0.7 },
                  ]}
                  onPress={handleConfirmChangePassword}
                  disabled={changingPassword}
                >
                  <Text style={{ color: "#fff" }}>
                    {changingPassword ? "Procesando..." : "Confirmar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Card: domicilio */}
        <View className="card" style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Tu domicilio</Text>
            <TouchableOpacity
              onPress={() => setIsEditingAddress((v) => !v)}
            >
              <MaterialIcons
                name={isEditingAddress ? "check" : "edit"}
                size={18}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Selector de provincia */}
          <SelectField
            label="Provincia"
            value={form.addressProvince}
            placeholder="Seleccione provincia"
            onPress={() => {
              if (!isEditingAddress) return;
              setShowProvincePicker((v) => !v);
            }}
            disabled={!isEditingAddress}
            isOpen={showProvincePicker}
          />

          {/* Lista desplegable de provincias */}
          {showProvincePicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={{ paddingVertical: 4 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {(provinces && provinces.length
                  ? provinces
                  : FALLBACK_PROVINCES.map((n, i) => ({
                      id: String(i),
                      nombre: n,
                    } as GeoRefItem))
                ).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={async () => {
                      // Actualizamos el formulario con la provincia elegida
                      setField("addressProvince", item.nombre);
                      const pid = String(item.id);
                      setProvinceId(pid);

                      // Detectamos si es CABA por nombre
                      const lower = String(item.nombre || "").toLowerCase();
                      const isCabaSelected =
                        lower.includes("ciudad") &&
                        lower.includes("buenos") &&
                        lower.includes("aires");
                      setIsCABA(isCabaSelected);

                      // Reseteamos dependientes
                      setMunicipalityId("");
                      setLocalityId("");
                      setMunicipalities([]);
                      setLocalities([]);
                      setField("addressLocality", "");
                      setShowProvincePicker(false);

                      // Si es CABA, auto-completar localidad/municipio
                      if (isCabaSelected) {
                        const cabaText =
                          "Ciudad Autónoma de Buenos Aires";
                        setMunicipalityId(pid);
                        setLocalityId(pid);
                        setField("addressLocality", cabaText);
                      }

                      // Cargar municipios para la provincia seleccionada
                      try {
                        const mun = await fetchMunicipalities(pid);
                        const normalizedMun: GeoRefItem[] =
                          mun?.map((m: any) => ({
                            id: String(m?.id),
                            nombre: String(m?.nombre ?? ""),
                          })) ?? [];
                        setMunicipalities(normalizedMun);
                      } catch {
                        setMunicipalities([]);
                      }

                      // Cargar localidades por provincia
                      try {
                        const locs = await fetchLocalitiesByProvince(pid);
                        const normalizedLocs: GeoRefItem[] =
                          locs?.map((l: any) => ({
                            id: String(l?.id),
                            nombre: String(l?.nombre ?? ""),
                          })) ?? [];
                        setLocalities(normalizedLocs);
                      } catch {
                        // ignoramos error de localidades
                      }
                    }}
                  >
                    <Text>{item.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selector de municipio */}
          <SelectField
            label="Municipio"
            value={
              isCABA
                ? form.addressProvince || "Ciudad Autónoma de Buenos Aires"
                : municipalityId
                ? municipalities.find(
                    (m) => String(m.id) === municipalityId
                  )?.nombre || ""
                : ""
            }
            placeholder={
              isCABA
                ? "Ciudad Autónoma de Buenos Aires"
                : "Seleccione un municipio"
            }
            onPress={() => {
              if (!isEditingAddress) return;
              if (isCABA) return; // En CABA no mostramos lista
              setShowMunicipalityPicker((v) => !v);
              setShowProvincePicker(false);
              setShowLocalityPicker(false);
            }}
            disabled={
              !isEditingAddress ||
              !provinceId ||
              isCABA ||
              municipalities.length === 0
            }
            isOpen={showMunicipalityPicker}
          />

          {/* Lista desplegable de municipios */}
          {showMunicipalityPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={{ paddingVertical: 4 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {municipalities.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.dropdownItem}
                    onPress={async () => {
                      const mid = String(m.id);
                      setMunicipalityId(mid);
                      // Reset de localidad
                      setLocalityId("");
                      setField("addressLocality", "");
                      setLocalities([]);
                      setShowMunicipalityPicker(false);
                      setShowLocalityPicker(false);

                      // Cargar localidades para ese municipio
                      try {
                        const locs = await fetchLocalities(
                          String(provinceId),
                          mid
                        );
                        const normalizedLocs: GeoRefItem[] =
                          locs?.map((l: any) => ({
                            id: String(l?.id),
                            nombre: String(l?.nombre ?? ""),
                          })) ?? [];
                        setLocalities(normalizedLocs);
                      } catch {
                        setLocalities([]);
                      }
                    }}
                  >
                    <Text>{m.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selector de localidad */}
          <SelectField
            label="Localidad"
            value={form.addressLocality}
            placeholder="Seleccione una localidad"
            onPress={() => {
              if (!isEditingAddress) return;
              if (isCABA) return; // En CABA se deja fija
              setShowLocalityPicker((v) => !v);
              setShowProvincePicker(false);
              setShowMunicipalityPicker(false);
            }}
            disabled={
              !isEditingAddress ||
              isCABA ||
              !provinceId ||
              (!municipalityId && !localities.length)
            }
            isOpen={showLocalityPicker}
          />

          {/* Lista desplegable de localidades */}
          {showLocalityPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={{ paddingVertical: 4 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {localities.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setLocalityId(String(l.id));
                      setField("addressLocality", String(l.nombre));
                      setShowLocalityPicker(false);
                    }}
                  >
                    <Text>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Dirección */}
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, !isEditingAddress && styles.inputDisabled]}
            editable={isEditingAddress}
            value={form.addressStreet}
            onChangeText={(t) => setField("addressStreet", t)}
            placeholder="Dirección"
          />
        </View>

        {/* Acciones finales: guardar, logout, eliminar cuenta */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={!!updatingProfile}
          >
            <Text style={styles.saveText}>
              {updatingProfile ? "Guardando..." : "Confirmar cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              nav.replace(router, ROUTES.LOGIN.LOGIN);
            }}
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteText}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Modal: correo de verificación enviado */}
        <Modal visible={showVerifyModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Correo enviado</Text>
              <Text style={styles.modalMsg}>
                Te enviamos un correo electrónico para que puedas verificar tu
                dirección.
              </Text>
              <TouchableOpacity
                style={styles.modalOk}
                onPress={() => setShowVerifyModal(false)}
              >
                <Text style={styles.modalOkText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal: resultado del cambio de contraseña */}
        <Modal
          visible={showChangeResultModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChangeResultModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Cambio de contraseña</Text>
              <Text style={styles.modalMsg}>{changeResultMsg || ""}</Text>
              <TouchableOpacity
                style={styles.modalOk}
                onPress={() => setShowChangeResultModal(false)}
              >
                <Text style={styles.modalOkText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal: confirmación de eliminación de cuenta */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Estás seguro?</Text>
              <Text style={styles.modalMsg}>
                Esta acción va a eliminar tu cuenta de forma permanente.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#b0b0b0" },
                  ]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: COLORS.negative },
                  ]}
                  onPress={handleDelete}
                >
                  <Text style={{ color: "#fff" }}>
                    {deletingAccount ? "Eliminando..." : "Confirmo eliminar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Popup de éxito al actualizar perfil */}
        <ProfileUserPopupUpdateOk
          visible={showUpdateModal}
          userName={`${form.firstName} ${form.lastName}`.trim()}
          loading={!!updatingProfile}
          onClose={() => setShowUpdateModal(false)}
        />
      </ScrollView>

      {/* Footer global de la app */}
      <Footer />
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Estilos
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  // ===== Popup genérico =====
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
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
    paddingVertical: 12,
    marginTop: 8,
    alignItems: "center",
  },
  popupButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // ===== Layout general =====
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ===== Título =====
  title: {
    fontSize: FONT_SIZES.titleMain,
    fontFamily: FONTS.titleBold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // ===== Foto de perfil =====
  photoRow: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  photoBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  // ===== Cards =====
  card: {
    width: "90%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
  },
  label: {
    marginTop: 10,
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
  },

  // ===== Inputs =====
  input: {
    marginTop: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  inputDisabled: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  rowWithButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  verifyBtn: {
    marginLeft: 8,
    backgroundColor: "#E9E5FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  verifyText: { color: COLORS.primary, fontWeight: "700" },

  // ===== Acciones finales =====
  actions: { width: "90%", marginTop: 8 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginBottom: 8,
  },
  saveText: { color: COLORS.cardBg, fontFamily: FONTS.subTitleMedium },
  logoutBtn: {
    backgroundColor: "#E9E5FF",
    padding: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginBottom: 8,
  },
  logoutText: { color: COLORS.primary, fontFamily: FONTS.subTitleMedium },
  deleteBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  deleteText: { color: "#ef4444" },

  // ===== Modales =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalMsg: { textAlign: "center", color: COLORS.textPrimary },
  modalOk: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalOkText: { color: "#fff" },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },

  // Modal cambio contraseña compacto
  modalCardCompact: {
    width: 360,
    maxWidth: "95%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 18,
    alignItems: "stretch",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: { position: "absolute", right: 8, top: 6, padding: 6 },
  inputWithIcon: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  eyeBtn: { padding: 8 },
  modalActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  inputError: { color: "#ef4444", marginTop: 6, alignSelf: "flex-start" },

  // Dropdowns de provincia/municipio/localidad
  dropdownContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignSelf: "center",
    overflow: "hidden",
  },
  menuScrollView: {
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
});
