import React from "react";
import { SafeAreaView, FlatList, StyleSheet } from "react-native";
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TicketCardComponent from "@/components/TicketCardComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

export default function TicketsPurchasedMenu() {
  // Datos de ejemplo (luego vendrán de tu API)
  const mockData: TicketPurchasedMenuItem[] = [
    {
      id: 1,
      imageUrl: "https://picsum.photos/200?random=1",
      eventName: "Nombre del evento 1",
      date: "Fecha del evento 1",
      isFinished: false,
    },
    {
      id: 2,
      imageUrl: "https://picsum.photos/200?random=2",
      eventName: "Nombre del evento 2",
      date: "Fecha del evento 2",
      isFinished: true,
    },
    {
      id: 3,
      imageUrl: "https://picsum.photos/200?random=3",
      eventName: "Nombre del evento 3",
      date: "Fecha del evento 3",
      isFinished: false,
    },
    {
      id: 4,
      imageUrl: "https://picsum.photos/200?random=4",
      eventName: "Nombre del evento 4",
      date: "Fecha del evento 4",
      isFinished: false,
    },
    {
      id: 5,
      imageUrl: "https://picsum.photos/200?random=5",
      eventName: "Nombre del evento 5",
      date: "Fecha del evento 5",
      isFinished: true,
    },
    {
      id: 6,
      imageUrl: "https://picsum.photos/200?random=6",
      eventName: "Nombre del evento 6",
      date: "Fecha del evento 6",
      isFinished: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <FlatList
        data={mockData}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Aquí definimos cuántas columnas queremos
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => <TicketCardComponent item={item} />}
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
