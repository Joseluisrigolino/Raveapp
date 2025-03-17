import React from "react";
import { SafeAreaView, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TabMenuComponent from "@/components/TabMenuComponent"; // Importa el mismo que usas en NewsScreen
import TicketCardComponent from "@/components/TicketCardComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getAllPurchasedTickets } from "@/utils/ticketMenuHelpers";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function TicketsPurchasedMenu() {
  const router = useRouter();

  const mockData: TicketPurchasedMenuItem[] = getAllPurchasedTickets();

  const handleTicketPress = (item: TicketPurchasedMenuItem) => {
    if (item.isFinished) {
      router.push(`/main/TicketsScreens/TicketFinalizedScreen?id=${item.id}`);
    } else {
      router.push(`/main/TicketsScreens/TicketPurchasedScreen?id=${item.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Subheader con TabMenuComponent, tal como en NewsScreen */}
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

      <FlatList
        data={mockData}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <TicketCardComponent
            item={item}
            onPress={() => handleTicketPress(item)}
          />
        )}
      />

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  flatListContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
});
