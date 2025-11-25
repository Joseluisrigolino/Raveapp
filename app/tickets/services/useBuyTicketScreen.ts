// app/tickets/services/buy/useBuyTicketScreen.ts
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/app/auth/AuthContext";

import { useTicketData } from "./useTicketData";
import { useBuyerAndBilling } from "./useBuyerAndBilling";
import { useReservationAndPayment } from "./useReservationAndPayment";

export * from "@/app/tickets/types/BuyProps";

export function useBuyTicketScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id, selection, reservas } = useLocalSearchParams<{
    id?: string;
    selection?: string;
    reservas?: string;
  }>();

  const ticketData = useTicketData({
    user,
    id,
    selection,
    reservas,
  });

  const buyerBilling = useBuyerAndBilling({ user });

  const reservation = useReservationAndPayment({
    user,
    router,
    navigation,
    selectedTickets: ticketData.selectedTickets,
    entradasIndex: ticketData.entradasIndex,
    compIndex: ticketData.compIndex,
    subtotal: ticketData.subtotal,
    cargoServicio: ticketData.cargoServicio,
    activeReservas: ticketData.activeReservas,
    setActiveReservas: ticketData.setActiveReservas,
    persistBillingBeforeConfirm: buyerBilling.persistBillingBeforeConfirm,
  });

  return {
    // data evento / selección
    loading: ticketData.loading,
    eventData: ticketData.eventData,
    groupedSelection: ticketData.groupedSelection,
    subtotal: ticketData.subtotal,
    cargoServicio: ticketData.cargoServicio,
    total: ticketData.total,
    fechaLabel: ticketData.fechaLabel,

    // datos de usuario / domicilio
    buyerInfo: buyerBilling.buyerInfo,
    billingAddress: buyerBilling.billingAddress,
    handleBillingChange: buyerBilling.handleBillingChange,
    provinces: buyerBilling.provinces,
    municipalities: buyerBilling.municipalities,
    localities: buyerBilling.localities,
    provinceId: buyerBilling.provinceId,
    municipalityId: buyerBilling.municipalityId,
    showProvinces: buyerBilling.showProvinces,
    showMunicipalities: buyerBilling.showMunicipalities,
    showLocalities: buyerBilling.showLocalities,
    setShowProvinces: buyerBilling.setShowProvinces,
    setShowMunicipalities: buyerBilling.setShowMunicipalities,
    setShowLocalities: buyerBilling.setShowLocalities,
    handleSelectProvince: buyerBilling.handleSelectProvince,
    handleSelectMunicipality: buyerBilling.handleSelectMunicipality,
    handleSelectLocality: buyerBilling.handleSelectLocality,
    isBillingComplete: buyerBilling.isBillingComplete,

    // reserva / timer / pago
    isExpired: reservation.isExpired,
    progress: reservation.progress,
    timerLabel: reservation.timerLabel,
    acceptedTyc: reservation.acceptedTyc,
    toggleAcceptedTyc: reservation.toggleAcceptedTyc,
    isSubmitting: reservation.isSubmitting,
    canConfirm: reservation.canConfirm,
    handleConfirmPurchase: reservation.handleConfirmPurchase,
  };
}
