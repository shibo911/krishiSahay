import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Ensure expo/vector-icons is installed
import { useNavigation } from "@react-navigation/native";

const LandingPage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Logo & Title */}
      <Image 
        source={require("../assets/logo.webp")} // Update path if needed
        style={styles.logo} 
      />
      <Text style={styles.title}>KrishiSahay</Text>

      {/* Navigation Buttons */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("DiseasePrediction")}
      >
        <FontAwesome name="medkit" size={24} color="white" />
        <Text style={styles.buttonText}>Disease Prediction</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("Chat")}
      >
        <FontAwesome name="comments" size={24} color="white" />
        <Text style={styles.buttonText}>Farm Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("Weather")}
      >
        <FontAwesome name="cloud" size={24} color="white" />
        <Text style={styles.buttonText}>Weather Forecast</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("GovernmentSchemes")}
      >
        <FontAwesome name="info" size={24} color="white" />
        <Text style={styles.buttonText}>Govt. Schemes</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("Rentals")}
      >
        <FontAwesome name="shopping-cart" size={24} color="white" />
        <Text style={styles.buttonText}>Rentals</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#2E8B57",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center icon and text together
    backgroundColor: "#2E8B57", // Green theme
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50, // Oval (pill-shaped)
    width: "100%",
    marginVertical: 8,
    // iOS shadow for 3D effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Android elevation for 3D effect
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10, // Space between icon and text
    fontWeight: "600",
  },
});

export default LandingPage;
