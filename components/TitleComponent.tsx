import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Title } from 'react-native-paper';

const TitlePers = ({ text = ""}) => {

  return (
    <View style={styles.container}>
      <Title>{text}</Title>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

});

export default TitlePers;
