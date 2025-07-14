// app/main/TicketsScreens/TicketsPurchasedMenu.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import CardComponent from "@/components/events/CardComponent";

import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

const mockTickets: TicketPurchasedMenuItem[] = [
  {
    id: 1,
    imageUrl: "https://picsum.photos/400?random=1",
    eventName: "Nombre del evento 1",
    date: "25/10/2025",
    description: "Descripción del evento 1, muy interesante.",
    isFinished: false,
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/400?random=2",
    eventName: "Nombre del evento 2",
    date: "26/10/2025",
    description: "Descripción del evento 2, está finalizado.",
    isFinished: true,
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/400?random=3",
    eventName: "Nombre del evento 3",
    date: "27/10/2025",
    description: "Descripción del evento 3, con DJs locales.",
    isFinished: false,
  },
];

function TicketsPurchasedMenuContent() {
  const router = useRouter();

  const sortedTickets = [...mockTickets].sort((a, b) =>
    a.isFinished === b.isFinished ? 0 : a.isFinished ? 1 : -1
  );

  const handlePress = (item: TicketPurchasedMenuItem) => {
    const route = item.isFinished
      ? `/main/TicketsScreens/TicketFinalizedScreen?id=${item.id}`
      : `/main/TicketsScreens/TicketPurchasedScreen?id=${item.id}`;
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Mis tickets",
            route: "/main/TicketsScreens/TicketPurchasedMenu",
            isActive: true,
          },
          {
            label: "Eventos favoritos",
            route: "/main/EventsScreens/FavEventScreen",
            isActive: false,
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sortedTickets.length === 0 ? (
          <Text style={styles.noItemsText}>
            No tienes tickets comprados.
          </Text>
        ) : (
          <View style={styles.containerCards}>
            {sortedTickets.map((item) => (
              <CardComponent
                key={item.id}
                title={item.eventName}
                text={item.description}
                date={item.date}
                foto={item.imageUrl}
                onPress={() => handlePress(item)}
              />
            ))}
          </View>
        )}
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
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  containerCards: {
    marginTop: 0,
    paddingHorizontal: 12,
    rowGap: 16,
  },
  noItemsText: {
    marginTop: 20,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
