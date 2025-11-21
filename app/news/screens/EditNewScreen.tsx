// src/screens/admin/NewsScreens/EditNewScreen.tsx

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import ROUTES from "@/routes";

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";

import useEditNew from "../services/useEditNew";
import useNewsEvents from "../services/useNewsEvents";

import NewsEventSelectorComponent from "../components/create/NewsEventSelectorComponent";
import NewsImageMediaComponent from "../components/NewsImageMediaComponent";
import NewsSuccessPopupComponent from "../components/create/NewsSuccessPopupComponent";

export default function EditNewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const path = usePathname();
  const router = useRouter();

  const {
    loading,
    saving,
    title,
    setTitle,
    body,
    setBody,
    selectedImage,
    pickImage,
    deleteImage,
    selectedEventId,
    setSelectedEventId,
    save,
  } = useEditNew(id);

  const { events } = useNewsEvents();
  const [successVisible, setSuccessVisible] = useState(false);

  async function handleSave() {
    const result = await save();
    if (result.ok) {
      setSuccessVisible(true);
    }
  }

  function handleSuccessClose() {
    setSuccessVisible(false);
    router.back();
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <SafeAreaView style={styles.container}>
          <Header title="EventApp" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Footer />
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />

        <TabMenuComponent
          tabs={[
            {
              label: "Administrar noticias",
              route: ROUTES.ADMIN.NEWS.MANAGE,
              isActive:
                path === ROUTES.ADMIN.NEWS.MANAGE ||
                path === ROUTES.ADMIN.NEWS.CREATE ||
                path === ROUTES.ADMIN.NEWS.EDIT,
            },
            {
              label: "Noticias",
              route: ROUTES.MAIN.NEWS.LIST,
              isActive: path === ROUTES.MAIN.NEWS.LIST,
            },
          ]}
        />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Editar noticia</Text>

          <InputText
            label="Título"
            value={title}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setTitle}
            placeholder="Ingresa el título de la noticia..."
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          <NewsImageMediaComponent
            imageUri={selectedImage}
            onSelectImage={pickImage}
            onDeleteImage={deleteImage}
          />

          <InputDesc
            label="Contenido"
            value={body}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setBody}
            placeholder="Escribe el contenido de la noticia..."
            autoFocus={false}
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          <NewsEventSelectorComponent
            options={events}
            selectedId={selectedEventId}
            onChange={setSelectedEventId}
          />

          <TouchableOpacity
            style={[styles.btn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.backgroundLight} />
            ) : (
              <Text style={styles.btnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Footer />

        <NewsSuccessPopupComponent
          visible={successVisible}
          title="Éxito"
          message="Noticia actualizada con éxito."
          onClose={handleSuccessClose}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 14,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
