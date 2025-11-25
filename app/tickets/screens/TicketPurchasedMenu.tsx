// app/main/TicketsScreens/TicketsPurchasedMenu.tsx
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import FiltroMisTickets from "@/components/filters/FiltroMisTickets";

import { COLORS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

import { useTicketsPurchasedMenu } from "@/app/tickets/services/useTicketsPurchasedMenu";
import TicketsPurchasedList from "@/app/tickets/components/purchased/TicketsPurchasedListComponent";

function TicketsPurchasedMenuContent() {
  const router = useRouter();

  const {
    loading,
    error,
    sortedTickets,
    selectedEstadoIds,
    toggleEstadoFilter,
    clearEstadoFilter,
    userReviewsSet,
  } = useTicketsPurchasedMenu();

  const handlePressTicket = (item: TicketPurchasedMenuItem) => {
    const anyItem: any = item as any;
    const eventId = anyItem?.eventId ? String(anyItem.eventId) : undefined;
    const ticketsCount =
      typeof anyItem?.ticketsCount === "number" ? anyItem.ticketsCount : undefined;
    const idCompra = anyItem?.idCompra ? String(anyItem.idCompra) : undefined;
    const estadoCd =
      typeof anyItem?.estadoCd === "number" ? String(anyItem.estadoCd) : undefined;

    const route = {
      pathname: ROUTES.MAIN.TICKETS.PURCHASED,
      params: { id: item.id, eventId, count: ticketsCount, idCompra, estadoCd },
    };

    nav.push(router, route);
  };

  const handlePressReview = (item: TicketPurchasedMenuItem) => {
    const anyItem: any = item as any;
    const eventId = String(anyItem.eventId);
    const estadoCd =
      typeof anyItem?.estadoCd === "number" ? String(anyItem.estadoCd) : undefined;

    nav.push(router, {
      pathname: ROUTES.MAIN.TICKETS.PURCHASED,
      params: {
        id: item.id,
        eventId,
        idCompra: anyItem.idCompra,
        estadoCd,
        openReview: "1",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Mis entradas",
            route: ROUTES.MAIN.TICKETS.MENU,
            isActive: true,
          },
          {
            label: "Eventos favoritos",
            route: ROUTES.MAIN.EVENTS.FAV,
            isActive: false,
          },
        ]}
      />

      <FiltroMisTickets
        selectedEstadoIds={selectedEstadoIds}
        onToggleEstado={toggleEstadoFilter}
        onClear={clearEstadoFilter}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TicketsPurchasedList
          loading={loading}
          error={error}
          tickets={sortedTickets}
          userReviewsSet={userReviewsSet}
          onPressTicket={handlePressTicket}
          onPressReview={handlePressReview}
        />
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

export default function TicketsPurchasedMenu() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <TicketsPurchasedMenuContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingTop: 10,
    // dejar espacio extra para el footer y evitar solapamientos en pantallas con listas
    paddingBottom: 88,
    backgroundColor: COLORS.backgroundLight,
  },
});
