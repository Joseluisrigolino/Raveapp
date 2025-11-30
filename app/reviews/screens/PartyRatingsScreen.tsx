// app/owner/PartyRatingsScreen.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";

import usePartyRatings from "../services/usePartyRatings";
import PartyRatingsHeaderComponent from "../components/PartyRatingsHeaderComponent";
import PartyReviewCardComponent from "../components/PartyReviewCardComponent";

export default function PartyRatingsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const partyId = id ? decodeURIComponent(String(id)) : "";
  const router = require('expo-router').useRouter();

  const {
    loading,
    error,
    partyName,
    filteredReviews,
    search,
    setSearch,
    sort,
    toggleSort,
  } = usePartyRatings(partyId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {/* Botón Volver */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', margin: 16 }}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        {/* Usar el mismo ícono que en TicketPurchasedScreen */}
        <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.textPrimary} />
        <Text style={{ marginLeft: 8, fontSize: 16, color: COLORS.textPrimary }}>Volver</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <PartyRatingsHeaderComponent
          partyName={partyName}
          search={search}
          onChangeSearch={setSearch}
          sort={sort}
          onToggleSort={toggleSort}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredReviews.length === 0 ? (
          <Text style={styles.emptyText}>
            Todavía no hay reseñas para esta fiesta.
          </Text>
        ) : (
          <View style={{ gap: 14 }}>
            {filteredReviews.map((r) => (
              <PartyReviewCardComponent key={r.id} review={r} />
            ))}
          </View>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    color: COLORS.negative,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});
