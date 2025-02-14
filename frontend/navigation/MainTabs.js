// navigation/MainTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

import DiseasePredictionScreen from "../screens/DiseasePredictionScreen";
import ChatScreen from "../screens/ChatScreen";
import GovernmentSchemesScreen from "../screens/GovernmentSchemesScreen";
import WeatherScreen from "../screens/WeatherScreen";
import RentalsScreen from "../screens/RentalsScreen";

const Tab = createBottomTabNavigator();

const MainTabs = ({ route }) => {
  // Read the initial tab from route params (default to "Disease Prediction")
  const initialTab = route.params?.initialTab || "Disease Prediction";

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      detachInactiveScreens={false} // Keeps inactive tabs mounted
      screenOptions={({ route }) => ({
        unmountOnBlur: false, // Prevents tabs from unmounting when not focused
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "";
          if (route.name === "Disease Prediction") {
            // Both platforms use the same valid Ionicons v5 names.
            iconName = focused ? "analytics" : "analytics-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Schemes") {
            iconName = focused ? "newspaper" : "newspaper-outline";
          } else if (route.name === "Weather") {
            iconName = focused ? "cloud" : "cloud-outline";
          } else if (route.name === "Rentals") {
            iconName = focused ? "home" : "home-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "green",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Disease Prediction"
        component={DiseasePredictionScreen}
      />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Schemes" component={GovernmentSchemesScreen} />
      <Tab.Screen name="Weather" component={WeatherScreen} />
      <Tab.Screen name="Rentals" component={RentalsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
