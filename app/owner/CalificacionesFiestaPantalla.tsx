import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CalificacionesFiestaPantalla() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Calificaciones de la fiesta</Text>
			<Text style={styles.subtitle}>Aquí verás las calificaciones otorgadas por los asistentes.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
	},
});
