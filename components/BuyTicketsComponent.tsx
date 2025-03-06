import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { DataTable } from "react-native-paper";

// Importa tus estilos
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const BuyTicket = () => {
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  return (
    <View style={styles.container}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Ticket</DataTable.Title>
          <DataTable.Title numeric>Precio</DataTable.Title>
          <DataTable.Title numeric>Cantidad</DataTable.Title>
        </DataTable.Header>

        <DataTable.Row>
          <DataTable.Cell>Early Bird</DataTable.Cell>
          <DataTable.Cell numeric>2000</DataTable.Cell>
          <DataTable.Cell numeric>
            <View style={styles.counterContainer}>
              <TouchableOpacity onPress={decreaseQuantity} style={styles.buttonQuantity}>
                <Text style={styles.buttonQuantityText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={increaseQuantity} style={styles.buttonQuantity}>
                <Text style={styles.buttonQuantityText}>+</Text>
              </TouchableOpacity>
            </View>
          </DataTable.Cell>
        </DataTable.Row>
      </DataTable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderInput, // "#ccc"
    padding: 10,
    backgroundColor: COLORS.cardBg,  // Blanco
    borderRadius: RADIUS.card,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 95,
  },
  buttonQuantity: {
    backgroundColor: COLORS.textPrimary, // "#000"
    padding: 5,
    borderRadius: RADIUS.card,
    marginHorizontal: 10,
  },
  buttonQuantityText: {
    fontSize: FONT_SIZES.button, // 16-18
    color: COLORS.cardBg,        // "#fff"
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: FONT_SIZES.body,   // 14-16
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
});

export default BuyTicket;
