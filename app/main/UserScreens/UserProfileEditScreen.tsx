// src/screens/UserProfileEditScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateUsuario } from "@/utils/auth/userHelpers";
import { mediaApi } from "@/utils/mediaApi";
import { apiClient } from "@/utils/apiConfig";

// Georef
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";

export default function UserProfileEditScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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

  // Selecciones actuales (IDs)
  const [provinceId, setProvinceId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [localityId, setLocalityId] = useState("");

  // Foto fallback
  const randomProfileImage = useMemo(
    () => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/100`,
    []
  );

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

        // 2) Foto + idMedia
        const mediaData: any = await mediaApi.getByEntidad(u.idUsuario);
        const m = mediaData.media?.[0];
        let img = m?.url ?? m?.imagen ?? "";
        if (img && m?.imagen && !/^https?:\/\//.test(img)) {
          img = `${apiClient.defaults.baseURL}${
            img.startsWith("/") ? "" : "/"
          }${img}`;
        }
        setProfileImage(img || randomProfileImage);
        setProfileMediaId(m?.idMedia ?? null);

        // 3) Georef
        const provs = await fetchProvinces();
        setProvinces(provs);
        const foundProv = provs.find(
          (p) => p.nombre === u.domicilio?.provincia?.nombre
        );
        if (foundProv) {
          setProvinceId(foundProv.id);
          const muns = await fetchMunicipalities(foundProv.id);
          setMunicipalities(muns);
          const foundMun = muns.find(
            (m) => m.nombre === u.domicilio?.municipio?.nombre
          );
          if (foundMun) {
            setMunicipalityId(foundMun.id);
            const locs = await fetchLocalities(foundProv.id, foundMun.id);
            setLocalities(locs);
            const foundLoc = locs.find(
              (l) => l.nombre === u.domicilio?.localidad?.nombre
            );
            if (foundLoc) setLocalityId(foundLoc.id);
          }
        }
      } catch (err) {
        console.warn("[UserProfileEdit] error:", err);
        setProfileImage(randomProfileImage);
        Alert.alert("Error", "No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Helpers
  const onChange = (field: string, value: string) =>
    setUserData((d) => ({ ...d, [field]: value }));
  const onAddressChange = (field: string, value: string) =>
    setUserData((d) => ({ ...d, address: { ...d.address, [field]: value } }));
  const toggle = (key: string) =>
    setEditMode((m) => ({ ...m, [key]: !m[key] }));

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
    try {
      setMunicipalities(await fetchMunicipalities(id));
    } catch {}
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (fileInfo.size && fileInfo.size > 2 * 1024 * 1024) {
        return Alert.alert("Imagen muy pesada", "Máximo permitido: 2MB.");
      }
      setPreviousProfileImage(profileImage);
      setPendingPhotoUri(asset.uri);
      setProfileImage(asset.uri);
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
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
      await mediaApi.upload(apiUser.idUsuario, file);

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
    const payload = {
      idUsuario: apiUser.idUsuario,
      nombre: userData.firstName,
      apellido: userData.lastName,
      correo: userData.email,
      dni: userData.dni,
      telefono: userData.phone,
      dtNacimiento: userData.birthdate,
      domicilio: {
        provincia: apiUser.domicilio?.provincia,
        municipio: apiUser.domicilio?.municipio,
        localidad: apiUser.domicilio?.localidad,
        direccion: userData.address.street?.trim() || "",
        latitud: apiUser.domicilio?.latitud,
        longitud: apiUser.domicilio?.longitud,
      },
    };
    try {
      await updateUsuario(payload);
      Alert.alert("Éxito", "Perfil actualizado.");
      setEditMode(
        Object.fromEntries(Object.keys(editMode).map((k) => [k, false]))
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.title || "Hubo un problema actualizando tus datos."
      );
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
      router.replace("/auth/LoginScreen");
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

  // Render auxiliar
  const RenderEditableField = ({
    label,
    value,
    modeKey,
    keyboardType,
    onChangeText,
  }: {
    label: string;
    value: string;
    modeKey: keyof typeof editMode | string;
    keyboardType?:
      | "default"
      | "email-address"
      | "numeric"
      | "phone-pad"
      | "number-pad";
    onChangeText: (t: string) => void;
  }) => {
    const isEditing = !!editMode[modeKey as string];
    return (
      <>
        <Text style={styles.addressSubtitle}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.inputFull}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={label}
          />
        ) : (
          <View style={styles.rowNoLabel}>
            <Text style={[styles.valueText, { flex: 1 }]}>{value || "–"}</Text>
            <TouchableOpacity
              onPress={() => toggle(modeKey as string)}
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
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

        <Text style={styles.smallNote}>
          Formatos permitidos: JPG, JPEG o PNG. Máx. 2MB.
        </Text>

        {/* Mi perfil */}
        <RenderEditableField
          label="Nombre"
          value={userData.firstName}
          modeKey="firstName"
          onChangeText={(t) => onChange("firstName", t)}
        />
        <RenderEditableField
          label="Apellido"
          value={userData.lastName}
          modeKey="lastName"
          onChangeText={(t) => onChange("lastName", t)}
        />
        <RenderEditableField
          label="DNI"
          value={userData.dni}
          modeKey="dni"
          keyboardType="numeric"
          onChangeText={(t) => onChange("dni", t)}
        />
        <RenderEditableField
          label="Teléfono"
          value={userData.phone}
          modeKey="phone"
          keyboardType="phone-pad"
          onChangeText={(t) => onChange("phone", t)}
        />
        <RenderEditableField
          label="Correo"
          value={userData.email}
          modeKey="email"
          keyboardType="email-address"
          onChangeText={(t) => onChange("email", t)}
        />
        <RenderEditableField
          label="Fecha de nacimiento"
          value={userData.birthdate}
          modeKey="birthdate"
          onChangeText={(t) => onChange("birthdate", t)}
        />

        {/* Cambiar contraseña */}
        <TouchableOpacity style={styles.resetContainer} onPress={openPwdModal}>
          <MaterialIcons name="lock-reset" size={20} color={COLORS.cardBg} />
          <Text style={styles.resetText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        {/* Domicilio */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Tu domicilio</Text>

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
              <View style={styles.dropdownContainer}>
                {provinces.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectProvince(p.id, p.nombre)}
                  >
                    <Text>{p.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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

        {/* Municipio */}
        <Text style={styles.addressSubtitle}>Municipio</Text>
        {editMode["address.municipality"] ? (
          <>
            <TouchableOpacity
              style={styles.dropdownButton}
              disabled={!provinceId}
              onPress={() => {
                setShowMunicipalities(!showMunicipalities);
                setShowProvinces(false);
                setShowLocalities(false);
              }}
            >
              <Text
                style={[styles.dropdownText, !provinceId && { opacity: 0.5 }]}
              >
                {userData.address.municipality || "Seleccione municipio"}
              </Text>
            </TouchableOpacity>
            {showMunicipalities && (
              <View style={styles.dropdownContainer}>
                {municipalities.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectMunicipality(m.id, m.nombre)}
                  >
                    <Text>{m.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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

        {/* Localidad */}
        <Text style={styles.addressSubtitle}>Localidad</Text>
        {editMode["address.locality"] ? (
          <>
            <TouchableOpacity
              style={styles.dropdownButton}
              disabled={!municipalityId}
              onPress={() => {
                setShowLocalities(!showLocalities);
                setShowProvinces(false);
                setShowMunicipalities(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !municipalityId && { opacity: 0.5 },
                ]}
              >
                {userData.address.locality || "Seleccione localidad"}
              </Text>
            </TouchableOpacity>
            {showLocalities && (
              <View style={styles.dropdownContainer}>
                {localities.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectLocality(l.id, l.nombre)}
                  >
                    <Text>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
            style={styles.inputFull}
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

        {/* Acciones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.confirm]}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirmar cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.logout]}
            onPress={logout}
          >
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Eliminar cuenta (link) */}
        <TouchableOpacity onPress={openDeleteModal}>
          <Text style={styles.deleteLink}>Eliminar cuenta</Text>
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
              style={styles.modalInput}
              value={pwdCurrent}
              onChangeText={setPwdCurrent}
              secureTextEntry
              placeholder="••••••"
            />

            <Text style={styles.modalLabel}>Nueva contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={pwdNew}
              onChangeText={setPwdNew}
              secureTextEntry
              placeholder="Mín. 6 caracteres"
            />

            <Text style={styles.modalLabel}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={pwdConfirm}
              onChangeText={setPwdConfirm}
              secureTextEntry
              placeholder="Repetir contraseña"
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
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    color: COLORS.textPrimary,
  },

  resetContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
    marginVertical: 16,
  },
  resetText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    marginLeft: 6,
  },

  divider: {
    width: "90%",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
    marginVertical: 16,
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
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
    marginBottom: 4,
  },
  dropdownText: { color: COLORS.textPrimary },
  dropdownContainer: {
    width: "90%",
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
