// frontend/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { BACKEND_URL } from "../config";

const LoginScreen = ({ navigation }) => {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (data.message) {
        Alert.alert("Login", "Login successful!");
        navigation.navigate("Home");
      } else {
        Alert.alert("Login Error", data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Error", "An error occurred during login.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={loginForm.username}
        onChangeText={(text) => setLoginForm({ ...loginForm, username: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={loginForm.password}
        onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Go to Register" onPress={() => navigation.navigate("Register")} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 4, padding: 8, marginVertical: 10 },
});
