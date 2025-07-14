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

export default function UserProfileEditScreen() {
  const { user, logout } = useAuth();
  const [apiUser, setApiUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    firstName: false,
    lastName: false,
    dni: false,
    phone: false,
    email: false,
    "address.province": false,
    "address.municipality": false,
    "address.locality": false,
    "address.street": false,
    "address.number": false,
    "address.floorDept": false,
  });
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    address: {
      province: "",
      municipality: "",
      locality: "",
      street: "",
      number: "",
      floorDept: "",
    },
  });

  // URL de imagen aleatoria
  const randomProfileImage = useMemo(
    () => `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/100`,
    []
  );

  useEffect(() => {
    if (!user) return;
    getProfile(user.username)
      .then((u) => {
        setApiUser(u);
        const [street, number = "", floorDept = ""] =
          (u.domicilio.direccion || "").split(/ (\d+)(?: (.*))?/).slice(0, 3);
        setUserData({
          firstName: u.nombre,
          lastName: u.apellido,
          dni: u.dni,
          phone: u.telefono,
          email: u.correo,
          address: {
            province: u.domicilio.provincia.nombre,
            municipality: u.domicilio.municipio.nombre,
            locality: u.domicilio.localidad.nombre,
            street,
            number,
            floorDept,
          },
        });
      })
      .catch(() => {
        Alert.alert("Error", "No se pudo cargar tu perfil.");
      })
      .finally(() => setLoading(false));
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

  const handleChangePhoto = () => {
    Alert.alert("Cambiar foto", "Lógica de selección de nueva foto aquí.");
  };

  const handlePasswordReset = () => {
    Alert.alert(
      "Restablecer contraseña",
      `Se enviará un correo a ${userData.email} con instrucciones.`
    );
  };

  const handleConfirm = async () => {
    if (!apiUser) return;
    const payload = {
      idUsuario: apiUser.idUsuario,
      nombre: userData.firstName,
      apellido: userData.lastName,
      correo: userData.email,
      cbu: apiUser.cbu ?? "",
      dni: userData.dni,
      telefono: userData.phone,
      nombreFantasia: apiUser.nombreFantasia ?? "",
      bio: apiUser.bio ?? "",
      cdRoles: (apiUser.roles || []).map((r: any) => r.cdRol),
      socials: {
        idSocial: apiUser.socials.idSocial ?? "",
        mdInstagram: apiUser.socials.mdInstagram ?? "",
        mdSpotify: apiUser.socials.mdSpotify ?? "",
        mdSoundcloud: apiUser.socials.mdSoundcloud ?? "",
      },
      dtNacimiento: apiUser.dtNacimiento,
      domicilio: {
        provincia: apiUser.domicilio.provincia,
        municipio: apiUser.domicilio.municipio,
        localidad: apiUser.domicilio.localidad,
        direccion: [
          userData.address.street,
          userData.address.number,
          userData.address.floorDept,
        ]
          .filter(Boolean)
          .join(" "),
        latitud: apiUser.domicilio.latitud,
        longitud: apiUser.domicilio.longitud,
      },
    };

    try {
      await updateUsuario(payload);
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      setEditMode(
        Object.fromEntries(Object.keys(editMode).map((k) => [k, false]))
      );
      setApiUser((prev: any) => ({ ...prev, ...payload }));
    } catch (err: any) {
      Alert.alert(
        "Error al actualizar",
        err.response?.data?.title || "Hubo un problema actualizando tus datos."
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  type RowProps = {
    label: string;
    value: string;
    editable: boolean;
    onChangeText: (v: string) => void;
    onToggle: () => void;
    keyboardType?: any;
    secureTextEntry?: boolean;
  };

  function Row({
    label,
    value,
    editable,
    onChangeText,
    onToggle,
    keyboardType,
    secureTextEntry,
  }: RowProps) {
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
              secureTextEntry={secureTextEntry}
            />
          ) : (
            <Text style={styles.valueText}>{value}</Text>
          )}
          <TouchableOpacity onPress={onToggle} style={styles.icon}>
            <MaterialIcons
              name="edit"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Foto de perfil */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: randomProfileImage }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.photoEditButton}
              onPress={handleChangePhoto}
            >
              <MaterialIcons name="edit" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>Mis Datos Personales</Text>

          <Row
            label="Nombre"
            value={userData.firstName}
            editable={editMode.firstName}
            onChangeText={(v) => onChange("firstName", v)}
            onToggle={() => toggle("firstName")}
          />
          <Row
            label="Apellido"
            value={userData.lastName}
            editable={editMode.lastName}
            onChangeText={(v) => onChange("lastName", v)}
            onToggle={() => toggle("lastName")}
          />
          <Row
            label="DNI"
            value={userData.dni}
            editable={editMode.dni}
            onChangeText={(v) => onChange("dni", v)}
            onToggle={() => toggle("dni")}
            keyboardType="numeric"
          />
          <Row
            label="Celular"
            value={userData.phone}
            editable={editMode.phone}
            onChangeText={(v) => onChange("phone", v)}
            onToggle={() => toggle("phone")}
            keyboardType="phone-pad"
          />
          <Row
            label="Correo"
            value={userData.email}
            editable={editMode.email}
            onChangeText={(v) => onChange("email", v)}
            onToggle={() => toggle("email")}
            keyboardType="email-address"
          />

          {/* Contraseña */}
          <View style={styles.row}>
            <Text style={styles.label}>Contraseña</Text>
            <TouchableOpacity
              style={styles.resetContainer}
              onPress={handlePasswordReset}
            >
              <MaterialIcons name="email" size={20} color={COLORS.cardBg} />
              <Text style={styles.resetText}>Enviar correo</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.cardTitle, { marginTop: 24 }]}>
            Tu domicilio:
          </Text>
          <Row
            label="Provincia"
            value={userData.address.province}
            editable={editMode["address.province"]}
            onChangeText={(v) => onAddressChange("province", v)}
            onToggle={() => toggle("address.province")}
          />
          <Row
            label="Municipio"
            value={userData.address.municipality}
            editable={editMode["address.municipality"]}
            onChangeText={(v) => onAddressChange("municipality", v)}
            onToggle={() => toggle("address.municipality")}
          />
          <Row
            label="Localidad"
            value={userData.address.locality}
            editable={editMode["address.locality"]}
            onChangeText={(v) => onAddressChange("locality", v)}
            onToggle={() => toggle("address.locality")}
          />
          <Row
            label="Dirección"
            value={`${userData.address.street} ${userData.address.number} ${userData.address.floorDept}`}
            editable={editMode["address.street"]}
            onChangeText={(v) => onAddressChange("street", v)}
            onToggle={() => toggle("address.street")}
          />

          {/* Botones Confirmar y Cerrar sesión */}
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
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  photoContainer: {
    alignSelf: "center",
    marginBottom: 16,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  cardTitle: {
    fontSize: FONT_SIZES.titleMain,
    fontFamily: FONTS.titleBold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  valueContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  valueText: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: COLORS.cardBg,
  },
  icon: {
    padding: 4,
  },
  resetContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
  },
  resetText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    marginLeft: 6,
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  confirm: {
    backgroundColor: COLORS.primary,
  },
  logout: {
    backgroundColor: COLORS.negative,
  },
  buttonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
    textAlign: "center",
  },
});
