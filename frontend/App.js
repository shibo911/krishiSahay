import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

// Replace with your backend URL (ensure your device/network configuration is correct)
const BACKEND_URL = "http://192.168.152.101:5000";

//
// DiseasePredictionScreen: Allows the user to pick an image, display it, and call your prediction API.
//
function DiseasePredictionScreen() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pick an image from the device gallery
  const pickImage = async () => {
    console.log("Requesting media library permissions...");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission result:", permissionResult);
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    console.log("Launching image library...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    console.log("Image picker result:", result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      console.log("Selected image URI:", uri);
      setImage(uri);
      setPrediction(null);
      setAdditionalInfo(null);
    } else {
      console.log("No image selected.");
    }
  };

  // Upload the image to your backend for prediction and then fetch additional info
  const uploadImage = async () => {
    if (!image) return;
    setLoading(true);
    let formData = new FormData();
    formData.append("image", {
      uri: image,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Prediction response:", data);
      setPrediction(data.predicted_disease);

      // Based on the predicted disease, fetch additional info:
      if (data.predicted_disease.includes("Healthy")) {
        // Call the healthy advice API
        const adviceResponse = await fetch(`${BACKEND_URL}/healthy_advice`);
        const adviceData = await adviceResponse.json();
        setAdditionalInfo(adviceData.advice);
      } else {
        // Call the disease info API
        const diseaseInfoResponse = await fetch(
          `${BACKEND_URL}/disease_info?disease_name=${encodeURIComponent(
            data.predicted_disease
          )}`
        );
        const diseaseInfoData = await diseaseInfoResponse.json();
        setAdditionalInfo(diseaseInfoData.disease_info);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading image or fetching additional info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>KrishiSahay: Crop Disease Prediction</Text>
      <Button title="Pick an Image" onPress={pickImage} />
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 300, height: 300, marginVertical: 20 }}
        />
      )}
      {image && (
        <Button
          title="Upload and Predict"
          onPress={uploadImage}
          disabled={loading}
        />
      )}
      {loading && <ActivityIndicator size="large" color="#2196F3" />}
      {prediction && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.predictionText}>
            Prediction: {prediction}
          </Text>
        </View>
      )}
      {additionalInfo && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.additionalInfoText}>
            {additionalInfo}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

//
// ChatScreen: Provides a chat interface to ask questions about crops.
//
function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, newUserMessage]);
    const prompt = userInput;
    setUserInput("");

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      const botMessage = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      alert("Error sending message");
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>
        {item.role === "user" ? "You" : "KrishiSahay"}: {item.content}
      </Text>
    </View>
  );

  return (
    <View style={styles.chatContainer}>
      <Text style={styles.title}>Chat with KrishiSahay</Text>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        style={styles.chatList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question about crops..."
          value={userInput}
          onChangeText={setUserInput}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

//
// Main App: Uses a bottom tab navigator to switch between screens.
//
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Disease Prediction"
          component={DiseasePredictionScreen}
        />
        <Tab.Screen name="Chat" component={ChatScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

//
// Styles
//
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  predictionText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  additionalInfoText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  chatList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f0f0",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
