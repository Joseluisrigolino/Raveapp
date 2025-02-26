import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";

const reviews = [
  {
    user: "Usuario5",
    rating: 4,
    daysAgo: 5,
    comment: "Me gusto mucho la fiesta. Gente muy agradable. Volveria a ir",
  },
  {
    user: "Usuario99",
    rating: 5,
    daysAgo: 6,
    comment: "Excelente evento",
  },
];

const ReviewComponent = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reseñas del evento 4.9</Text>
        <Text style={styles.opinions}>50 opiniones</Text>
      </View>
      <View style={styles.starsContainer}>{renderStars(4.9)}</View>
      <View style={styles.separator} />
      {reviews.map((review, index) => (
        <View key={index}>
          <Text style={styles.username}>{review.user}</Text>
          <View style={styles.reviewInfo}>
            <View style={styles.starsContainer}>{renderStars(review.rating)}</View>
            <Text style={styles.daysAgo}>{review.daysAgo} días</Text>
          </View>
          <Text style={styles.comment}>&quot;{review.comment}&quot;</Text>
          <View style={styles.separator} />
        </View>
      ))}
    </View>
  );
};

const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Icon
        key={i}
        source={i <= rating ? "star" : "star-outline"}
        color={i <= rating ? "gold" : "gray"}
        size={20}
      />
    );
  }
  return stars;
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  opinions: {
    fontSize: 14,
    color: "gray",
  },
  starsContainer: {
    flexDirection: "row",
    marginVertical: 5,
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysAgo: {
    marginLeft: 10,
    color: "gray",
  },
  comment: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default ReviewComponent;