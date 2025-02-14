// screens/LandingScreen.js
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const LandingScreen = ({ navigation }) => {
  // Menu items with route mappings.
  const menuItems = [
    { label: "Disease Prediction", route: "Disease Prediction" },
    { label: "Chat", route: "Chat" },
    { label: "Government Schemes", route: "Schemes" },
    { label: "Weather", route: "Weather" },
    { label: "AgriTrade", route: "Rentals" },
  ];

  // Animated values for title and each menu button.
  const titleAnim = useRef(new Animated.Value(0)).current;
  const menuAnims = useRef(menuItems.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate title: fade in and slide down.
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Staggered button animations: fade in and slide up.
    Animated.stagger(
      150,
      menuAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [titleAnim, menuAnims]);

  const handlePress = (routeName) => {
    // Navigate to MainTabs and pass the initialTab parameter.
    navigation.navigate("MainTabs", { initialTab: routeName });
  };

  return (
    <LinearGradient
      colors={["#4CAF50", "#8BC34A"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Welcome to Krishi Sahay
        </Animated.Text>
        {menuItems.map((item, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: menuAnims[index],
              transform: [
                {
                  translateY: menuAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => handlePress(item.route)}
            >
              <Text style={styles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  button: {
    width: width * 0.8, // All buttons are 80% of the screen width
    height: 60, // Fixed height for uniformity
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 30,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LandingScreen;
