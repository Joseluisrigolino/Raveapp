// app/owner/PartysScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ROUTES } from "../../../routes";

import * as nav from "@/utils/navigation";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  getPartiesByUser,
  createParty,
  updateParty,
  deleteParty,
} from "@/app/party/apis/partysApi";
import InputText from "@/components/common/inputText";

/** Tipo mínimo local (coincide con utils/partysApi) */
type PartyItem = {
  idFiesta: string;
  nombre: string;
  isActivo: boolean;
  // Optional fields if backend provides ratings summary
  avgRating?: number;
  ratingAvg?: number;
  promedio?: number;
  rating?: number;
  reviewsCount?: number;
  cantResenas?: number;
  cantidad?: number;
  count?: number;
};

export default function PartysScreen() {
  const router = useRouter();
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  // Normalizar el id del usuario: preferimos user.id, si no existe usamos idUsuario
  const userId: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;

  // ---- Estado base
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<PartyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ---- Crear
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // ---- Editar (modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ====== Load ======
  async function load() {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        // Si no hay user, mostramos la UI igual con lista vacía
        setList([]);
        return;
      }

      const data = await getPartiesByUser(String(userId));
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[PartysScreen] load error", e);
      setError("No pudimos cargar tus fiestas recurrentes.");
      // mantenemos la pantalla visible
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ====== Crear fiesta ======
  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    if (!userId) {
      Alert.alert("Iniciá sesión", "Necesitás estar logueado.");
      return;
    }

    try {
      setCreating(true);
      await createParty({ idUsuario: String(userId), nombre: name });
      setNewName("");
      await load();
    } catch (e) {
      console.error("[PartysScreen] create error", e);
      Alert.alert("Error", "No se pudo crear la fiesta.");
    } finally {
      setCreating(false);
    }
  }

  // ====== Editar fiesta ======
  function beginEdit(item: PartyItem) {
    setEditingId(item.idFiesta);
    setEditingName(item.nombre ?? "");
    setShowEditModal(true);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setShowEditModal(false);
  }
  async function saveEdit() {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    try {
      setSavingEdit(true);
      await updateParty({ idFiesta: editingId, nombre: name });
      cancelEdit();
      await load();
    } catch (e) {
      console.error("[PartysScreen] update error", e);
      Alert.alert("Error", "No se pudo actualizar el nombre.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ====== Eliminar fiesta ======
  async function handleDelete(idFiesta: string, nombre: string) {
    Alert.alert(
      "Eliminar fiesta",
      `¿Eliminar "${(nombre || "").trim()}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteParty(idFiesta);
              await load();
            } catch (e) {
              console.error("[PartysScreen] delete error", e);
              Alert.alert("Error", "No se pudo eliminar la fiesta.");
            }
          },
        },
      ]
    );
  }

  const hasList = useMemo(() => list && list.length > 0, [list]);

  // Helpers for rating UI
  const getPartyRating = (p: PartyItem): { avg: number; count: number } => {
    const avgRaw = (p.avgRating ?? p.ratingAvg ?? p.promedio ?? p.rating ?? 0) as number;
    const countRaw = (p.reviewsCount ?? p.cantResenas ?? p.cantidad ?? p.count ?? 0) as number;
    const avg = Math.max(0, Math.min(5, Number(avgRaw) || 0));
    const count = Math.max(0, Number(countRaw) || 0);
    return { avg, count };
  };
  const renderStars = (avg: number) => {
    const stars = [] as JSX.Element[];
    for (let i = 1; i <= 5; i++) {
      let name: any = "star-outline";
      if (avg >= i) name = "star";
      else if (avg >= i - 0.5) name = "star-half-full";
      stars.push(
        <MaterialCommunityIcons key={i} name={name} size={16} color={COLORS.textSecondary} />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  // ====== Render ======
  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <TabMenuComponent
          tabs={[
            { label: "Crear evento", route: ROUTES.MAIN.EVENTS.CREATE, isActive: false },
            { label: "Fiestas recurrentes", route: ROUTES.OWNER.PARTYS, isActive: true },
          ]}
        />
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      {/* SubHeader para volver a Crear evento */}
      <TabMenuComponent
        tabs={[
          { label: "Crear evento", route: ROUTES.MAIN.EVENTS.CREATE, isActive: false },
          { label: "Fiestas recurrentes", route: ROUTES.OWNER.PARTYS, isActive: true },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cartel de error no bloqueante */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Título y explicación */}
        <Text style={styles.title}>Mis Fiestas Recurrentes:</Text>

        <View style={styles.paragraphs}>
          <Text style={styles.p}>
            Las fiestas recurrentes, como su nombre indica, son aquellas que
            organizas de manera regular. Pueden ser semanales, mensuales o con
            la frecuencia que tú elijas.
          </Text>
          <Text style={styles.p}>
            Si una fiesta se va a hacer una sola vez, o si es una fiesta única
            que se hace porque viene determinado DJ a la Argentina,{" "}
            <Text style={{ fontWeight: "700" }}>NO</Text> es una fiesta
            recurrente.
          </Text>
          <Text style={styles.p}>
            En esta sección podrás agregar, editar o eliminar los nombres de las
            fiestas que realices de manera continua para mantener un registro
            actualizado.
          </Text>
          <Text style={styles.p}>
            Además, las fiestas recurrentes podrán ser calificadas por aquellos
            usuarios que hayan adquirido una entrada para dicho evento. Van a
            poder puntuar la fiesta e incluso dejar un comentario si así lo
            desean.
          </Text>
        </View>

        <View style={styles.hr} />

        {/* Agregar nueva */}
  <Text style={styles.subTitle}>Agregar nueva fiesta recurrente</Text>
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <InputText
              label="Nombre de la fiesta"
              value={newName}
              isEditing={true}
              onBeginEdit={() => {}}
              onChangeText={setNewName}
              containerStyle={{ alignItems: "stretch", marginBottom: 0 }}
              labelStyle={{ width: "100%", marginBottom: 6 }}
              inputStyle={{ width: "100%", marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.addIconBtn,
              { marginLeft: 10, opacity: creating || !newName.trim() ? 0.5 : 1 },
            ]}
            onPress={handleCreate}
            disabled={creating || !newName.trim()}
            accessibilityLabel="Agregar fiesta recurrente"
          >
            <Text style={styles.addIconText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Listado */}
        <Text style={[styles.subTitle, { marginTop: 18 }]}>Mis fiestas recurrentes</Text>

        {!hasList ? (
          <Text style={styles.emptyText}>
            {userId
              ? "Aún no agregaste fiestas recurrentes."
              : "Iniciá sesión para crear y ver tus fiestas recurrentes."}
          </Text>
        ) : (
          <View style={styles.tableCard}>
            {list.map((it) => {
              const nombre = (it.nombre || "").trim();
              return (
                <View key={it.idFiesta} style={[styles.cardRow]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partyName} numberOfLines={1}>
                      {nombre.length ? nombre : "(sin nombre)"}
                    </Text>
                    {/* Rating row with stars and underlined link */}
                    <TouchableOpacity
                      onPress={() =>
                        nav.push(router, { pathname: ROUTES.OWNER.PARTY_RATINGS, params: { id: encodeURIComponent(it.idFiesta) } } as any)
                      }
                      activeOpacity={0.8}
                    >
                      {(() => {
                        const { avg, count } = getPartyRating(it);
                        const text = count > 0
                          ? `${avg.toFixed(1)} (${new Intl.NumberFormat('es-AR').format(count)} reseñas)`
                          : 'Sin calificaciones aún';
                        return (
                          <View style={styles.ratingRow}>
                            {renderStars(avg)}
                            <Text style={styles.ratingTextLink}>{text}</Text>
                          </View>
                        );
                      })()}
                    </TouchableOpacity>
                  </View>
                  {/* Actions */}
                  <View style={styles.actionsCol}>
                    <TouchableOpacity style={styles.iconAction} onPress={() => beginEdit(it)}>
                      <MaterialCommunityIcons name="square-edit-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(it.idFiesta, nombre)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal para editar */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardAvoider}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          >
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar fiesta</Text>
            </View>
            
            <View style={styles.modalBody}>
              <InputText
                label="Nombre de la fiesta"
                value={editingName}
                isEditing={true}
                onBeginEdit={() => {}}
                onChangeText={setEditingName}
                autoFocus={false}
                containerStyle={{ alignItems: "stretch" }}
                labelStyle={{ width: "100%" }}
                inputStyle={{ width: "100%", marginBottom: 0 }}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={cancelEdit}
                disabled={savingEdit}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={saveEdit}
                disabled={savingEdit || !editingName.trim()}
              >
                <Text style={styles.modalBtnSaveText}>
                  {savingEdit ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

/* ================= Estilos ================= */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.backgroundLight,
  },

  errorBanner: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.card,
    marginTop: 10,
    marginBottom: 6,
  },
  errorBannerText: { color: "#92400e" },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
    marginTop: 10,
    marginBottom: 8,
  },
  partyName: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  paragraphs: { marginTop: 8, gap: 12 },
  p: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    lineHeight: 20,
  },

  hr: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    marginVertical: 18,
  },

  subTitle: {
    fontWeight: "800",
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textDecorationLine: "underline",
  },

  addRow: { flexDirection: "row", alignItems: "flex-end" },

  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },

  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },

  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  tableCard: {
    marginTop: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderInput,
  },

  tableHeader: {
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  th: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  tableRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderInput,
  },
  tdText: { color: COLORS.textPrimary },

  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  starsRow: { flexDirection: "row", gap: 2 },
  ratingTextLink: { color: COLORS.textSecondary, textDecorationLine: "underline" },
  actionsCol: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconAction: { padding: 8, borderRadius: 8 },

  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.card,
    marginLeft: 6,
  },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  smallBtnPrimary: { backgroundColor: COLORS.primary },
  smallBtnPink: { backgroundColor: "#e11d48" },
  smallBtnGray: { backgroundColor: COLORS.textSecondary },

  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // Wrapper inside overlay that moves with the keyboard while keeping overlay full-screen
  modalKeyboardAvoider: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
  },
  // input label/field now handled by shared component inside modal
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 10,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: COLORS.textSecondary,
  },
  modalBtnCancelText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: FONT_SIZES.body,
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: FONT_SIZES.body,
  },
  // Plus icon button (aligned with input)
  addIconBtn: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: -2,
  },
});
