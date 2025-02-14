// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LandingScreen from "./screens/LandingScreen";
import MainTabs from "./navigation/MainTabs";
import StoreFinderScreen from "./screens/StoreFinderScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
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
