// src/screens/admin/NewsScreens/CreateNewScreen.tsx

import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ProtectedRoute from "@/app/auth/ProtectedRoute";

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";

import NewsEventSelectorComponent from "../components/create/NewsEventSelectorComponent";
import NewsSuccessPopupComponent from "../components/create/NewsSuccessPopupComponent";
import NewsImageMediaComponent from "../components/NewsImageMediaComponent";

import useCreateNew from "../services/useCreateNew";
import useNewsEvents from "../services/useNewsEvents";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export default function CreateNewScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const { createNew, loading: creating } = useCreateNew();
  const { events } = useNewsEvents();

  async function handleSelectImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const fileInfo: any = await getInfoAsync(asset.uri);

      if (fileInfo?.size && fileInfo.size > MAX_IMAGE_BYTES) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }

      setImageUri(asset.uri);
    }
  }

  function handleDeleteImage() {
    setImageUri(null);
  }

  async function handleSubmit() {
    const result = await createNew({
      title,
      body,
      imageUri,
      eventId: selectedEventId,
    });

    if (result.ok) {
      setSuccessVisible(true);
    }
  }

  function handleSuccessClose() {
    setSuccessVisible(false);
    router.back();
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Crear noticia</Text>

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
            imageUri={imageUri}
            onSelectImage={handleSelectImage}
            onDeleteImage={imageUri ? handleDeleteImage : undefined}
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
            style={[styles.btn, creating && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={creating}
            activeOpacity={0.9}
          >
            {creating ? (
              <ActivityIndicator color={COLORS.backgroundLight} />
            ) : (
              <Text style={styles.btnText}>Crear noticia</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Footer />

        <NewsSuccessPopupComponent
          visible={successVisible}
          title="Éxito"
          message="Noticia creada correctamente."
          onClose={handleSuccessClose}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
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
});
