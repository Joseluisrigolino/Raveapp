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
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateUsuario } from "@/utils/auth/userHelpers";
import { mediaApi } from "@/utils/mediaApi";
import { apiClient } from "@/utils/apiConfig";

// ---- IMPORT DE GEOFREF ----
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";

export default function UserProfileEditScreen() {
  const { user, logout } = useAuth();
  // Perfil
  const [apiUser, setApiUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string>("");

  // Edición básica
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
    // no hacemos picker de número ni depto
  });
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

  // PICKERS GEOFREF
  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; nombre: string }[]>([]);
  const [localities, setLocalities] = useState<{ id: string; nombre: string }[]>([]);

  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);

  const [provinceId, setProvinceId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [localityId, setLocalityId] = useState("");

  // Foto fallback
  const randomProfileImage = useMemo(
    () =>
      `https://picsum.photos/seed/${Math.floor(
        Math.random() * 10000
      )}/100`,
    []
  );

  // CARGA PERFIL + GEOREF
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // 1) Perfil
        const u = await getProfile(user.username);
        setApiUser(u);

        // desmontar dirección
        const raw = u.domicilio?.direccion ?? "";
        const [ , street="", number="", floorDept="" ] =
          raw.match(/^(.*?)\s?(\d+)?\s?(.*)?$/) || [];

        setUserData({
          firstName: u.nombre,
          lastName: u.apellido,
          dni: u.dni,
          phone: u.telefono,
          email: u.correo,
          birthdate: u.dtNacimiento?.split("T")[0] ?? "",
          address: {
            province: u.domicilio?.provincia?.nombre ?? "",
            municipality: u.domicilio?.municipio?.nombre ?? "",
            locality: u.domicilio?.localidad?.nombre ?? "",
            street,
            number,
            floorDept,
          },
        });

        // 2) Imagen
        const mediaData: any = await mediaApi.getByEntidad(u.idUsuario);
        const m = mediaData.media?.[0];
        let img = m?.url ?? m?.imagen ?? "";
        if (img && m?.imagen && !/^https?:\/\//.test(img)) {
          img = `${apiClient.defaults.baseURL}${
            img.startsWith("/") ? "" : "/"
          }${img}`;
        }
        setProfileImage(img || randomProfileImage);

        // 3) Provincias
        const provs = await fetchProvinces();
        setProvinces(provs);

        // SI viene un nombre existente, buscamos su ID inicial
        const foundProv = provs.find((p) => p.nombre === u.domicilio?.provincia?.nombre);
        if (foundProv) {
          setProvinceId(foundProv.id);
          // Cargar municipios de arranque
          const muns = await fetchMunicipalities(foundProv.id);
          setMunicipalities(muns);
          const foundMun = muns.find((m) => m.nombre === u.domicilio?.municipio?.nombre);
          if (foundMun) {
            setMunicipalityId(foundMun.id);
            // y localidades
            const locs = await fetchLocalities(foundProv.id, foundMun.id);
            setLocalities(locs);
            const foundLoc = locs.find((l) => l.nombre === u.domicilio?.localidad?.nombre);
            if (foundLoc) setLocalityId(foundLoc.id);
          }
        }
      } catch (err) {
        console.warn(err);
        setProfileImage(randomProfileImage);
        Alert.alert("Error", "No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const onChange = (field: string, value: string) =>
    setUserData((d) => ({ ...d, [field]: value }));
  const onAddressChange = (field: string, value: string) =>
    setUserData((d) => ({
      ...d,
      address: { ...d.address, [field]: value },
    }));
  const toggle = (key: string) =>
    setEditMode((m) => ({ ...m, [key]: !m[key] }));

  // HANDLERS GEOFREF
  const handleSelectProvince = async (id: string, nombre: string) => {
    setProvinceId(id);
    onAddressChange("province", nombre);
    setShowProvinces(false);
    // reset abajo
    setMunicipalityId(""); setLocalityId("");
    setUserData((d) => ({
      ...d,
      address: { ...d.address, municipality: "", locality: "" },
    }));
    const muns = await fetchMunicipalities(id);
    setMunicipalities(muns);
    setLocalities([]);
  };
  const handleSelectMunicipality = async (id: string, nombre: string) => {
    setMunicipalityId(id);
    onAddressChange("municipality", nombre);
    setShowMunicipalities(false);
    setLocalityId("");
    setUserData((d) => ({
      ...d,
      address: { ...d.address, locality: "" },
    }));
    const locs = await fetchLocalities(provinceId, id);
    setLocalities(locs);
  };
  const handleSelectLocality = (id: string, nombre: string) => {
    setLocalityId(id);
    onAddressChange("locality", nombre);
    setShowLocalities(false);
  };

  const handleChangePhoto = () => {
    Alert.alert("Cambiar foto", "Lógica de selección de imagen aquí.");
  };
  const handlePasswordReset = () =>
    Alert.alert("Restablecer contraseña", `Se enviará correo a ${userData.email}`);

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
        direccion: [
          userData.address.street,
          userData.address.number,
          userData.address.floorDept,
        ].filter(Boolean).join(" "),
        latitud: apiUser.domicilio?.latitud,
        longitud: apiUser.domicilio?.longitud,
      },
    };
    try {
      await updateUsuario(payload);
      Alert.alert("Éxito", "Perfil actualizado.");
      // cerrar todos los modos edición
      setEditMode(Object.fromEntries(Object.keys(editMode).map((k) => [k, false])));
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.title || "Problema actualizando.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // Row reutilizable
  type RowProps = {
    label: string;
    value: string;
    editable: boolean;
    onChangeText: (v: string) => void;
    onToggle: () => void;
    keyboardType?: any;
  };
  function Row({ label, value, editable, onChangeText, onToggle, keyboardType }: RowProps) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueContainer}>
          {editable ? (
            <TextInput
              value={value}
              onChangeText={onChangeText}
              style={styles.valueInput}
              keyboardType={keyboardType}
            />
          ) : (
            <Text style={styles.valueText}>{value}</Text>
          )}
          <TouchableOpacity onPress={onToggle} style={styles.icon}>
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.mainTitle}>Mi Perfil</Text>

        <View style={styles.photoContainer}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <TouchableOpacity style={styles.photoEditButton} onPress={handleChangePhoto}>
            <MaterialIcons name="edit" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.smallNote}>
          Formatos permitidos: JPG, JPEG o PNG. Máx. 2MB.
        </Text>

        <Row label="Nombre" value={userData.firstName} editable={editMode.firstName}
          onChangeText={(v) => onChange("firstName", v)} onToggle={() => toggle("firstName")} />
        <Row label="Apellido" value={userData.lastName} editable={editMode.lastName}
          onChangeText={(v) => onChange("lastName", v)} onToggle={() => toggle("lastName")} />
        <Row label="DNI" value={userData.dni} editable={editMode.dni}
          onChangeText={(v) => onChange("dni", v)} onToggle={() => toggle("dni")}
          keyboardType="numeric" />
        <Row label="Teléfono" value={userData.phone} editable={editMode.phone}
          onChangeText={(v) => onChange("phone", v)} onToggle={() => toggle("phone")}
          keyboardType="phone-pad" />
        <Row label="Correo" value={userData.email} editable={editMode.email}
          onChangeText={(v) => onChange("email", v)} onToggle={() => toggle("email")}
          keyboardType="email-address" />
        <Row label="Fecha de nacimiento" value={userData.birthdate} editable={editMode.birthdate}
          onChangeText={(v) => onChange("birthdate", v)} onToggle={() => toggle("birthdate")} />

        <TouchableOpacity style={styles.resetContainer} onPress={handlePasswordReset}>
          <MaterialIcons name="lock-reset" size={20} color={COLORS.cardBg} />
          <Text style={styles.resetText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        {/* --- DOMICILIO --- */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Tu domicilio</Text>

        {/* Provincia */}
        <Text style={styles.addressSubtitle}>Provincia</Text>
        {editMode["address.province"] ? (
          <>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => {
              setShowProvinces(!showProvinces);
              setShowMunicipalities(false);
              setShowLocalities(false);
            }}>
              <Text style={styles.dropdownText}>
                {userData.address.province || "Seleccione provincia"}
              </Text>
            </TouchableOpacity>
            {showProvinces && (
              <View style={styles.dropdownContainer}>
                {provinces.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.dropdownItem}
                    onPress={() => handleSelectProvince(p.id, p.nombre)}>
                    <Text>{p.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.row}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.province || "–"}
            </Text>
            <TouchableOpacity onPress={() => toggle("address.province")} style={styles.icon}>
              <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Municipio */}
        <Text style={styles.addressSubtitle}>Municipio</Text>
        {editMode["address.municipality"] ? (
          <>
            <TouchableOpacity style={styles.dropdownButton} disabled={!provinceId} onPress={() => {
              setShowMunicipalities(!showMunicipalities);
              setShowProvinces(false);
              setShowLocalities(false);
            }}>
              <Text style={[styles.dropdownText, !provinceId && { opacity: 0.5 }]}>
                {userData.address.municipality || "Seleccione municipio"}
              </Text>
            </TouchableOpacity>
            {showMunicipalities && (
              <View style={styles.dropdownContainer}>
                {municipalities.map((m) => (
                  <TouchableOpacity key={m.id} style={styles.dropdownItem}
                    onPress={() => handleSelectMunicipality(m.id, m.nombre)}>
                    <Text>{m.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.row}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.municipality || "–"}
            </Text>
            <TouchableOpacity onPress={() => toggle("address.municipality")} style={styles.icon}>
              <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Localidad */}
        <Text style={styles.addressSubtitle}>Localidad</Text>
        {editMode["address.locality"] ? (
          <>
            <TouchableOpacity style={styles.dropdownButton} disabled={!municipalityId} onPress={() => {
              setShowLocalities(!showLocalities);
              setShowProvinces(false);
              setShowMunicipalities(false);
            }}>
              <Text style={[styles.dropdownText, !municipalityId && { opacity: 0.5 }]}>
                {userData.address.locality || "Seleccione localidad"}
              </Text>
            </TouchableOpacity>
            {showLocalities && (
              <View style={styles.dropdownContainer}>
                {localities.map((l) => (
                  <TouchableOpacity key={l.id} style={styles.dropdownItem}
                    onPress={() => handleSelectLocality(l.id, l.nombre)}>
                    <Text>{l.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.row}>
            <Text style={[styles.valueText, { flex: 1 }]}>
              {userData.address.locality || "–"}
            </Text>
            <TouchableOpacity onPress={() => toggle("address.locality")} style={styles.icon}>
              <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Calle y número */}
        <Text style={styles.addressSubtitle}>Dirección</Text>
        <Row
          label=""
          value={`${userData.address.street} ${userData.address.number} ${userData.address.floorDept}`}
          editable={editMode["address.street"]}
          onChangeText={(v) => onAddressChange("street", v)}
          onToggle={() => toggle("address.street")}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.confirm]} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Confirmar cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.logout]} onPress={logout}>
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.deleteAccount]}
          onPress={() => Alert.alert("Eliminar cuenta", "Confirmar eliminación")}
        >
          <Text style={styles.buttonText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: "center", backgroundColor: COLORS.backgroundLight },
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scroll: { padding: 16, alignItems: "center" },
  mainTitle: {
    fontSize: FONT_SIZES.titleMain,
    fontFamily: FONTS.titleBold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  photoContainer: { position: "relative", marginBottom: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#eee" },
  photoEditButton: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: COLORS.primary, width: 30, height: 30,
    borderRadius: 15, alignItems: "center", justifyContent: "center",
  },
  smallNote: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", width: "90%", marginBottom: 12 },
  label: { flex: 1, fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.body, color: COLORS.textPrimary },
  valueContainer: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  valueText: { flex: 1, fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.textSecondary, marginRight: 8 },
  valueInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card, paddingHorizontal: 8,
    paddingVertical: 6, marginRight: 8, backgroundColor: COLORS.cardBg,
  },
  icon: { padding: 4 },
  resetContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.primary, paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: RADIUS.card,
    marginVertical: 16,
  },
  resetText: { color: COLORS.cardBg, fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.body, marginLeft: 6 },
  divider: { width: "90%", borderBottomWidth: 1, borderBottomColor: COLORS.borderInput, marginVertical: 16 },
  sectionTitle: {
    width: "90%", fontSize: FONT_SIZES.subTitle,
    fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary,
    marginBottom: 12,
  },
  addressSubtitle: {
    width: "90%", fontSize: FONT_SIZES.body + 2,
    fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary,
    textAlign: "left", marginBottom: 4,
  },
  // dropdown styles
  dropdownButton: {
    width: "90%", backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card, padding: 10,
    marginBottom: 4,
  },
  dropdownText: { color: COLORS.textPrimary },
  dropdownContainer: {
    width: "90%", borderWidth: 1, borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card, backgroundColor: COLORS.cardBg,
    marginBottom: 8,
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  buttonContainer: {
    flexDirection: "row", justifyContent: "space-around",
    width: "100%", marginTop: 16,
  },
  button: { borderRadius: RADIUS.card, paddingVertical: 12, paddingHorizontal: 24, minWidth: 140 },
  confirm: { backgroundColor: COLORS.primary },
  logout: { backgroundColor: COLORS.secondary },
  deleteAccount: { backgroundColor: COLORS.negative, marginTop: 16 },
  buttonText: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.button, color: COLORS.cardBg, textAlign: "center" },
});
