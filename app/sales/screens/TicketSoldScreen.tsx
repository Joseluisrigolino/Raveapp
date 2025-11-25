// owner/TicketsSoldScreen.tsx
import React from "react";
import { ScrollView, View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS } from "@/styles/globalStyles";

import useTicketsSoldByEvent from "../services/useTicketsSoldByEvent";
import TicketsSoldHeaderComponent from "../components/tickets/TicketsSoldHeaderComponent";
import TicketsSoldCardListComponent from "../components/tickets/TicketsSoldCardListComponent";
import TicketsSoldTotalsComponent from "../components/tickets/TicketsSoldTotalsComponent";
import TicketsSoldNotFoundComponent from "../components/tickets/TicketsSoldNotFoundComponent";
import TicketsSoldBackButtonComponent from "../components/tickets/TicketsSoldBackButtonComponent";

export default function TicketSoldScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const eventId = id ? String(id) : undefined;
  const { data, loading } = useTicketsSoldByEvent(eventId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <TicketsSoldNotFoundComponent />
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TicketsSoldHeaderComponent
          eventName={data.eventName}
          lastUpdate={data.lastUpdate}
        />

        <TicketsSoldCardListComponent rows={data.rows} />

        <TicketsSoldTotalsComponent
          totalTickets={data.totalTickets}
          totalRevenue={data.totalRevenue}
        />

        <TicketsSoldBackButtonComponent onPress={() => router.back()} />
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
