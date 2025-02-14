import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LandingPage from "./screens/LandingScreen";
import DiseasePredictionScreen from "./screens/DiseasePredictionScreen";
import ChatScreen from "./screens/ChatScreen";
import WeatherScreen from "./screens/WeatherScreen";
import GovernmentSchemesScreen from "./screens/GovernmentSchemesScreen";
import RentalsScreen from "./screens/RentalsScreen"; // Ensure this exists
import StoreFinderScreen from "./screens/StoreFinderScreen"; // Import StoreFinderScreen

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Landing" 
          component={LandingPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="DiseasePrediction" 
          component={DiseasePredictionScreen} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
        />
        <Stack.Screen 
          name="Weather" 
          component={WeatherScreen} 
        />
        <Stack.Screen 
          name="GovernmentSchemes" 
          component={GovernmentSchemesScreen} 
        />
        <Stack.Screen 
          name="Rentals" 
          component={RentalsScreen} 
        />
        <Stack.Screen 
          name="StoreFinderScreen" 
          component={StoreFinderScreen} 
          options={{ title: "Store Finder" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
