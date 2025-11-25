// app/tickets/screens/BuyTicketScreen.tsx
import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { EventItemWithExtras } from "@/app/events/apis/eventApi";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Hook de servicios (agrega toda la lógica pesada)
import { useBuyTicketScreen } from "@/app/tickets/services/useBuyTicketScreen";

// Componentes de la carpeta app/tickets/components/buy
import TimerBar from "../components/buy/TimerBarComponent";
import PurchaseSummaryCard from "@/app/tickets/components/buy/PurchaseSummaryCardComponent";
import PriceSummaryCard from "@/app/tickets/components/buy/PriceSummaryCardComponent";
import BuyerInfoSection from "@/app/tickets/components/buy/BuyerInfoSectionComponent";
import BillingAddressSection from "@/app/tickets/components/buy/BillingAddressSectionComponent";
import TycRow from "@/app/tickets/components/buy/TycRowComponent";

function BuyTicketScreenContent() {
  const {
    // estado general
    loading,
    eventData,
    // resumen de selección / precios
    groupedSelection,
    subtotal,
    cargoServicio,
    total,
    // datos de usuario
    buyerInfo,
    // domicilio
    billingAddress,
    handleBillingChange,
    provinces,
    municipalities,
    localities,
    provinceId,
    municipalityId,
    showProvinces,
    showMunicipalities,
    showLocalities,
    setShowProvinces,
    setShowMunicipalities,
    setShowLocalities,
    handleSelectProvince,
    handleSelectMunicipality,
    handleSelectLocality,
    isBillingComplete,
    // TyC / confirmación
    acceptedTyc,
    toggleAcceptedTyc,
    isSubmitting,
    handleConfirmPurchase,
    // timer
    timerLabel,
    timerProgress,
    isExpired,
    // helpers
    fechaLabel,
  } = useBuyTicketScreen();

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Evento no encontrado
  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>No se encontró el evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  const disabledConfirm =
    isExpired || !acceptedTyc || isSubmitting || !isBillingComplete;

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra de tiempo / reserva */}
        <TimerBar
          timerLabel={timerLabel}
          progress={timerProgress}
          isExpired={isExpired}
        />

        {/* Resumen de compra (evento + entradas) */}
        <PurchaseSummaryCard
          eventTitle={eventData.title}
          imageUrl={eventData.imageUrl}
          groupedSelection={groupedSelection}
          fechaLabel={fechaLabel}
        />

        {/* Resumen de precios global */}
        <PriceSummaryCard
          subtotal={subtotal}
          cargoServicio={cargoServicio}
          total={total}
        />

        {/* Datos del comprador (solo lectura) */}
        <BuyerInfoSection buyerInfo={buyerInfo} />

        {/* Domicilio de facturación (editable) */}
        <BillingAddressSection
          billingAddress={billingAddress}
          onChangeField={handleBillingChange}
          provinces={provinces}
          municipalities={municipalities}
          localities={localities}
          provinceId={provinceId}
          municipalityId={municipalityId}
          showProvinces={showProvinces}
          showMunicipalities={showMunicipalities}
          showLocalities={showLocalities}
          setShowProvinces={setShowProvinces}
          setShowMunicipalities={setShowMunicipalities}
          setShowLocalities={setShowLocalities}
          handleSelectProvince={handleSelectProvince}
          handleSelectMunicipality={handleSelectMunicipality}
          handleSelectLocality={handleSelectLocality}
          isBillingComplete={isBillingComplete}
        />

        {/* Aceptación TyC */}
        <TycRow acceptedTyc={acceptedTyc} toggleAcceptedTyc={toggleAcceptedTyc} />

        {/* Botón de confirmar compra */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            disabledConfirm && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmPurchase}
          disabled={disabledConfirm}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? "PROCESANDO…" : "CONFIRMAR COMPRA"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.notice}>
          Al confirmar compra, se te mostrará una confirmación antes de
          redirigirte a MercadoPago.
        </Text>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

export default function BuyTicketScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <BuyTicketScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.button,
  },
  notice: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
});
