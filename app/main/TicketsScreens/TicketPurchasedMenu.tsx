import React from "react";
import { SafeAreaView, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TicketCardComponent from "@/components/TicketCardComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getAllPurchasedTickets } from "@/utils/ticketMenuHelpers"; // o tu array local

export default function TicketsPurchasedMenu() {
  const router = useRouter();

  // Datos de ejemplo (luego vendrán de tu API o un helper)
  const mockData: TicketPurchasedMenuItem[] = getAllPurchasedTickets();

  // Al pulsar una tarjeta de ticket, si isFinished => FinalizedScreen; si no => PurchasedScreen
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
  },
  flatListContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
});
