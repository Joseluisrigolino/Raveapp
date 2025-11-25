// app/party/screens/PartyScreenJR.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { Party, createParty } from "@/app/party/apis/partysApi";
import useGetPartysByUser from "@/app/party/services/useGetPartysByUser";
import useUpdateParty from "@/app/party/services/useUpdateParty";
import useDeleteParty from "@/app/party/services/useDeleteParty";
import { useAuth } from "@/app/auth/AuthContext";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import PartyCreateFormComponent from "@/app/party/components/PartyCreateFormComponent";
import PartyListItemComponent from "@/app/party/components/PartyListItemComponent";
import EditNamePartyPopupComponent from "../components/EditNamePartyPopupComponent";
import EliminatePartyPopupComponent from "../components/EliminatePartyPopupComponent";
import ROUTES from "@/routes";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function PartyScreenJR() {
  const router = useRouter();
  const { user } = useAuth() as any;
  const userId = (user as any)?.id ?? (user as any)?.idUsuario ?? null;

  const { parties, loading, error, refresh } = useGetPartysByUser(userId);

  const [newName, setNewName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Party | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { updateParty } = useUpdateParty();
  const { deleteParty } = useDeleteParty();

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    if (!userId) {
      Alert.alert("Iniciá sesión", "Necesitás estar logueado.");
      return;
    }

    try {
      setSavingCreate(true);
      await createParty({ idUsuario: String(userId), nombre: name });
      setNewName("");
      await refresh();
    } catch (e) {
      console.error("[PartyScreenJR] create error", e);
      Alert.alert("Error", "No se pudo crear la fiesta.");
    } finally {
      setSavingCreate(false);
    }
  }

  function startEdit(party: Party) {
    setEditId(party.idFiesta);
    setEditName(party.nombre ?? "");
    setShowEditModal(true);
  }

  async function handleSaveEdit(newNameValue: string) {
    if (!editId) return;

    try {
      setSavingEdit(true);
      await updateParty({ idFiesta: editId, nombre: newNameValue });
      setShowEditModal(false);
      setEditId(null);
      setEditName("");
      await refresh();
    } catch (e) {
      console.error("[PartyScreenJR] update error", e);
      Alert.alert("Error", "No se pudo actualizar el nombre.");
    } finally {
      setSavingEdit(false);
    }
  }

  function handleCancelEdit() {
    if (savingEdit) return;
    setShowEditModal(false);
    setEditId(null);
    setEditName("");
  }

  // Abrir popup de eliminación (ya no usamos Alert.alert)
  function openDeleteModal(party: Party) {
    setDeleteTarget(party);
    setDeleteLoading(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await deleteParty(deleteTarget.idFiesta);
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      console.error("[PartyScreenJR] delete error", e);
      Alert.alert("Error", "No se pudo eliminar la fiesta.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleCancelDelete() {
    if (deleteLoading) return;
    setDeleteTarget(null);
  }

  function handleOpenRatings(party: Party) {
    router.push({
      pathname: ROUTES.OWNER.PARTY_RATINGS,
      params: { id: encodeURIComponent(party.idFiesta) },
    } as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Crear evento",
            route: ROUTES.MAIN.EVENTS.CREATE,
            isActive: false,
          },
          {
            label: "Fiestas recurrentes",
            route: ROUTES.OWNER.PARTYS,
            isActive: true,
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis Fiestas Recurrentes:</Text>

        <Text style={styles.subTitle}>Agregar nueva fiesta recurrente</Text>
        <PartyCreateFormComponent
          value={newName}
          loading={savingCreate}
          onChangeText={setNewName}
          onSubmit={handleCreate}
        />

        <Text style={[styles.subTitle, { marginTop: 18 }]}>
          Mis fiestas recurrentes
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : parties.length === 0 ? (
          <Text style={styles.emptyText}>
            {userId
              ? "Aún no agregaste fiestas recurrentes."
              : "Iniciá sesión para crear y ver tus fiestas recurrentes."}
          </Text>
        ) : (
          <View style={styles.listCard}>
            {parties.map((p) => (
              <PartyListItemComponent
                key={p.idFiesta}
                party={p}
                onEdit={startEdit}
                onDelete={openDeleteModal}
                onOpenRatings={handleOpenRatings}
              />
            ))}
          </View>
        )}

        {/* Popup de edición de nombre */}
        <EditNamePartyPopupComponent
          visible={showEditModal}
          initialName={editName}
          saving={savingEdit}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />

        {/* Popup de eliminación de fiesta (UI/UX custom) */}
        <EliminatePartyPopupComponent
          visible={!!deleteTarget}
          partyName={deleteTarget?.nombre}
          loading={deleteLoading}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cardBg },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
    marginTop: 10,
    marginBottom: 8,
  },
  subTitle: {
    fontWeight: "800",
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.card,
    marginTop: 10,
    marginBottom: 6,
  },
  errorText: { color: "#92400e" },
  emptyText: { color: COLORS.textSecondary, marginTop: 8 },
  listCard: {
    marginTop: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    overflow: "hidden",
  },
});
