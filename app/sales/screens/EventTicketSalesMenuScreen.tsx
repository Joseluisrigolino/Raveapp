import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBar from "@/components/common/SearchBarComponent";
import ManageEventsStatusChipsComponent from "@/app/sales/components/manage/ManageEventsStatusChipsComponent";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { COLORS } from "@/styles/globalStyles";

import useManageSalesEvents from "../services/useManageSalesEvents";
import ManageEventsHeaderComponent from "@/app/sales/components/manage/ManageEventsHeaderComponent";
// Visual filter: use the same chips component as TicketPurchasedMenu (FiltroMisTickets)
import ManageEventsEmptyStateComponent from "@/app/sales/components/manage/ManageEventsEmptyStateComponent";
import ManageEventsListItemComponent from "@/app/sales/components/manage/ManageEventsListItemComponent";

export default function EventTicketSalesMenuScreen() {
  const router = useRouter();
  const { id: ownerIdParam } = useLocalSearchParams<{ id?: string }>();

  const {
    loading,
    error,
    filteredEvents,
    search,
    filterStatus,
    setSearch,
    setFilterStatus,
    reload,
  } = useManageSalesEvents(ownerIdParam);

  const goReport = (id: string) => {
    nav.push(router, {
      pathname: ROUTES.OWNER.TICKET_SOLD_EVENT,
      params: { id },
    });
  };

  const goManageEvents = () => {
    nav.push(router, { pathname: ROUTES.OWNER.MANAGE_EVENTS });
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <ManageEventsHeaderComponent />

        <ManageEventsStatusChipsComponent
          value={filterStatus}
          onChange={setFilterStatus}
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar eventos..."
        />

        {loading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filteredEvents.length === 0 ? (
          <ManageEventsEmptyStateComponent
            onPressGoToManage={goManageEvents}
          />
        ) : (
          filteredEvents.map((e) => (
            <ManageEventsListItemComponent
              key={String(e.id)}
              event={e}
              onPress={() => goReport(String(e.id))}
            />
          ))
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16, paddingBottom: 24 },
  error: {
    color: COLORS.negative,
    textAlign: "center",
    marginTop: 16,
  },
});
