// app/main/TicketsScreens/TicketPurchasedScreen.tsx
import React, { useRef } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import CirculoCarga from "@/components/common/CirculoCarga";

import {
  COLORS,
  FONT_SIZES,
  FONTS,
} from "@/styles/globalStyles";

import { useTicketPurchasedScreen } from "@/app/tickets/services/useTicketPurchasedScreen";
import TicketPurchasedBody from "@/app/tickets/components/purchased/TicketPurchasedBodyComponent";

function TicketPurchasedScreenContent() {
  const qrRefs = useRef<Record<string, any>>({});
  const {
    loading,
    eventData,
    ticketsCount,
    entries,
    addressDisplay,
    allControlled,
    allPendingForSelection,
    allCanceledForSelection,
    fiestaIdForReview,
    userReview,
    showReview,
    setShowReview,
    rating,
    setRating,
    comment,
    setComment,
    submitting,
    deleting,
    readOnlyReview,
    setReadOnlyReview,
    handleSubmitReview,
    showRefund,
    setShowRefund,
    refundChecked,
    setRefundChecked,
    refundBlockedReason,
    refundSubmitting,
    showRefundSuccess,
    setShowRefundSuccess,
    refundAmount,
    handleRefundStart,
    handleRefundConfirm,
    handleDownloadAll,
    openMapsDirections,
    formatDateEs,
    formatTicketCode,
    isCanceledEntry,
  } = useTicketPurchasedScreen();

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <CirculoCarga visible text="Cargando entradas..." />
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            Ticket no encontrado.
          </Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Mis Entradas" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TicketPurchasedBody
          eventData={eventData}
          ticketsCount={ticketsCount}
          entries={entries}
          addressDisplay={addressDisplay}
          allControlled={allControlled}
          allPendingForSelection={allPendingForSelection}
          allCanceledForSelection={allCanceledForSelection}
          fiestaIdForReview={fiestaIdForReview}
          userReview={userReview}
          showReview={showReview}
          setShowReview={setShowReview}
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          submitting={submitting}
          deleting={deleting}
          readOnlyReview={readOnlyReview}
          setReadOnlyReview={setReadOnlyReview}
          handleSubmitReview={handleSubmitReview}
          showRefund={showRefund}
          setShowRefund={setShowRefund}
          refundChecked={refundChecked}
          setRefundChecked={setRefundChecked}
          refundBlockedReason={refundBlockedReason}
          refundSubmitting={refundSubmitting}
          showRefundSuccess={showRefundSuccess}
          setShowRefundSuccess={setShowRefundSuccess}
          refundAmount={refundAmount}
          handleRefundStart={handleRefundStart}
          handleRefundConfirm={handleRefundConfirm}
          handleDownloadAll={() => handleDownloadAll(qrRefs)}
          openMapsDirections={openMapsDirections}
          formatDateEs={formatDateEs}
          formatTicketCode={formatTicketCode}
          isCanceledEntry={isCanceledEntry}
          qrRefs={qrRefs}
        />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

export default function TicketPurchasedScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <TicketPurchasedScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  loaderWrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
});
