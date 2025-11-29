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
  TouchableOpacity,
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
    // Popup de alerta unificado
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState<string>("");
    const [popupMessage, setPopupMessage] = useState<string>("");

    const showPopup = (title: string, message: string) => {
      setPopupTitle(title);
      setPopupMessage(message);
      setPopupVisible(true);
    };
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
      showPopup("Iniciá sesión", "Necesitás estar logueado.");
      return;
    }

    try {
      setSavingCreate(true);
      await createParty({ idUsuario: String(userId), nombre: name });
      setNewName("");
      await refresh();
    } catch (e) {
      console.error("[PartyScreenJR] create error", e);
      showPopup("Error", "No se pudo crear la fiesta.");
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
      showPopup("Error", "No se pudo actualizar el nombre.");
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
      showPopup("Error", "No se pudo eliminar la fiesta.");
    } finally {
      setDeleteLoading(false);
    }
        {/* Popup de alerta unificado */}
        <View>
          {popupVisible && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                <View style={{ width: "90%", maxWidth: 380, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.card, padding: 16 }}>
                  <Text style={{ fontFamily: "Montserrat-SemiBold", fontSize: 20, color: COLORS.textPrimary, marginBottom: 6 }}>{popupTitle}</Text>
                  <Text style={{ fontFamily: "Montserrat-Regular", fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 }}>{popupMessage}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: RADIUS.card, backgroundColor: COLORS.textPrimary, alignItems: "center", justifyContent: "center", minHeight: 44 }} onPress={() => setPopupVisible(false)}>
                      <Text style={{ fontFamily: "Montserrat-SemiBold", fontSize: 16, color: COLORS.backgroundLight }}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
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
