// navigation/MainTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DiseasePredictionScreen from "../screens/DiseasePredictionScreen";
import ChatScreen from "../screens/ChatScreen";
import GovernmentSchemesScreen from "../screens/GovernmentSchemesScreen";
import WeatherScreen from "../screens/WeatherScreen";
import RentalsScreen from "../screens/RentalsScreen";

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Disease Prediction") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Schemes") {
            iconName = focused ? "document-text" : "document-text-outline";
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
