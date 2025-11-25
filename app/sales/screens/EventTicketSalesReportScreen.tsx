import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS } from "@/styles/globalStyles";

import useEventSalesReport from "../services/useEventSalesReport";
import EventSalesHeaderComponent from "@/app/sales/components/event/EventSalesHeaderComponent";
import EventSalesDaySectionComponent from "@/app/sales/components/event/EventSalesDaySectionComponent";
import EventSalesGrandTotalsComponent from "@/app/sales/components/event/EventSalesGrandTotalsComponent";
import EventOwnerInfoComponent from "@/app/sales/components/event/EventOwnerInfoComponent";

export default function EventTicketSalesReportScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const {
    loading,
    refreshing,
    error,
    report,
    infoText,
    isAdmin,
    grandTotals,
    ownerUser,
    ownerError,
    domicilioFmt,
    onRefresh,
    reload,
  } = useEventSalesReport(id);

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EventSalesHeaderComponent
          eventName={report?.evento?.nombre}
          infoText={infoText}
          onReload={reload}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Cargando reporte…</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !report?.dias?.length ? (
          <Text style={styles.emptyText}>
            No hay información de ventas.
          </Text>
        ) : (
          <>
            {report.dias.map((d, idx) => (
              <EventSalesDaySectionComponent
                key={`${d.fecha}-${idx}`}
                day={d}
                isAdmin={isAdmin}
              />
            ))}

            <EventSalesGrandTotalsComponent
              totals={grandTotals}
              isAdmin={isAdmin}
            />

            {isAdmin && <View style={styles.sectionDivider} />}

            {isAdmin && (
              <EventOwnerInfoComponent
                ownerUser={ownerUser}
                ownerError={ownerError}
                domicilio={domicilioFmt}
              />
            )}
          </>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16, paddingBottom: 24 },

  loadingBox: { paddingVertical: 20, alignItems: "center" },
  loadingText: { marginTop: 8, color: COLORS.textSecondary },
  errorText: {
    color: COLORS.alert,
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 24,
    borderRadius: 1,
  },
});
