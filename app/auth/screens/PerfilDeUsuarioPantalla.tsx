// Simplified JR-style user profile screen
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SelectField from "@/components/common/selectField";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import useUpdateUserProfile from "@/app/auth/services/user/useUpdateUserProfile";
import { mediaApi } from "@/app/apis/mediaApi";
import { apiClient } from "@/app/apis/apiClient";
import useDeleteAccountProfile from "@/app/auth/services/user/useDeleteAccountProfile";
import useVerifyEmail from "@/app/auth/services/user/useVerifyEmail";
import ProfileUserPopupUpdateOk from "@/app/auth/components/user/profile-user/ProfileUserPopupUpdateOk";
import { fetchProvinces, fetchMunicipalities, fetchLocalitiesByProvince, fetchLocalities } from "@/app/apis/georefApi";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { formatDateForUI } from "@/utils/formatDate";

// ==================================================
// Main (código en inglés, textos UI en español, comentarios en español)
// ==================================================

export default function UserProfileScreen() {
  // usar auth para logout y username
  const { user, logout } = useAuth();
  const router = useRouter();

  // estados simples
  const [profile, setProfile] = useState<any>(null); // data from API
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<any>({
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

  const [isEditing, setIsEditing] = useState(false);

  // editar domicilio por separado
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // image states
  const [photo, setPhoto] = useState<string | null>(null);

  // simple georef lists
  const [provinces, setProvinces] = useState<any[]>([]);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [showLocalityPicker, setShowLocalityPicker] = useState(false);
  const [provinceId, setProvinceId] = useState<string>("");
  const [municipalityId, setMunicipalityId] = useState<string>("");
  const [localityId, setLocalityId] = useState<string>("");
  const [isCABA, setIsCABA] = useState<boolean>(false);

  // Fallback de provincias en caso de que la API falle o devuelva vacío
  const FALLBACK_PROVINCES = [
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

  // modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { sending: sendingVerify, sendVerifyEmail } = useVerifyEmail();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { updating: updatingProfile, updateUserProfile } = useUpdateUserProfile();
  const { deleting: deletingAccount, deleteAccount } = useDeleteAccountProfile();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showChangeResultModal, setShowChangeResultModal] = useState(false);
  const [changeResultMsg, setChangeResultMsg] = useState<string | null>(null);
  // toggles visibility for password inputs
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  // load profile on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const username = user.username;
      try {
        setLoading(true);
        const u = await getProfile(username);
        if (!mounted) return;
        setProfile(u);
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

        // image
        try {
          const media = await mediaApi.getByEntidad(u.idUsuario);
          const m = media?.media?.[0];
          let finalUrl = m?.url ?? m?.imagen ?? "";
          if (finalUrl && m?.imagen && !/^https?:\/\//.test(finalUrl)) {
            finalUrl = `${apiClient.defaults.baseURL}${
              finalUrl.startsWith("/") ? "" : "/"
            }${finalUrl}`;
          }
          setPhoto(finalUrl || null);
        } catch {
          setPhoto(null);
        }

        // load provinces simple
        try {
          const provs = await fetchProvinces();
          setProvinces(provs || []);

          // try to resolve province id from profile (codigo) or by matching name
          const profileProvCode = u.domicilio?.provincia?.codigo;
          const profileProvName = u.domicilio?.provincia?.nombre;
          const pid = profileProvCode || (provs || []).find((p: any) => String(p?.nombre || "").toLowerCase() === String(profileProvName || "").toLowerCase())?.id;
          if (pid) {
            const spid = String(pid);
            setProvinceId(spid);

            const provName = (provs || []).find((p: any) => String(p?.id) === String(spid))?.nombre || profileProvName || "";
            const caba = String(provName).toLowerCase().includes('buenos') && String(provName).toLowerCase().includes('aires') && String(provName).toLowerCase().includes('ciudad');
            setIsCABA(caba);

            try {
              const mun = await fetchMunicipalities(spid);
              setMunicipalities(mun || []);
            } catch (e) {
              setMunicipalities([]);
            }

            try {
              const locs = await fetchLocalitiesByProvince(spid);
              setLocalities(locs || []);
            } catch (e) {
              setLocalities([]);
            }
          }
        } catch {}
      } catch (e) {
        console.warn("load profile error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  // helpers para actualizar form
  function setField(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  // Estado para el popup
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupOnClose, setPopupOnClose] = useState<null | (() => void)>(null);

  // Muestra el popup con título, mensaje y acción opcional al cerrar
  const showPopup = (title: string, message: string, onClose?: () => void) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupOnClose(() => onClose || null);
    setPopupVisible(true);
  };

  // select image (simple, con tamaño check)
  async function pickImage() {
    try {
      const res: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const info: any = await FileSystem.getInfoAsync(asset.uri);
      if (info?.size && info.size > 2 * 1024 * 1024) {
        showPopup(
          "Imagen demasiado grande",
          "La imagen seleccionada supera el máximo permitido (2MB). Por favor, elige una imagen más liviana."
        );
        return;
      }
      setPhoto(asset.uri);
    } catch (e) {
      showPopup("Error", "No se pudo seleccionar la imagen.");
    }
  }

  // save profile simple
  async function handleSave() {
    if (!profile) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showPopup("Error", "El nombre y apellido son obligatorios.");
      return;
    }
    if (!form.email.trim() || !form.dni.trim()) {
      showPopup("Error", "El correo y DNI son obligatorios.");
      return;
    }

    try {
      // build payload including required/expected fields by backend
      const payload: any = {
        idUsuario: profile.idUsuario,
        nombre: form.firstName.trim(),
        apellido: form.lastName.trim(),
        correo: form.email.trim(),
        dni: form.dni.trim(),
        telefono: form.phone?.trim() || "",
        cbu: form.cbu?.trim() || "",
        // dtNacimiento expected as ISO
        dtNacimiento: form.birthdate
          ? new Date(form.birthdate + "T00:00:00Z").toISOString()
          : profile.dtNacimiento,
        // fallback fields backend expects
        nombreFantasia: profile?.nombreFantasia || "",
        bio: profile?.bio || "",
        // cdRoles is required by the API (array of numbers)
        cdRoles: Array.isArray(profile?.cdRoles) && profile.cdRoles.length ? profile.cdRoles : [0],
        // isVerificado: API sometimes expects number; normalize to 0/1
        isVerificado: typeof profile?.isVerificado === 'number' ? profile.isVerificado : (profile?.isVerificado ? 1 : 0),
        domicilio: {
          provincia: {
            nombre: form.addressProvince || "",
            codigo: provinceId || profile.domicilio?.provincia?.codigo || "",
          },
          municipio: {
            nombre: (municipalities.find((m: any) => String(m.id) === String(municipalityId))?.nombre) || profile.domicilio?.municipio?.nombre || "",
            codigo: municipalityId || profile.domicilio?.municipio?.codigo || "",
          },
          localidad: {
            nombre: form.addressLocality || profile.domicilio?.localidad?.nombre || "",
            codigo: localityId || profile.domicilio?.localidad?.codigo || "",
          },
          direccion: form.addressStreet || profile.domicilio?.direccion || "",
          latitud: typeof profile?.domicilio?.latitud === 'number' ? profile.domicilio.latitud : 0,
          longitud: typeof profile?.domicilio?.longitud === 'number' ? profile.domicilio.longitud : 0,
        },
        socials: {
          idSocial: profile?.socials?.idSocial || "",
          mdInstagram: profile?.socials?.mdInstagram || "",
          mdSpotify: profile?.socials?.mdSpotify || "",
          mdSoundcloud: profile?.socials?.mdSoundcloud || "",
        },
      };

      const updated = await updateUserProfile(payload);
      // mostrar popup de éxito en lugar de alert
      setProfile(updated);
      setIsEditing(false);
      setShowUpdateModal(true);
    } catch (err: any) {
      console.error(err);
      showPopup(
        "Error",
        err?.response?.data?.title || "Hubo un problema actualizando tus datos."
      );
    }
  }

  // send verification email
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

  // delete account
  async function handleDelete() {
    if (!profile?.idUsuario) return;
    try {
      await deleteAccount();
      // deleteAccount handles logout & redirect
    } catch (e: any) {
      showPopup("Error", e?.response?.data?.title || e?.message || "No pudimos eliminar tu cuenta.");
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Mi Perfil</Text>

        <View style={styles.photoRow}>
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: photo || undefined }} style={styles.avatar} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <MaterialIcons name="edit" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Tus datos</Text>
            <TouchableOpacity onPress={() => setIsEditing((v) => !v)}>
              <MaterialIcons name={isEditing ? "check" : "edit"} size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
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

          <Text style={styles.label}>Fecha de nacimiento</Text>
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

        {/* Botón: Cambiar contraseña abre modal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seguridad</Text>
          <Text style={[styles.label, { marginTop: 8, fontWeight: '400' }]}>Administrá el acceso a tu cuenta.</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { marginTop: 12 }]}
            onPress={() => setShowChangeModal(true)}
          >
            <Text style={styles.saveText}>Cambiar contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Modal: Cambiar contraseña (diseño actualizado) */}
        <Modal visible={showChangeModal} transparent animationType="fade" onRequestClose={() => setShowChangeModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCardCompact}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar contraseña</Text>
                <TouchableOpacity onPress={() => setShowChangeModal(false)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalMsg, { marginBottom: 12 }]}>Ingresá tu contraseña actual y la nueva contraseña.</Text>

              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={(t) => { setCurrentPassword(t); setCurrentPasswordError(null); }}
                  placeholder="Contraseña actual"
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword((v) => !v)} style={styles.eyeBtn}>
                  <MaterialIcons name={showCurrentPassword ? 'visibility' : 'visibility-off'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {currentPasswordError ? (
                <Text style={styles.inputError}>{currentPasswordError}</Text>
              ) : null}

              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nueva contraseña"
                />
                <TouchableOpacity onPress={() => setShowNewPassword((v) => !v)} style={styles.eyeBtn}>
                  <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repetir nueva contraseña"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
                  <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowChangeModal(false)} disabled={changingPassword}>
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, changingPassword && { opacity: 0.7 }]}
                  onPress={async () => {
                    if (!currentPassword) { Alert.alert('Error', 'Ingresá tu contraseña actual.'); return; }
                    if (!newPassword || newPassword.length < 8) { Alert.alert('Error', 'La nueva contraseña debe tener al menos 8 caracteres.'); return; }
                    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Las contraseñas no coinciden.'); return; }
                    try {
                      setChangingPassword(true);
                      setCurrentPasswordError(null);
                      // API: PUT /v1/Usuario/ResetPass?Correo={correo}&Pass={old}&NewPass={new}
                      await apiClient.put(
                        "/v1/Usuario/ResetPass",
                        null,
                        {
                          params: {
                            Correo: form.email || profile?.correo,
                            Pass: currentPassword,
                            NewPass: newPassword,
                          },
                        }
                      );
                      setChangeResultMsg('Contraseña actualizada correctamente.');
                      setShowChangeResultModal(true);
                      setShowChangeModal(false);
                      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                    } catch (e: any) {
                      // Evitar mostrar el redbox/overlay en desarrollo.
                      // Logueamos en console.log para debugging sin abrir el red error overlay.
                      console.log('change password error', e?.message || e);
                      const status = e?.response?.status;
                      const data = e?.response?.data;
                      const text = String((data?.title || data?.message || '')).toLowerCase();
                      const looksLikeBadCurrent = /contraseñ|password|pass|actual/.test(text);
                      // Si el backend devuelve 401 o 403 tratamos como contraseña original incorrecta
                      if (status === 401 || status === 403 || looksLikeBadCurrent) {
                        // Mostrar popup claro al usuario
                        setChangeResultMsg('La contraseña original no es correcta.');
                        setShowChangeResultModal(true);
                        setShowChangeModal(false);
                      } else {
                        const msg = data?.title || data?.message || e?.message || 'No se pudo actualizar la contraseña.';
                        setChangeResultMsg(msg);
                        setShowChangeResultModal(true);
                        setShowChangeModal(false);
                      }
                    } finally {
                      setChangingPassword(false);
                    }
                  }}
                  disabled={changingPassword}
                >
                  <Text style={{ color: '#fff' }}>{changingPassword ? 'Procesando...' : 'Confirmar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Tu domicilio</Text>
            <TouchableOpacity onPress={() => setIsEditingAddress((v) => !v)}>
              <MaterialIcons name={isEditingAddress ? "check" : "edit"} size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
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

          {showProvincePicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={{ paddingVertical: 4 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {(provinces && provinces.length
                  ? provinces.map((p: any) => ({ id: String(p?.id ?? p), nombre: p?.nombre ?? String(p) }))
                  : FALLBACK_PROVINCES.map((n, i) => ({ id: String(i), nombre: n })))
                  .map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={async () => {
                        // actualizar province en el form y estado de selección en cascada
                        setField("addressProvince", item.nombre);
                        const pid = String(item.id);
                        setProvinceId(pid);
                        // detectar CABA por nombre
                        const isCabaSelected = String(item.nombre || "")
                          .toLowerCase()
                          .includes("ciudad") &&
                          String(item.nombre || "").toLowerCase().includes("buenos") &&
                          String(item.nombre || "").toLowerCase().includes("aires");
                        setIsCABA(isCabaSelected);
                        // reset dependientes
                        setMunicipalityId("");
                        setLocalityId("");
                        setMunicipalities([]);
                        setLocalities([]);
                        setField("addressLocality", "");
                        setShowProvincePicker(false);

                        // Si es CABA, auto-completar localidad y municipio con el mismo texto
                        if (isCabaSelected) {
                          const cabaText = "Ciudad Autónoma de Buenos Aires";
                          setMunicipalityId(pid);
                          setLocalityId(pid);
                          setField("addressLocality", cabaText);
                          // también podemos dejar municipalidades/listas vacías o con el propio valor
                        }

                        // traer municipios para la provincia seleccionada
                        try {
                          const mun = await fetchMunicipalities(pid);
                          setMunicipalities(mun || []);
                        } catch (e) {
                          setMunicipalities([]);
                        }

                        // intentar traer localidades por provincia (casos como CABA)
                        try {
                          const locs = await fetchLocalitiesByProvince(pid);
                          setLocalities(locs || []);
                        } catch (e) {
                          // ignore
                        }
                      }}
                    >
                      <Text>{item.nombre}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* Municipio */}
          <SelectField
            label="Municipio"
            value={isCABA ? (form.addressProvince || 'Ciudad Autónoma de Buenos Aires') : (municipalityId ? (municipalities.find((m: any) => String(m.id) === municipalityId)?.nombre || '') : '')}
            placeholder={isCABA ? 'Ciudad Autónoma de Buenos Aires' : 'Seleccione un municipio'}
            onPress={() => {
              if (!isEditingAddress) return;
              if (isCABA) return; // no abrir para CABA
              setShowMunicipalityPicker((v) => !v);
              setShowProvincePicker(false);
              setShowLocalityPicker(false);
            }}
            disabled={!isEditingAddress || !provinceId || isCABA || municipalities.length === 0}
            isOpen={showMunicipalityPicker}
          />

          {showMunicipalityPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.menuScrollView} contentContainerStyle={{ paddingVertical: 4 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {municipalities.map((m: any) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.dropdownItem}
                    onPress={async () => {
                      const mid = String(m.id);
                      setMunicipalityId(mid);
                      // limpiar/localidad dependiente
                      setLocalityId("");
                      setField('addressLocality', '');
                      setLocalities([]);
                      setShowMunicipalityPicker(false);
                      setShowLocalityPicker(false);
                      // load localities for this municipality
                      try {
                        const locs = await fetchLocalities(String(provinceId), mid);
                        setLocalities(locs || []);
                      } catch (e) {
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

          {/* Localidad */}
          <SelectField
            label="Localidad"
            value={form.addressLocality}
            placeholder="Seleccione una localidad"
            onPress={() => {
              if (!isEditingAddress) return;
              if (isCABA) return; // mantener localidad grisada para CABA
              setShowLocalityPicker((v) => !v);
              setShowProvincePicker(false);
              setShowMunicipalityPicker(false);
            }}
            disabled={!isEditingAddress || isCABA || !provinceId || (!municipalityId && !localities.length)}
            isOpen={showLocalityPicker}
          />

          {showLocalityPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.menuScrollView} contentContainerStyle={{ paddingVertical: 4 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {localities.map((l: any) => (
                  <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => {
                    setLocalityId(String(l.id));
                    setField('addressLocality', String(l.nombre));
                    setShowLocalityPicker(false);
                  }}>
                    <Text>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, !isEditingAddress && styles.inputDisabled]}
            editable={isEditingAddress}
            value={form.addressStreet}
            onChangeText={(t) => setField("addressStreet", t)}
            placeholder="Dirección"
          />
        </View>

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

        {/* verify modal simple */}
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

        {/* change password result modal */}
        <Modal visible={showChangeResultModal} transparent animationType="fade" onRequestClose={() => setShowChangeResultModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Cambio de contraseña</Text>
              <Text style={styles.modalMsg}>{changeResultMsg || ''}</Text>
              <TouchableOpacity style={styles.modalOk} onPress={() => setShowChangeResultModal(false)}>
                <Text style={styles.modalOkText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* delete modal */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Estás seguro?</Text>
              <Text style={styles.modalMsg}>
                Esta acción eliminará tu cuenta permanentemente.
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#b0b0b0" }]}
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
                    {deletingAccount ? "Eliminando..." : "Confirmo eliminar cuenta"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* update success popup */}
        <ProfileUserPopupUpdateOk
          visible={showUpdateModal}
          userName={`${form.firstName} ${form.lastName}`.trim()}
          loading={!!updatingProfile}
          onClose={() => setShowUpdateModal(false)}
        />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

// ==================================================
// Styles (simple, human-friendly)
// ==================================================
const styles = StyleSheet.create({
    // estilos para el popup
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
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: FONT_SIZES.titleMain,
    fontFamily: FONTS.titleBold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
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
  modalCardCompact: {
    width: 360,
    maxWidth: "95%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 18,
    alignItems: "stretch",
  },
  modalHeader: { width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center" },
  closeBtn: { position: "absolute", right: 8, top: 6, padding: 6 },
  inputWithIcon: { width: "100%", flexDirection: "row", alignItems: "center", marginTop: 8 },
  eyeBtn: { padding: 8 },
  modalActions: { width: "100%", flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  cancelBtn: { flex: 1, backgroundColor: "#f3f4f6", padding: 12, borderRadius: 8, alignItems: "center", marginRight: 8 },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: "center" },
  inputError: { color: "#ef4444", marginTop: 6, alignSelf: "flex-start" },
  provinceModalCard: {
    width: 360,
    maxWidth: "95%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    alignItems: "stretch",
  },
  provinceItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
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
    alignSelf: 'center',
    overflow: 'hidden',
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
