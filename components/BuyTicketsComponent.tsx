import * as React from "react";
import { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { DataTable } from "react-native-paper";

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
              <TouchableOpacity
                onPress={decreaseQuantity}
                style={styles.buttonQuantity}
              >
                <Text style={styles.buttonQuantityText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                onPress={increaseQuantity}
                style={styles.buttonQuantity}
              >
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
    padding: 10,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 95,
  },
  buttonQuantity: {
    backgroundColor: "#000000",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonQuantityText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BuyTicket;
