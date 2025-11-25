import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import BackBuyCardComponent from "@/app/tickets/components/back-buy/BackBuyCardComponent";
import useBackBuy from "@/app/tickets/services/useBackBuy";

export default function VueltaCompraPantalla() {
  const { processing, goToTickets } = useBackBuy();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header />
      <BackBuyCardComponent processing={processing} onGoToTickets={goToTickets} />
      <Footer />
    </SafeAreaView>
  );
}
