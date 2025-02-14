import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const FooterNavigation = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("DiseasePrediction")}>
        <FontAwesome name="medkit" size={24} color="#fff" />
        <Text style={styles.tabText}>Disease</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Chat")}>
        <FontAwesome name="comments" size={24} color="#fff" />
        <Text style={styles.tabText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Weather")}>
        <FontAwesome name="cloud" size={24} color="#fff" />
        <Text style={styles.tabText}>Weather</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("GovernmentSchemes")}>
        <FontAwesome name="info" size={24} color="#fff" />
        <Text style={styles.tabText}>Schemes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Rentals")}>
        <FontAwesome name="shopping-cart" size={24} color="#fff" />
        <Text style={styles.tabText}>Trade</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    backgroundColor: "#2E8B57",
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
  },
  tabText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
});

export default FooterNavigation;
