import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import CreateUserControllerRememberComponent from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerRememberComponent";
import CreateUserControllerInfoComponent from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerInfoComponent";
import CreateUserControllerAlreadyExistingComponent from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerAlreadyExistingComponent";
import CreateUserControllerUserComponent from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerUserComponent";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import useGetUsersControllers from "@/app/auth/services/user-controllers/useGetUsersControllers";
import useCreateUserControllers from "@/app/auth/services/user-controllers/useCreateUserControllers";
import useDeleteUserControllers from "@/app/auth/services/user-controllers/useDeleteUserControllers";
import CreateUserControllerPopupEliminateUserComponent from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerPopupEliminateUserComponent";
import CreateUserControllerPopupEliminateUserOk from "@/app/auth/components/user-controller/create-user-controller/CreateUserControllerPopupEliminateUserOk";

// --- Componente principal ---
export default function CreateUserController() {
  const { user } = useAuth() as any;

  // estados simples y con nombres en inglés
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);
  // controllers state removed; users come from hook
  const [orgId, setOrgId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedToDeleteId, setSelectedToDeleteId] = useState<string | null>(
    null
  );
  const [selectedToDeleteName, setSelectedToDeleteName] = useState<
    string | null
  >(null);
  const [deletedOkVisible, setDeletedOkVisible] = useState(false);
  const [lastDeletedUsername, setLastDeletedUsername] = useState<string | null>(
    null
  );

  // hooks para separar lógica de API
  const { users, refresh } = useGetUsersControllers(orgId);
  const { createUser, loading: creating } = useCreateUserControllers();
  const { deleteUser, loading: deleting } = useDeleteUserControllers();

  // efecto para cargar organización y usuarios
  useEffect(() => {
    async function load() {
      try {
        if (!user?.username) return;
        const profile = await getProfile(user.username);
        const id = String(profile?.idUsuario ?? "");
        if (!id) return;
        setOrgId(id);
      } catch (e) {
        // si falla, no hacemos nada (la carga de users la maneja el hook)
      }
    }
    load();
  }, [user?.username]);

  const canCreate =
    username.trim().length > 0 &&
    password.length >= 4 &&
    !submitting &&
    !creating;

  // crear usuario controlador
  const handleCreateController = useCallback(async () => {
    const name = username.trim();
    if (!name) return;

    if (!orgId) {
      Alert.alert(
        "Sin organización",
        "No se pudo determinar el ID de organizador."
      );
      return;
    }
    try {
      setSubmitting(true);
      const res = await createUser({
        idUsuarioOrg: orgId!,
        nombreUsuario: name,
        password,
      });
      // refrescar lista usando el hook
      refresh();
      setUsername("");
      setPassword("");
      // Mostrar confirmación con el id si está disponible
      const createdId = res?.id ? String(res.id) : undefined;
      Alert.alert(
        "Usuario creado",
        createdId
          ? `Usuario '${name}' creado (id: ${createdId})`
          : `Usuario '${name}' creado correctamente.`
      );
    } catch (e: any) {
      // Delegamos toda la comprobación de disponibilidad al hook.
      // El hook lanzará un error con `code === 'USERNAME_EXISTS'` cuando corresponda.
      if (e?.code === "USERNAME_EXISTS") {
        Alert.alert("Nombre no disponible", `El nombre '${name}' no está disponible. Por favor elegí otro.`);
      } else {
        const msg = (e?.message && String(e.message).trim() !== "")
          ? String(e.message)
          : (e?.response?.data?.title || e?.response?.data?.message || "No se pudo crear el usuario controlador.");
        Alert.alert("Error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [username, password, orgId, createUser, refresh]);

  // borrar localmente (la lista) — comportamiento igual que antes
  const openDeleteModal = useCallback((id: string | null, name?: string) => {
    setSelectedToDeleteId(id ?? null);
    setSelectedToDeleteName(name ?? null);
    setDeleteModalVisible(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setSelectedToDeleteId(null);
    setSelectedToDeleteName(null);
    setDeleteModalVisible(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedToDeleteId && !selectedToDeleteName) return;
    try {
      if (selectedToDeleteId && orgId) {
        // si tenemos id y orgId, llamamos al endpoint específico por IDs
        await deleteUser({
          idUsuarioOrg: orgId,
          idUsuarioControl: selectedToDeleteId,
        });
      } else if (selectedToDeleteName) {
        // fallback cuando sólo tenemos nombre
        await deleteUser(selectedToDeleteName);
      } else {
        throw new Error("No hay identificador para eliminar");
      }
      refresh();
      // guardar el username eliminado para mostrar en el popup de éxito
      setLastDeletedUsername(selectedToDeleteName ?? null);
      setDeletedOkVisible(true);
    } catch (e) {
      Alert.alert("Error", "No se pudo eliminar el usuario");
    } finally {
      closeDeleteModal();
    }
  }, [
    selectedToDeleteId,
    selectedToDeleteName,
    deleteUser,
    refresh,
    closeDeleteModal,
    orgId,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título y descripción */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Icon name="security" size={18} color="#0f172a" />
            </View>
            <Text style={styles.headerTitle}>Usuarios Controladores</Text>
          </View>
          <Text style={styles.headerDesc}>
            Creá credenciales para el personal que controla entradas en la
            puerta. Podés generar tantos usuarios como necesites para tu equipo.
          </Text>
        </View>

        {/* Crear Nuevo Usuario (extraído) */}
        <CreateUserControllerInfoComponent
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          secureEntry={secureEntry}
          setSecureEntry={setSecureEntry}
          canCreate={canCreate}
          onCreate={handleCreateController}
        />

        {/* Info (extraído) */}
        <CreateUserControllerRememberComponent />

        {/* Lista de usuarios (extraída a componentes) */}
        <CreateUserControllerAlreadyExistingComponent>
          {users.map((u) => (
            <CreateUserControllerUserComponent
              key={u.username}
              username={u.username}
              onDelete={() => openDeleteModal(u.id ?? null, u.username)}
            />
          ))}
        </CreateUserControllerAlreadyExistingComponent>

        {/* Popup de confirmación de eliminación */}
        <CreateUserControllerPopupEliminateUserComponent
          visible={deleteModalVisible}
          username={selectedToDeleteName || undefined}
          loading={deleting}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />

        {/* Popup que confirma que la eliminación fue exitosa */}
        <CreateUserControllerPopupEliminateUserOk
          visible={deletedOkVisible}
          username={lastDeletedUsername || undefined}
          onClose={() => {
            setLastDeletedUsername(null);
            setDeletedOkVisible(false);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Estilos simples al final ---
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#f5f6fa" },
  header: { marginBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerDesc: { color: "#6b7280" },

  // footer styles removed — footer UI deleted
});
