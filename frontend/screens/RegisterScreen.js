// frontend/screens/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { BACKEND_URL } from "../config";

const RegisterScreen = ({ navigation }) => {
  const [registerForm, setRegisterForm] = useState({ username: "", password: "" });

  const handleRegister = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (data.message) {
        Alert.alert("Registration", "Registration successful! Please login.");
        navigation.navigate("Login");
      } else {
        Alert.alert("Registration Error", data.error || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Error", "An error occurred during registration.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={registerForm.username}
        onChangeText={(text) => setRegisterForm({ ...registerForm, username: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={registerForm.password}
        onChangeText={(text) => setRegisterForm({ ...registerForm, password: text })}
      />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Go to Login" onPress={() => navigation.navigate("Login")} />
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 4, padding: 8, marginVertical: 10 },
});
