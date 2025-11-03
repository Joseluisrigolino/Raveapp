// src/screens/UserProfileEditScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile, updateUsuario } from "@/app/auth/userHelpers";
import { mediaApi } from "@/app/apis/mediaApi";
import { apiClient } from "@/app/apis/apiConfig";
import InputText from "@/components/common/inputText";

// Georef
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByProvince,
} from "@/app/apis/georefHelpers";

export default function UserProfileEditScreen() {
  // ...existing code...
  const { user, logout } = useAuth();
  const router = useRouter();

  // Perfil
  const [apiUser, setApiUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Imagen actual y media
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileMediaId, setProfileMediaId] = useState<string | null>(null);

  // Selección pendiente de foto
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [previousProfileImage, setPreviousProfileImage] = useState<string>("");
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Edit modes
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    firstName: false,
    lastName: false,
    dni: false,
    phone: false,
    email: false,
    birthdate: false,
    "address.province": false,
    "address.municipality": false,
    "address.locality": false,
    "address.street": false,
  });

  // Datos del usuario
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    birthdate: "",
    address: {
      province: "",
      municipality: "",
      locality: "",
      street: "",
      number: "",
      floorDept: "",
    },
  });

  // Georef lists
  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const [municipalities, setMunicipalities] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localities, setLocalities] = useState<
    { id: string; nombre: string }[]
  >([]);

  // Dropdowns visibles
  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);

  // Errores visuales para la sección de domicilio
  const [addressErrors, setAddressErrors] = useState<{
    province: boolean;
    municipality: boolean;
    locality: boolean;
    street: boolean;
  }>({ province: false, municipality: false, locality: false, street: false });

  // Selecciones actuales (IDs)
  const [provinceId, setProvinceId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [localityId, setLocalityId] = useState("");

  // Estados para los selectores de fecha de nacimiento
  const [dateSelectors, setDateSelectors] = useState({
    day: "",
    month: "",
    year: "",
  });
  
  // Estados para controlar la visibilidad de los menús de fecha
  const [menuVisible, setMenuVisible] = useState({
    day: false,
    month: false,
    year: false,
  });

  // Foto fallback
  const randomProfileImage = useMemo(
    () => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/100`,
    []
  );

  // Generar opciones para los selectores de fecha
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  // ====== MODAL CAMBIO DE CONTRASEÑA ======
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ====== MODAL ELIMINAR CUENTA ======
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Carga inicial
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // 1) Perfil
        const u = await getProfile(user.username);
        setApiUser(u);

        const rawDireccion = u.domicilio?.direccion ?? "";
        setUserData({
          firstName: u.nombre,
          lastName: u.apellido,
          dni: u.dni,
          phone: u.telefono,
          email: u.correo,
          birthdate: u.dtNacimiento?.split?.("T")?.[0] ?? "",
          address: {
            province: u.domicilio?.provincia?.nombre ?? "",
            municipality: u.domicilio?.municipio?.nombre ?? "",
            locality: u.domicilio?.localidad?.nombre ?? "",
            street: rawDireccion,
            number: "",
            floorDept: "",
          },
        });

        // Inicializar selectores de fecha si hay fecha de nacimiento
        const birthDateStr = u.dtNacimiento?.split?.("T")?.[0] ?? "";
        if (birthDateStr && /^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
          const [year, month, day] = birthDateStr.split('-');
          setDateSelectors({ day, month, year });
        }

        // Set IDs if available from API
        setProvinceId(u.domicilio?.provincia?.codigo || "");
        setMunicipalityId(u.domicilio?.municipio?.codigo || "");
        setLocalityId(u.domicilio?.localidad?.codigo || "");

        // Cargar provincias para selects
        try {
          const provs = await fetchProvinces();
          setProvinces(provs);
        } catch {}

        // Intentar cargar media de perfil si existe
        try {
          const media = await mediaApi.getByEntidad(u.idUsuario);
          const m = media?.media?.[0];
          let finalUrl = m?.url ?? m?.imagen ?? "";
          if (finalUrl && m?.imagen && !/^https?:\/\//.test(finalUrl)) {
            finalUrl = `${apiClient.defaults.baseURL}${finalUrl.startsWith("/") ? "" : "/"}${finalUrl}`;
          }
          setProfileImage(finalUrl || randomProfileImage);
          setProfileMediaId(m?.idMedia ?? null);
        } catch {
          setProfileImage(randomProfileImage);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Helpers
  const onChange = (field: string, value: string) =>
    setUserData((d) => ({ ...d, [field]: value }));
  const onAddressChange = (field: string, value: string) => {
    // limpiar el error visual correspondiente cuando el usuario edita
    setAddressErrors((e) => ({ ...e, [field]: false } as any));
    setUserData((d) => ({ ...d, address: { ...d.address, [field]: value } }));
  };

  const toggle = (key: string) => {
    // Especial: al editar la provincia, desplegar todos los campos de domicilio
    if (key === "address.province") {
      setEditMode((m) => ({
        ...m,
        ["address.province"]: true,
        // mostrar municipio sólo si la provincia actual NO es CABA (02)
        ["address.municipality"]: provinceId !== '02',
        ["address.locality"]: true,
        ["address.street"]: true,
      }));
      // limpiar errores visuales cuando el usuario decide editar
      setAddressErrors({ province: false, municipality: false, locality: false, street: false });
      return;
    }

    setEditMode((m) => ({ ...m, [key]: !m[key] }));

    // Si se está activando el modo de edición de birthdate, inicializar selectores
    if (key === "birthdate" && !editMode[key] && userData.birthdate) {
      const birthDateStr = userData.birthdate;
      if (birthDateStr && /^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
        const [year, month, day] = birthDateStr.split('-');
        setDateSelectors({
          day: day,
          month: month,
          year: year,
        });
      }
    }
  };

  // Función para actualizar la fecha completa cuando cambian los selectores
  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const formattedDate = `${year}-${month}-${day}`;
      onChange("birthdate", formattedDate);
    }
  };

  // Funciones para manejar los cambios en los selectores de fecha
  const handleDateSelectorChange = (type: 'day' | 'month' | 'year', value: string) => {
    const newSelectors = { ...dateSelectors, [type]: value };
    setDateSelectors(newSelectors);
    setMenuVisible(prev => ({ ...prev, [type]: false }));
    updateBirthDate(newSelectors.day, newSelectors.month, newSelectors.year);
  };

  // Georef handlers
  const handleSelectProvince = async (id: string, nombre: string) => {
    setProvinceId(id);
    onAddressChange("province", nombre);
    setShowProvinces(false);
    setMunicipalityId("");
    setLocalityId("");
    setMunicipalities([]);
    setLocalities([]);
    onAddressChange("municipality", "");
    onAddressChange("locality", "");
    
    // Lógica especial para Ciudad Autónoma de Buenos Aires (CABA)
    if (id === '02') {
      // Para CABA, el municipio es la misma CABA
      setMunicipalityId('02');
      onAddressChange("municipality", "Ciudad Autónoma de Buenos Aires");
      try {
        // Cargar localidades de CABA directamente (sin municipio específico)
        setLocalities(await fetchLocalitiesByProvince(id));
      } catch {}
    } else {
      // Para otras provincias, cargar municipios normalmente
      try {
        setMunicipalities(await fetchMunicipalities(id));
      } catch {}
    }
  };
  const handleSelectMunicipality = async (id: string, nombre: string) => {
    setMunicipalityId(id);
    onAddressChange("municipality", nombre);
    setShowMunicipalities(false);
    setLocalityId("");
    setLocalities([]);
    onAddressChange("locality", "");
    try {
      setLocalities(await fetchLocalities(provinceId, id));
    } catch {}
  };
  const handleSelectLocality = (id: string, nombre: string) => {
    setLocalityId(id);
    onAddressChange("locality", nombre);
    setShowLocalities(false);
  };

  // ===== IMAGEN DE PERFIL =====
  const handleSelectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileInfo: any = await FileSystem.getInfoAsync(asset.uri);
      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert(
          "Imagen demasiado grande",
          "La imagen seleccionada supera el máximo permitido (2MB). Por favor, elige una imagen más liviana."
        );
        return;
      }
      setPreviousProfileImage(profileImage);
      setPendingPhotoUri(asset.uri);
      setProfileImage(asset.uri);
    } catch (err: any) {
      // Si el error tiene información sobre el tamaño, mostrar alerta específica
      const msg = typeof err === "object" && err !== null && "message" in err ? String((err as any).message) : "";
      if (msg.toLowerCase().includes("size") || msg.toLowerCase().includes("too large") || msg.includes("2MB")) {
        Alert.alert(
          "Imagen demasiado grande",
          "La imagen seleccionada supera el máximo permitido (2MB). Por favor, elige una imagen más liviana."
        );
      } else {
        Alert.alert("Error", "No se pudo seleccionar la imagen.");
      }
    }
  };
  const handleCancelPhoto = () => {
    if (previousProfileImage) setProfileImage(previousProfileImage);
    setPendingPhotoUri(null);
  };
  const handleAcceptPhoto = async () => {
    if (!apiUser || !pendingPhotoUri) return;
    setSavingPhoto(true);
    try {
      if (profileMediaId) {
        try {
          await mediaApi.delete(profileMediaId);
        } catch {}
      }
      const fileName = pendingPhotoUri.split("/").pop() ?? "profile.jpg";
      const file: any = {
        uri: pendingPhotoUri,
        name: fileName,
        type: "image/jpeg",
      };
  await mediaApi.upload(apiUser.idUsuario, file, undefined, { compress: true });

      const media = await mediaApi.getByEntidad(apiUser.idUsuario);
      const m = media?.media?.[0];
      let finalUrl = m?.url ?? m?.imagen ?? "";
      if (finalUrl && m?.imagen && !/^https?:\/\//.test(finalUrl)) {
        finalUrl = `${apiClient.defaults.baseURL}${
          finalUrl.startsWith("/") ? "" : "/"
        }${finalUrl}`;
      }
      setProfileImage(finalUrl || pendingPhotoUri);
      setProfileMediaId(m?.idMedia ?? null);
      setPendingPhotoUri(null);
      Alert.alert("Listo", "Tu foto de perfil fue actualizada.");
    } catch {
      Alert.alert("Error", "No pudimos actualizar tu foto. Intenta de nuevo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  // ===== CONTRASEÑA =====
  async function verifyCurrentPassword(email: string, currentPassword: string) {
    try {
      const { data } = await apiClient.get<boolean>("/v1/Usuario/Login", {
        params: { Correo: email, Password: currentPassword },
      });
      return !!data;
    } catch {
      return false;
    }
  }
  async function updatePasswordRemote(
    email: string,
    currentPassword: string,
    newPassword: string
  ) {
    await apiClient.put("/v1/Usuario/ResetPass", null, {
      params: { Correo: email, Pass: currentPassword, NewPass: newPassword },
    });
  }
  const openPwdModal = () => {
    setPwdCurrent("");
    setPwdNew("");
    setPwdConfirm("");
    setPwdError(null);
    setShowPwdModal(true);
  };
  const handleConfirmPasswordChange = async () => {
    if (!apiUser) return;
    setPwdError(null);
    if (!pwdCurrent || !pwdNew || !pwdConfirm)
      return setPwdError("Completá todos los campos.");
    if (pwdNew.length < 6)
      return setPwdError(
        "La nueva contraseña debe tener al menos 6 caracteres."
      );
    if (pwdNew !== pwdConfirm)
      return setPwdError("La confirmación no coincide.");
    setPwdLoading(true);
    try {
      const ok = await verifyCurrentPassword(userData.email, pwdCurrent);
      if (!ok) return setPwdError("La contraseña actual no es correcta.");
      await updatePasswordRemote(userData.email, pwdCurrent, pwdNew);
      setShowPwdModal(false);
      Alert.alert("Éxito", "Tu contraseña fue actualizada.");
    } catch (e: any) {
      setPwdError(
        e?.response?.data?.title || "No se pudo actualizar la contraseña."
      );
    } finally {
      setPwdLoading(false);
    }
  };

  // ===== GUARDAR PERFIL =====
  const handleConfirm = async () => {
    if (!apiUser) return;
    
    // Validar datos antes de enviar
    if (!userData.firstName?.trim() || !userData.lastName?.trim()) {
      Alert.alert("Error", "El nombre y apellido son obligatorios.");
      return;
    }
    
    if (!userData.email?.trim() || !userData.dni?.trim()) {
      Alert.alert("Error", "El correo y DNI son obligatorios.");
      return;
    }

    // Si el usuario abrió la sección de domicilio (o seleccionó provincia), validar que esté completa
    const addressEdited = editMode["address.province"] || editMode["address.locality"] || editMode["address.municipality"] || editMode["address.street"];
    if (addressEdited) {
      const missingProvince = !userData.address.province?.trim();
      const missingStreet = !userData.address.street?.trim();
      // Si no es CABA, es necesario municipio y localidad; si es CABA (02) no pedir municipio
      const missingLocality = !userData.address.locality?.trim();
      const missingMunicipality = provinceId !== '02' && !userData.address.municipality?.trim();

      if (missingProvince || missingStreet || missingLocality || missingMunicipality) {
        setAddressErrors({ province: missingProvince, municipality: missingMunicipality, locality: missingLocality, street: missingStreet });
        Alert.alert("Error", "Si editás el domicilio, por favor completá todos los campos requeridos de la sección.");
        return;
      }
    }
    
    // Construir el domicilio actualizado
    const updatedDomicilio = {
      provincia: {
        nombre: userData.address.province || apiUser.domicilio?.provincia?.nombre || "",
        codigo: provinceId || apiUser.domicilio?.provincia?.codigo || ""
      },
      municipio: {
        nombre: userData.address.municipality || apiUser.domicilio?.municipio?.nombre || "",
        codigo: municipalityId || apiUser.domicilio?.municipio?.codigo || ""
      },
      localidad: {
        nombre: userData.address.locality || apiUser.domicilio?.localidad?.nombre || "",
        codigo: localityId || apiUser.domicilio?.localidad?.codigo || ""
      },
      direccion: userData.address.street?.trim() || "",
      latitud: apiUser.domicilio?.latitud || 0,
      longitud: apiUser.domicilio?.longitud || 0,
    };
    
    // Formatear fecha de nacimiento correctamente
    let formattedBirthdate = apiUser.dtNacimiento;
    if (userData.birthdate) {
      try {
        const date = new Date(userData.birthdate + 'T00:00:00.000Z');
        if (!isNaN(date.getTime())) {
          formattedBirthdate = date.toISOString();
        }
      } catch (dateErr) {
        console.warn("Error formateando fecha:", dateErr);
      }
    }
    
    const payload = {
      idUsuario: apiUser.idUsuario,
      nombre: userData.firstName.trim(),
      apellido: userData.lastName.trim(),
      correo: userData.email.trim(),
      dni: userData.dni.trim(),
      telefono: userData.phone?.trim() || "",
      cbu: apiUser.cbu || "",
      nombreFantasia: apiUser.nombreFantasia || "",
      bio: apiUser.bio || "",
      dtNacimiento: formattedBirthdate,
      domicilio: updatedDomicilio,
      cdRoles: apiUser.cdRoles || [], // Incluir roles existentes
      socials: {
        idSocial: (apiUser.socials?.idSocial && apiUser.socials.idSocial !== null) ? apiUser.socials.idSocial : "",
        mdInstagram: (apiUser.socials?.mdInstagram && apiUser.socials.mdInstagram !== null) ? apiUser.socials.mdInstagram : "",
        mdSpotify: (apiUser.socials?.mdSpotify && apiUser.socials.mdSpotify !== null) ? apiUser.socials.mdSpotify : "",
        mdSoundcloud: (apiUser.socials?.mdSoundcloud && apiUser.socials.mdSoundcloud !== null) ? apiUser.socials.mdSoundcloud : ""
      }
    };
    
    console.log("Payload a enviar:", JSON.stringify(payload, null, 2));
    
    try {
      await updateUsuario(payload);
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      setEditMode(
        Object.fromEntries(Object.keys(editMode).map((k) => [k, false]))
      );
      
      // Recargar el perfil para mostrar los datos actualizados
      if (user) {
        try {
          const updatedProfile = await getProfile(user.username);
          setApiUser(updatedProfile);
        } catch (refreshErr) {
          console.warn("No se pudo refrescar el perfil:", refreshErr);
        }
      }
    } catch (err: any) {
      console.error("Error actualizando usuario:", err);
      console.error("Response data:", err?.response?.data);
      console.error("Response status:", err?.response?.status);
      console.error("Response headers:", err?.response?.headers);
      
      let errorMessage = "Hubo un problema actualizando tus datos.";
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.title) {
          errorMessage = data.title;
        } else if (data.errors) {
          const errors = Object.entries(data.errors)
            .map(([field, messages]: [string, any]) => {
              const messageList = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${messageList.join(', ')}`;
            })
            .join('\n');
          errorMessage = `Errores de validación:\n${errors}`;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  // ===== ELIMINAR CUENTA =====
  const openDeleteModal = () => setShowDeleteModal(true);

  const handleConfirmDeleteAccount = async () => {
    if (!apiUser?.idUsuario) return;
    try {
      setDeleteLoading(true);

      // limpiar media
      try {
        const media = await mediaApi.getByEntidad(apiUser.idUsuario);
        const items: any[] = Array.isArray(media?.media) ? media.media : [];
        if (items.length) {
          await Promise.allSettled(
            items.map((m: any) => mediaApi.delete(m.idMedia))
          );
        }
      } catch {}

      await apiClient.delete(`/v1/Usuario/DeleteUsuario/${apiUser.idUsuario}`);
      setShowDeleteModal(false);
  logout();
  nav.replace(router, ROUTES.LOGIN.LOGIN);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.title || "No pudimos eliminar tu cuenta."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // Render auxiliar movido a componente InputText

  return (
    <SafeAreaView style={styles.container}>
      <Header />
  <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={styles.mainTitle}>Mi Perfil</Text>

        {/* Foto (tap en imagen o lápiz abre selector) */}
        <View style={styles.photoContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleSelectPhoto}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoEditButton}
            onPress={handleSelectPhoto}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Botones Aceptar / Cancelar cuando hay selección pendiente */}
        {pendingPhotoUri && (
          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[styles.photoActionBtn, styles.acceptBtn]}
              disabled={savingPhoto}
              onPress={handleAcceptPhoto}
            >
              <Text style={styles.photoActionText}>
                {savingPhoto ? "Guardando..." : "Aceptar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoActionBtn, styles.cancelBtn]}
              disabled={savingPhoto}
              onPress={handleCancelPhoto}
            >
              <Text style={styles.photoActionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nombre completo debajo del avatar */}
        <Text style={styles.profileName}>
          {`${userData.firstName || ''} ${userData.lastName || ''}`.trim() || ' '}
        </Text>

        <Text style={styles.smallNote}>
          Formatos permitidos: JPG, JPEG o PNG. Máx. 2MB.
        </Text>

        {/* Card: Tus datos */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="person" size={18} color={COLORS.textPrimary} />
            <Text style={styles.sectionCardTitle}>Tus datos</Text>
          </View>

        {/* Mi perfil */}
        <InputText
          label="Nombre"
          value={userData.firstName}
          isEditing={!!editMode["firstName"]}
          onBeginEdit={() => setEditMode((m) => ({ ...m, firstName: true }))}
          onChangeText={(t) => onChange("firstName", t)}
        />
        <InputText
          label="Apellido"
          value={userData.lastName}
          isEditing={!!editMode["lastName"]}
          onBeginEdit={() => setEditMode((m) => ({ ...m, lastName: true }))}
          onChangeText={(t) => onChange("lastName", t)}
        />
        <InputText
          label="DNI"
          value={userData.dni}
          isEditing={!!editMode["dni"]}
          onBeginEdit={() => setEditMode((m) => ({ ...m, dni: true }))}
          keyboardType="numeric"
          onChangeText={(t) => onChange("dni", t)}
        />
        <InputText
          label="Teléfono"
          value={userData.phone}
          isEditing={!!editMode["phone"]}
          onBeginEdit={() => setEditMode((m) => ({ ...m, phone: true }))}
          keyboardType="phone-pad"
          onChangeText={(t) => onChange("phone", t)}
        />
        <InputText
          label="Correo"
          value={userData.email}
          isEditing={!!editMode["email"]}
          onBeginEdit={() => setEditMode((m) => ({ ...m, email: true }))}
          keyboardType="email-address"
          onChangeText={(t) => onChange("email", t)}
        />
        
        {/* Fecha de nacimiento con selectores */}
        <Text style={styles.addressSubtitle}>Fecha de nacimiento</Text>
        {editMode["birthdate"] ? (
          <>
            <View style={styles.dateContainer}>
              {/* Selector de Día */}
              <View style={styles.selectorContainer}>
                <Menu
                  visible={menuVisible.day}
                  onDismiss={() => setMenuVisible(prev => ({ ...prev, day: false }))}
                  anchor={
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => setMenuVisible(prev => ({ ...prev, day: true }))}
                    >
                      <Text style={styles.dateSelectorText}>
                        {dateSelectors.day || "Día"}
                      </Text>
                    </TouchableOpacity>
                  }
                  contentStyle={styles.menuContent}
                >
                  <ScrollView style={styles.menuScrollView}>
                    {days.map((day) => (
                      <Menu.Item
                        key={day}
                        onPress={() => handleDateSelectorChange('day', day)}
                        title={day}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                  </ScrollView>
                </Menu>
              </View>

              {/* Selector de Mes */}
              <View style={styles.selectorContainer}>
                <Menu
                  visible={menuVisible.month}
                  onDismiss={() => setMenuVisible(prev => ({ ...prev, month: false }))}
                  anchor={
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => setMenuVisible(prev => ({ ...prev, month: true }))}
                    >
                      <Text style={styles.dateSelectorText}>
                        {months.find(m => m.value === dateSelectors.month)?.label || "Mes"}
                      </Text>
                    </TouchableOpacity>
                  }
                  contentStyle={styles.menuContent}
                >
                  <ScrollView style={styles.menuScrollView}>
                    {months.map((month) => (
                      <Menu.Item
                        key={month.value}
                        onPress={() => handleDateSelectorChange('month', month.value)}
                        title={month.label}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                  </ScrollView>
                </Menu>
              </View>

              {/* Selector de Año */}
              <View style={styles.selectorContainer}>
                <Menu
                  visible={menuVisible.year}
                  onDismiss={() => setMenuVisible(prev => ({ ...prev, year: false }))}
                  anchor={
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={() => setMenuVisible(prev => ({ ...prev, year: true }))}
                    >
                      <Text style={styles.dateSelectorText}>
                        {dateSelectors.year || "Año"}
                      </Text>
                    </TouchableOpacity>
                  }
                  contentStyle={styles.menuContent}
                >
                  <ScrollView style={styles.menuScrollView}>
                    {years.map((year) => (
                      <Menu.Item
                        key={year}
                        onPress={() => handleDateSelectorChange('year', year)}
                        title={year}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                  </ScrollView>
                </Menu>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.rowNoLabel}>
            <Text style={[styles.valueText, { flex: 1 }]}>{
              userData.birthdate ? 
                (() => {
                  const date = new Date(userData.birthdate + 'T00:00:00');
                  return date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  });
                })() 
                : "–"
            }</Text>
            <TouchableOpacity
              onPress={() => toggle("birthdate")}
              style={styles.icon}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

          {/* Cambiar contraseña (gris dentro de la card) */}
          <TouchableOpacity style={styles.resetContainerCard} onPress={openPwdModal}>
            <MaterialIcons name="lock-reset" size={20} color={COLORS.textPrimary} />
            <Text style={styles.resetTextCard}>Cambiar contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Card: Tu domicilio */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="home" size={18} color={COLORS.textPrimary} />
            <Text style={styles.sectionCardTitle}>Tu domicilio</Text>
          </View>

        {/* Provincia */}
        <Text style={styles.addressSubtitle}>Provincia</Text>
        {editMode["address.province"] ? (
          <>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                setShowProvinces(!showProvinces);
                setShowMunicipalities(false);
                setShowLocalities(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {userData.address.province || "Seleccione provincia"}
              </Text>
            </TouchableOpacity>
                {showProvinces && (
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" style={[styles.dropdownContainer, { maxHeight: 180 }]}>
                {provinces.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectProvince(p.id, p.nombre)}
                  >
                    <Text style={styles.dropdownItemText}>{p.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <View style={styles.rowNoLabel}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.province || "–"}
            </Text>
            <TouchableOpacity
              onPress={() => toggle("address.province")}
              style={styles.icon}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
    </View>
  )}

        {/* Municipio: ocultar por completo si la provincia seleccionada es CABA (02) */}
        {provinceId !== '02' && (
          <>
            <Text style={styles.addressSubtitle}>Municipio</Text>
            {editMode["address.municipality"] ? (
              <>
                <TouchableOpacity
                  style={[styles.dropdownButton, (!provinceId) && { opacity: 0.5 }, addressErrors.municipality && styles.errorBorder]}
                  disabled={!provinceId}
                  onPress={() => {
                    setShowMunicipalities(!showMunicipalities);
                    setShowProvinces(false);
                    setShowLocalities(false);
                  }}
                >
                  <Text
                    style={[styles.dropdownText, (!provinceId) && { opacity: 0.5 }]}
                  >
                    {userData.address.municipality || "Seleccione municipio"}
                  </Text>
                </TouchableOpacity>
                {showMunicipalities && (
                  <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" style={[styles.dropdownContainer, { maxHeight: 180 }]}>
                    {municipalities.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectMunicipality(m.id, m.nombre)}
                      >
                        <Text style={styles.dropdownItemText}>{m.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={styles.rowNoLabel}>
                <Text style={[styles.valueText, { flex: 1 }]}>
                  {userData.address.municipality || "–"}
                </Text>
                <TouchableOpacity
                  onPress={() => toggle("address.municipality")}
                  style={styles.icon}
                >
                  <MaterialIcons
                    name="edit"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Localidad */}
        <Text style={styles.addressSubtitle}>Localidad</Text>
        {editMode["address.locality"] ? (
          <>
            <TouchableOpacity
              style={[styles.dropdownButton, (!municipalityId && provinceId !== '02') && { opacity: 0.5 }]}
              disabled={!municipalityId && provinceId !== '02'}
              onPress={() => {
                setShowLocalities(!showLocalities);
                setShowProvinces(false);
                setShowMunicipalities(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  (!municipalityId && provinceId !== '02') && { opacity: 0.5 },
                ]}
              >
                {userData.address.locality || "Seleccione localidad"}
              </Text>
            </TouchableOpacity>
            {showLocalities && (
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" style={[styles.dropdownContainer, { maxHeight: 180 }]}>
                {localities.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectLocality(l.id, l.nombre)}
                  >
                    <Text style={styles.dropdownItemText}>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <View style={styles.rowNoLabel}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.locality || "–"}
            </Text>
            <TouchableOpacity
              onPress={() => toggle("address.locality")}
              style={styles.icon}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Dirección */}
        <Text style={styles.addressSubtitle}>Dirección</Text>
        {editMode["address.street"] ? (
          <TextInput
            style={[styles.inputFull, addressErrors.street && styles.errorBorder]}
            placeholder="Ej: Av. Rivadavia 1234 5°B"
            value={userData.address.street}
            onChangeText={(v) => onAddressChange("street", v)}
          />
        ) : (
          <View style={styles.rowNoLabel}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.street?.trim() || "–"}
            </Text>
            <TouchableOpacity
              onPress={() => toggle("address.street")}
              style={styles.icon}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

  </View>

  {/* Acciones (vertical) */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={[styles.fullButton, styles.fullButtonPrimary]}
            onPress={handleConfirm}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="check" size={18} color={COLORS.cardBg} />
              <Text style={styles.fullButtonPrimaryText}>Confirmar cambios</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fullButton, styles.fullButtonSecondary]}
            onPress={async () => {
              await logout();
              nav.replace(router, ROUTES.LOGIN.LOGIN);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="logout" size={18} color={COLORS.primary} />
              <Text style={styles.fullButtonSecondaryText}>Cerrar sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Eliminar cuenta (link) */}
        <TouchableOpacity onPress={openDeleteModal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MaterialIcons name="delete-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.deleteLink}>Eliminar cuenta</Text>
        </TouchableOpacity>
        {/* Hacer administrador (assign role 1) */}
        <TouchableOpacity onPress={async () => {
          if (!apiUser) return;
          Alert.alert(
            "Confirmar",
            "¿Querés otorgar permiso de administrador a este usuario?",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Confirmar", onPress: async () => {
                try {
                  const newRoles = Array.isArray(apiUser.cdRoles) ? [...apiUser.cdRoles] : [];
                  if (!newRoles.includes(1)) newRoles.push(1);
                  const adminPayload = {
                    idUsuario: apiUser.idUsuario,
                    nombre: apiUser.nombre || userData.firstName || "",
                    apellido: apiUser.apellido || userData.lastName || "",
                    correo: apiUser.correo || userData.email || "",
                    dni: apiUser.dni || userData.dni || "",
                    telefono: apiUser.telefono || userData.phone || "",
                    cbu: apiUser.cbu || "",
                    nombreFantasia: apiUser.nombreFantasia || "",
                    bio: apiUser.bio || "",
                    dtNacimiento: apiUser.dtNacimiento || null,
                    domicilio: apiUser.domicilio || {},
                    cdRoles: newRoles,
                    socials: {
                      idSocial: apiUser.socials?.idSocial ?? "",
                      mdInstagram: apiUser.socials?.mdInstagram ?? "",
                      mdSpotify: apiUser.socials?.mdSpotify ?? "",
                      mdSoundcloud: apiUser.socials?.mdSoundcloud ?? "",
                    }
                  };
                  await updateUsuario(adminPayload);
                  Alert.alert("Listo", "El usuario ahora tiene rol de administrador.");
                  // refrescar perfil
                  if (user) {
                    const updatedProfile = await getProfile(user.username);
                    setApiUser(updatedProfile);
                  }
                } catch (e: any) {
                  console.error("Error asignando admin:", e);
                  Alert.alert("Error", e?.response?.data?.title || "No se pudo asignar rol de administrador.");
                }
              } }
            ]
          );
        }}>
          <Text style={[styles.deleteLink, { textDecorationLine: 'none' }]}>Hacer administrador</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===== MODAL CAMBIO DE CONTRASEÑA ===== */}
      <Modal
        transparent
        animationType="fade"
        visible={showPwdModal}
        onRequestClose={() => setShowPwdModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>

            <Text style={styles.modalLabel}>Contraseña actual</Text>
            <TextInput
              style={styles.inputFull}
              value={pwdCurrent}
              onChangeText={setPwdCurrent}
              secureTextEntry
              placeholder="••••••"
              blurOnSubmit={false}
              autoCorrect={false}
              selectionColor={COLORS.primary}
              returnKeyType="done"
            />

            <Text style={styles.modalLabel}>Nueva contraseña</Text>
            <TextInput
              style={styles.inputFull}
              value={pwdNew}
              onChangeText={setPwdNew}
              secureTextEntry
              placeholder="Mín. 6 caracteres"
              blurOnSubmit={false}
              autoCorrect={false}
              selectionColor={COLORS.primary}
              returnKeyType="done"
            />

            <Text style={styles.modalLabel}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.inputFull}
              value={pwdConfirm}
              onChangeText={setPwdConfirm}
              secureTextEntry
              placeholder="Repetir contraseña"
              blurOnSubmit={false}
              autoCorrect={false}
              selectionColor={COLORS.primary}
              returnKeyType="done"
            />

            {pwdError ? (
              <Text style={styles.modalError}>{pwdError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                disabled={pwdLoading}
                onPress={() => setShowPwdModal(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                disabled={pwdLoading}
                onPress={handleConfirmPasswordChange}
              >
                <Text style={styles.modalBtnText}>
                  {pwdLoading ? "Guardando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL ELIMINAR CUENTA ===== */}
      <Modal
        transparent
        animationType="fade"
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.deleteTitle}>¿Estás seguro?</Text>
            <Text style={styles.deleteText}>
              Esta acción eliminará tu cuenta permanentemente.
            </Text>
            <Text style={styles.deleteWarning}>No se puede revertir.</Text>

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteBtn, styles.deleteConfirm]}
                disabled={deleteLoading}
                onPress={handleConfirmDeleteAccount}
              >
                <Text style={styles.deleteConfirmText}>
                  {deleteLoading ? "Eliminando..." : "Confirmo eliminar cuenta"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteBtn, styles.deleteCancel]}
                disabled={deleteLoading}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scroll: { padding: 16, alignItems: "center" },

  mainTitle: {
    fontSize: FONT_SIZES.titleMain,
    fontFamily: FONTS.titleBold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  photoContainer: { position: "relative", marginBottom: 8 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  photoEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  photoActionsRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 6,
    gap: 10,
  },
  photoActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
  },
  acceptBtn: { backgroundColor: "#2ecc71" },
  cancelBtn: { backgroundColor: "#b0b0b0" },
  photoActionText: { color: "#fff", fontFamily: FONTS.subTitleMedium },

  smallNote: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  profileName: {
    fontSize: FONT_SIZES.subTitle,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },

  rowNoLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 12,
  },
  valueText: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  icon: { padding: 4 },

  inputFull: {
    width: "90%",
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    height: 56,
    paddingHorizontal: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    color: "#111827",
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 2,
  },

  errorBorder: {
    borderColor: COLORS.negative,
    borderWidth: 1.5,
  },

  // resetContainer/resetText defined later not needed here

  divider: {
    width: "90%",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
    marginVertical: 16,
  },
  sectionCard: {
    width: "90%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 12,
    marginBottom: 16,
  },
  sectionCardTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'left',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    width: "90%",
    fontSize: FONT_SIZES.subTitle,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "left",
  },
  addressSubtitle: {
    width: "90%",
    fontSize: FONT_SIZES.body + 2,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 4,
  },

  dropdownButton: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "#d1d5db",
    borderWidth: 1,
    minHeight: 48,
    padding: 12,
    marginBottom: 4,
    justifyContent: 'center',
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Elevation para Android
    elevation: 1,
  },
  dropdownText: { 
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 8,
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
  },

  // Estilos para selectores de fecha
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
    width: "90%",
  },
  selectorContainer: {
    flex: 1,
  },
  dateSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#d1d5db',
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    // Shadow para iOS
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Elevation para Android
    elevation: 1,
  },
  resetContainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    marginTop: 12,
  },
  resetTextCard: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    marginLeft: 6,
  },
  
  dateSelectorText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  menuContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    // Shadow para iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Elevation para Android
    elevation: 4,
  },
  menuScrollView: {
    maxHeight: 180,
  },
  menuItemTitle: {
    fontSize: 14,
    color: "#374151",
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  button: {
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  confirm: { backgroundColor: COLORS.primary },
  logout: { backgroundColor: COLORS.secondary },
  buttonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
    textAlign: "center",
  },
  actionsColumn: {
    width: '90%',
    marginTop: 8,
  },
  fullButton: {
    width: '100%',
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fullButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  fullButtonSecondary: {
    backgroundColor: '#E9E5FF',
  },
  fullButtonPrimaryText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  fullButtonSecondaryText: {
    color: COLORS.primary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },

  deleteLink: {
    marginTop: 16,
    marginBottom: 24,
    color: COLORS.negative,
    textDecorationLine: "underline",
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
  },

  // MODALES
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
  },

  modalTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.textPrimary,
  },
  modalError: { color: COLORS.negative, marginTop: 8, textAlign: "center" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#b0b0b0", marginRight: 8 },
  modalConfirm: { backgroundColor: COLORS.primary, marginLeft: 8 },
  modalBtnText: { color: COLORS.cardBg, fontFamily: FONTS.subTitleMedium },

  // Modal eliminar cuenta
  deleteTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.negative,
    textAlign: "center",
    marginBottom: 6,
  },
  deleteText: {
    textAlign: "center",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  deleteWarning: {
    textAlign: "center",
    color: COLORS.negative,
    fontFamily: FONTS.subTitleMedium,
    marginBottom: 12,
  },
  deleteActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  deleteConfirm: { backgroundColor: COLORS.negative, marginRight: 8 },
  deleteCancel: { backgroundColor: "#E9E5FF", marginLeft: 8 },
  deleteConfirmText: { color: "#fff", fontFamily: FONTS.subTitleMedium },
  deleteCancelText: { color: COLORS.primary, fontFamily: FONTS.subTitleMedium },
});
