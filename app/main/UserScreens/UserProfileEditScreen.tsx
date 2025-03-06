import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import { UserProfile } from "@/interfaces/UserProfileProps";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Datos iniciales (ejemplo).
const mockUserData: UserProfile = {
  firstName: "Juan",
  lastName: "Lopez",
  dni: "99889988",
  phone: "1165652121",
  email: "juanlopez@gmail.com",
  password: "********",
  address: {
    province: "Capital Federal",
    municipality: "Capital Federal",
    locality: "Capital Federal",
    street: "Malvinas Argentinas",
    number: "8890",
    floorDept: "5 B",
  },
};

export default function UserProfileEditScreen() {
  const [originalData, setOriginalData] = useState<UserProfile>(mockUserData);
  const [userData, setUserData] = useState<UserProfile>(mockUserData);

  const [editMode, setEditMode] = useState({
    firstName: false,
    lastName: false,
    dni: false,
    phone: false,
    email: false,
    password: false,
    "address.province": false,
    "address.municipality": false,
    "address.locality": false,
    "address.street": false,
    "address.number": false,
    "address.floorDept": false,
  });

  const handleChange = (field: keyof UserProfile, value: string) => {
    setUserData({ ...userData, [field]: value });
  };

  const handleAddressChange = (
    field: keyof UserProfile["address"],
    value: string
  ) => {
    setUserData({
      ...userData,
      address: {
        ...userData.address,
        [field]: value,
      },
    });
  };

  const handleToggleEdit = (fieldKey: string) => {
    setEditMode((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const resetEditMode = () => {
    setEditMode({
      firstName: false,
      lastName: false,
      dni: false,
      phone: false,
      email: false,
      password: false,
      "address.province": false,
      "address.municipality": false,
      "address.locality": false,
      "address.street": false,
      "address.number": false,
      "address.floorDept": false,
    });
  };

  const handleConfirm = () => {
    console.log("Datos confirmados:", userData);
    alert("Datos confirmados (ejemplo).");
    setOriginalData(userData);
    resetEditMode();
  };

  const handleCancel = () => {
    console.log("Edición cancelada.");
    setUserData(originalData);
    resetEditMode();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Modificación de datos personales:</Text>

        {/* Nombre */}
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.firstName
                  ? COLORS.cardBg
                  : "#ddd",
              },
            ]}
            value={userData.firstName}
            onChangeText={(val) => handleChange("firstName", val)}
            editable={editMode.firstName}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("firstName")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Apellido */}
        <View style={styles.row}>
          <Text style={styles.label}>Apellido:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.lastName ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.lastName}
            onChangeText={(val) => handleChange("lastName", val)}
            editable={editMode.lastName}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("lastName")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* DNI */}
        <View style={styles.row}>
          <Text style={styles.label}>DNI:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.dni ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.dni}
            onChangeText={(val) => handleChange("dni", val)}
            editable={editMode.dni}
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("dni")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Celular */}
        <View style={styles.row}>
          <Text style={styles.label}>Celular:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.phone ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.phone}
            onChangeText={(val) => handleChange("phone", val)}
            editable={editMode.phone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("phone")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Email */}
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.email ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.email}
            onChangeText={(val) => handleChange("email", val)}
            editable={editMode.email}
            keyboardType="email-address"
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("email")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Contraseña */}
        <View style={styles.row}>
          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode.password ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.password}
            onChangeText={(val) => handleChange("password", val)}
            editable={editMode.password}
            secureTextEntry
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("password")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { marginTop: 16 }]}>
          Domicilio de facturación:
        </Text>

        {/* Provincia */}
        <View style={styles.row}>
          <Text style={styles.label}>Provincia:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.province"] ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.address.province}
            onChangeText={(val) => handleAddressChange("province", val)}
            editable={editMode["address.province"]}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.province")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Municipio */}
        <View style={styles.row}>
          <Text style={styles.label}>Municipio:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.municipality"]
                  ? COLORS.cardBg
                  : "#ddd",
              },
            ]}
            value={userData.address.municipality}
            onChangeText={(val) => handleAddressChange("municipality", val)}
            editable={editMode["address.municipality"]}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.municipality")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Localidad */}
        <View style={styles.row}>
          <Text style={styles.label}>Localidad:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.locality"] ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.address.locality}
            onChangeText={(val) => handleAddressChange("locality", val)}
            editable={editMode["address.locality"]}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.locality")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Calle */}
        <View style={styles.row}>
          <Text style={styles.label}>Calle:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.street"] ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.address.street}
            onChangeText={(val) => handleAddressChange("street", val)}
            editable={editMode["address.street"]}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.street")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Número */}
        <View style={styles.row}>
          <Text style={styles.label}>Número:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.number"] ? COLORS.cardBg : "#ddd",
              },
            ]}
            value={userData.address.number}
            onChangeText={(val) => handleAddressChange("number", val)}
            editable={editMode["address.number"]}
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.number")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Piso/Depto */}
        <View style={styles.row}>
          <Text style={styles.label}>Piso/Depto:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.floorDept"]
                  ? COLORS.cardBg
                  : "#ddd",
              },
            ]}
            value={userData.address.floorDept}
            onChangeText={(val) => handleAddressChange("floorDept", val)}
            editable={editMode["address.floorDept"]}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("address.floorDept")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Botones Confirmar / Cancelar */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, // Gris claro principal
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: FONT_SIZES.subTitle,    // 18-20px
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    width: 120,
    fontWeight: "600",
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,       // 14-16
  },
  input: {
    flex: 1,
    borderRadius: RADIUS.card,       // 10-15px
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    // Por defecto, backgroundColor se define dinámicamente según editMode
    // color: COLORS.textPrimary, si deseas un color de texto
    // borderWidth: 1, borderColor: COLORS.borderInput, etc. si quieres bordes
  },
  iconButton: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  button: {
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,  // Azul oscuro
  },
  cancelButton: {
    backgroundColor: COLORS.negative, // Rojo
  },
  buttonText: {
    color: COLORS.cardBg,   // Blanco
    fontWeight: "bold",
    fontSize: FONT_SIZES.button,
    textAlign: "center",
  },
});
