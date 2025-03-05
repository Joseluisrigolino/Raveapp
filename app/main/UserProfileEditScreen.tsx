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

// Si usas Expo, cambia a:
// import { MaterialIcons } from "@expo/vector-icons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import { UserProfile } from "@/interfaces/UserProfileProps";

// Datos iniciales (ejemplo). En la práctica vendrían de tu API.
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
  // "originalData": la última versión confirmada
  const [originalData, setOriginalData] = useState<UserProfile>(mockUserData);
  // "userData": la versión editable en pantalla
  const [userData, setUserData] = useState<UserProfile>(mockUserData);

  // Estado para habilitar/deshabilitar edición de cada campo
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

  // Manejo de cambios (campos principales)
  const handleChange = (field: keyof UserProfile, value: string) => {
    setUserData({ ...userData, [field]: value });
  };

  // Manejo de cambios (campos de la dirección)
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

  // Alternar edición de un campo
  const handleToggleEdit = (fieldKey: string) => {
    setEditMode((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // Reusable: resetea todos los campos en editMode a false
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

  // Al confirmar, guardamos lo editado como la nueva versión "original"
  const handleConfirm = () => {
    console.log("Datos confirmados:", userData);
    alert("Datos confirmados (ejemplo).");
    // Aquí podrías llamar a tu API para guardar los cambios
    setOriginalData(userData); // Actualizamos la versión confirmada
    resetEditMode(); // Volvemos a deshabilitar todos los campos
  };

  // Al cancelar, descartamos lo editado y volvemos a la última versión confirmada
  const handleCancel = () => {
    console.log("Edición cancelada.");
    setUserData(originalData); // Revertimos a la última versión confirmada
    resetEditMode(); // Deshabilitamos todos los campos
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
              { backgroundColor: editMode.firstName ? "#fff" : "#ddd" },
            ]}
            value={userData.firstName}
            onChangeText={(val) => handleChange("firstName", val)}
            editable={editMode.firstName}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("firstName")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Apellido */}
        <View style={styles.row}>
          <Text style={styles.label}>Apellido:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: editMode.lastName ? "#fff" : "#ddd" },
            ]}
            value={userData.lastName}
            onChangeText={(val) => handleChange("lastName", val)}
            editable={editMode.lastName}
          />
          <TouchableOpacity
            onPress={() => handleToggleEdit("lastName")}
            style={styles.iconButton}
          >
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* DNI */}
        <View style={styles.row}>
          <Text style={styles.label}>DNI:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: editMode.dni ? "#fff" : "#ddd" },
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Celular */}
        <View style={styles.row}>
          <Text style={styles.label}>Celular:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: editMode.phone ? "#fff" : "#ddd" },
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Email */}
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: editMode.email ? "#fff" : "#ddd" },
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Contraseña */}
        <View style={styles.row}>
          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: editMode.password ? "#fff" : "#ddd" },
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
            <MaterialIcons name="edit" size={20} color="#666" />
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
                backgroundColor: editMode["address.province"] ? "#fff" : "#ddd",
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
            <MaterialIcons name="edit" size={20} color="#666" />
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
                  ? "#fff"
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Localidad */}
        <View style={styles.row}>
          <Text style={styles.label}>Localidad:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.locality"] ? "#fff" : "#ddd",
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Calle */}
        <View style={styles.row}>
          <Text style={styles.label}>Calle:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.street"] ? "#fff" : "#ddd",
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
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Número */}
        <View style={styles.row}>
          <Text style={styles.label}>Número:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: editMode["address.number"] ? "#fff" : "#ddd",
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
            <MaterialIcons name="edit" size={20} color="#666" />
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
                  ? "#fff"
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
            <MaterialIcons name="edit" size={20} color="#666" />
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
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
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
  },
  input: {
    flex: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  confirmButton: {
    backgroundColor: "#008CBA", // azul
  },
  cancelButton: {
    backgroundColor: "#B80F0A", // rojo
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
