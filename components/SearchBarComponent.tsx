import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

const SearchBarComponent = () => {
  return (
    <View style={styles.searchBarContainer}>
      <IconButton
        icon="magnify"
        size={30}
        onPress={() => console.log('Buscar presionado')}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
});

export default SearchBarComponent;
