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
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import useUpdateUserProfile from "@/app/auth/services/user/useUpdateUserProfile";
import { mediaApi } from "@/app/apis/mediaApi";
import { apiClient } from "@/app/apis/apiConfig";
import useDeleteAccountProfile from "@/app/auth/services/user/useDeleteAccountProfile";
import useVerifyEmail from "@/app/auth/services/user/useVerifyEmail";
import ProfileUserPopupUpdateOk from "@/app/auth/components/user/profile-user/ProfileUserPopupUpdateOk";
import { fetchProvinces } from "@/app/apis/georefHelpers";
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

  // image states
  const [photo, setPhoto] = useState<string | null>(null);

  // simple georef lists
  const [provinces, setProvinces] = useState<any[]>([]);

  // modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { sending: sendingVerify, sendVerifyEmail } = useVerifyEmail();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { updating: updatingProfile, updateUserProfile } = useUpdateUserProfile();
  const { deleting: deletingAccount, deleteAccount } = useDeleteAccountProfile();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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
        Alert.alert(
          "Imagen demasiado grande",
          "La imagen seleccionada supera el máximo permitido (2MB). Por favor, elige una imagen más liviana."
        );
        return;
      }
      setPhoto(asset.uri);
    } catch (e) {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  }

  // save profile simple
  async function handleSave() {
    if (!profile) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Error", "El nombre y apellido son obligatorios.");
      return;
    }
    if (!form.email.trim() || !form.dni.trim()) {
      Alert.alert("Error", "El correo y DNI son obligatorios.");
      return;
    }

    try {
      // build payload minimal, keeping same contract names
      const payload: any = {
        idUsuario: profile.idUsuario,
        nombre: form.firstName.trim(),
        apellido: form.lastName.trim(),
        correo: form.email.trim(),
        dni: form.dni.trim(),
        telefono: form.phone?.trim() || "",
        cbu: form.cbu?.trim() || "",
        dtNacimiento: form.birthdate
          ? new Date(form.birthdate + "T00:00:00Z").toISOString()
          : profile.dtNacimiento,
        domicilio: {
          provincia: {
            nombre: form.addressProvince || "",
            codigo: profile.domicilio?.provincia?.codigo || "",
          },
          municipio: { nombre: "", codigo: "" },
          localidad: {
            nombre: form.addressLocality || "",
            codigo: profile.domicilio?.localidad?.codigo || "",
          },
          direccion: form.addressStreet || "",
          latitud: profile.domicilio?.latitud || 0,
          longitud: profile.domicilio?.longitud || 0,
        },
        cdRoles: profile.cdRoles || [],
        nombreFantasia: profile.nombreFantasia || "",
        bio: profile.bio || "",
        socials: profile.socials || {},
      };

      const updated = await updateUserProfile(payload);
      // mostrar popup de éxito en lugar de alert
      setProfile(updated);
      setIsEditing(false);
      setShowUpdateModal(true);
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.response?.data?.title || "Hubo un problema actualizando tus datos."
      );
    }
  }

  // send verification email
  async function handleSendVerify() {
    if (!form.email?.trim()) {
      Alert.alert("Error", "El correo está vacío.");
      return;
    }
    try {
      await sendVerifyEmail({
        to: form.email.trim(),
        name: `${form.firstName} ${form.lastName}`.trim() || "Usuario",
      });
      setShowVerifyModal(true);
    } catch (e: any) {
      Alert.alert(
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
      Alert.alert("Error", e?.response?.data?.title || e?.message || "No pudimos eliminar tu cuenta.");
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu domicilio</Text>
          <Text style={styles.label}>Provincia</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              /* simple: show first province if any */ setField(
                "addressProvince",
                provinces[0]?.nombre || form.addressProvince
              );
            }}
          >
            <Text>{form.addressProvince || "Seleccione provincia"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Localidad</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
            value={form.addressLocality}
            onChangeText={(t) => setField("addressLocality", t)}
            placeholder="Localidad"
          />

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            editable={isEditing}
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
});
