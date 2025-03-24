// app/main/TicketsScreens/TicketsPurchasedMenu.tsx
// (o la ruta que uses en tu proyecto)

import React from "react";
import {
  SafeAreaView,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TabMenuComponent from "@/components/TabMenuComponent";
import TicketCardComponent from "@/components/TicketCardComponent";
import { COLORS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

/** Mock local o Helper real (aquí el mock local) */
const mockTickets: TicketPurchasedMenuItem[] = [
  {
    id: 1,
    imageUrl: "https://picsum.photos/200?random=1",
    eventName: "Nombre del evento 1",
    date: "Fecha del evento 1",
    description: "Descripción del evento 1, muy interesante.",
    isFinished: false,
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/200?random=2",
    eventName: "Nombre del evento 2",
    date: "Fecha del evento 2",
    description: "Descripción del evento 2, está finalizado.",
    isFinished: true,
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/200?random=3",
    eventName: "Nombre del evento 3",
    date: "Fecha del evento 3",
    description: "Descripción del evento 3, con DJs locales.",
    isFinished: false,
  },
  // ... Agrega más si quieres
];

export default function TicketsPurchasedMenu() {
  const router = useRouter();

  // Ordenar: primero los NO finalizados, luego los finalizados
  const sortedTickets = [...mockTickets].sort((a, b) => {
    if (a.isFinished && !b.isFinished) return 1;
    if (!a.isFinished && b.isFinished) return -1;
    return 0;
  });

  // Manejo del click en un ticket
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
        data={sortedTickets}
        keyExtractor={(item) => item.id.toString()}
        numColumns={1}
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
