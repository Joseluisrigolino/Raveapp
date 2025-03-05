import React from "react";
import { View, Text, StyleSheet } from "react-native";
// Si usas Expo, puedes hacer: import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from "@expo/vector-icons";


import { ReviewItem } from "@/interfaces/ReviewProps";

interface ReviewComponentProps {
  /** Lista de reseñas a mostrar */
  reviews: ReviewItem[];
}

/**
 * Muestra una sección de "Reseñas" con:
 * - Promedio de rating + estrellas
 * - Cantidad de opiniones
 * - Listado de reseñas con usuario, estrellas, "Hace X días" y comentario
 */
export default function ReviewComponent({ reviews }: ReviewComponentProps) {
  // Calculamos el promedio
  const totalRatings = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

  // Función para renderizar las estrellas (hasta 5)
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name="star"
          size={16}
          color={i <= rating ? "#FFD700" : "#ccc"}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Encabezado: "Reseñas del evento", promedio, estrellas y cantidad de opiniones */}
      <Text style={styles.sectionTitle}>Reseñas del evento</Text>
      <View style={styles.headerRow}>
        <Text style={styles.averageRating}>{avgRating.toFixed(1)}</Text>
        {renderStars(Math.round(avgRating))}
        <Text style={styles.opinionsCount}>
          {reviews.length} {reviews.length === 1 ? "opinión" : "opiniones"}
        </Text>
      </View>

      {/* Si no hay reseñas */}
      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>No hay reseñas todavía</Text>
      ) : (
        // Listado de reseñas
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.user}>{review.user}</Text>
              {renderStars(review.rating)}
              <Text style={styles.daysAgo}>Hace {review.daysAgo} días</Text>
            </View>
            <Text style={styles.comment}>{review.comment}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    // Puedes agregar sombra u otros estilos si deseas
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  averageRating: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 4,
  },
  starsRow: {
    flexDirection: "row",
    marginRight: 8,
  },
  opinionsCount: {
    fontSize: 14,
    color: "#666",
  },
  noReviews: {
    fontStyle: "italic",
    color: "#666",
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  user: {
    fontWeight: "bold",
    marginRight: 8,
  },
  daysAgo: {
    marginLeft: "auto",
    fontSize: 12,
    color: "#888",
  },
  comment: {
    fontSize: 14,
    color: "#333",
  },
});
