import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Paragraph } from 'react-native-paper';
import TitlePers from './TitleComponent';


const CardComponent = ({ title = "", text = "", foto = "" }) => (
  <View style={styles.container}>
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <TitlePers text={title} />
        <Paragraph>{text}</Paragraph>
      </Card.Content>
      <Card.Cover source={{ uri: foto }} />
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginTop: 10,
    marginBottom: 15,
    width: '100%',
  },
  cardContent: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    width: '100%',
  },
});

export default CardComponent;
