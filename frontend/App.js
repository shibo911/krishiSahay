// frontend/App.js
import React from "react";
import { ImageBackground } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MainTabs from "./navigation/MainTabs";
import StoreFinderScreen from "./screens/StoreFinderScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import styles from "./styles/styles";

const Stack = createStackNavigator();

export default function App() {
  return (
    <ImageBackground
      source={require("./assets/background.jpg")}
      style={[styles.background, { flex: 1 }]}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Store Finder" component={StoreFinderScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ImageBackground>
  );
}
