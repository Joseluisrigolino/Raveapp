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
import { useAuth } from "@/app/auth/AuthContext";

export default function EventTicketSalesMenuScreen() {
  const router = useRouter();
  const { id: ownerIdParam } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth() as any;

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

  // Detectar si el usuario es administrador
  const isAdmin = (() => {
    try {
      // roles puede ser array de objetos o de números
      if (Array.isArray(user?.roles)) {
        const roles = user.roles as any[];
        for (const r of roles) {
          const cd = Number(r?.cdRol ?? r?.cdrol ?? r);
          const ds = String(r?.dsRol ?? r?.nombre ?? r?.name ?? r ?? "").toLowerCase();
          if (Number.isFinite(cd) && cd === 1) return true;
          if (ds.includes("admin") || ds.includes("administrador")) return true;
        }
      }
      // cdRoles como array de números/cadenas
      if (Array.isArray(user?.cdRoles)) {
        const ids = (user.cdRoles as any[])
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n));
        if (ids.includes(1)) return true;
      }
      // flags directos
      if (user?.isAdmin || user?.esAdmin) return true;
      // fallback: algunos backends usan dsPerfil/dsRol en user directo
      const dsPerfil = String(user?.dsPerfil || user?.perfil || "").toLowerCase();
      if (dsPerfil.includes("admin") || dsPerfil.includes("administrador")) return true;
      return false;
    } catch {
      return false;
    }
  })();

  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('[sales] isAdmin:', isAdmin, 'roles:', user?.roles, 'cdRoles:', user?.cdRoles);
    } catch {}
  }

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
              showOwnerInfo={isAdmin}
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
