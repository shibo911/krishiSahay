import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

// Replace with your backend URL (ensure your device/network configuration is correct)
const BACKEND_URL = "http://192.168.126.65:5000";

//
// DiseasePredictionScreen: Allows the user to pick an image, capture an image, display it, 
// and call your prediction API.
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

  // Capture an image using the device camera
  const captureImage = async () => {
    console.log("Requesting camera permissions...");
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    console.log("Camera permission result:", permissionResult);
    if (!permissionResult.granted) {
      alert("Permission to access camera is required!");
      return;
    }

    console.log("Launching camera...");
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    console.log("Camera capture result:", result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      console.log("Captured image URI:", uri);
      setImage(uri);
      setPrediction(null);
      setAdditionalInfo(null);
    } else {
      console.log("No image captured.");
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
      <View style={{ marginVertical: 10 }} />
      <Button title="Capture an Image" onPress={captureImage} />
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
          <Text style={styles.predictionText}>Prediction: {prediction}</Text>
        </View>
      )}
      {additionalInfo && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.additionalInfoText}>{additionalInfo}</Text>
        </View>
      )}
    </ScrollView>
  );
}

//
// ChatScreen: Provides a chat interface to ask questions about crops.
// When the AI responds, its text answer is displayed along with a small speaker button (🔊).
// Clicking the speaker icon will play the audio version of the response if available,
// otherwise it will read the response aloud using text-to-speech.
// A mic button is also provided to allow voice recording, which is sent to the backend for processing.
//
function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedURI, setRecordedURI] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone is required!");
      }
    })();
  }, []);

  const playAudio = async (audioUri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      await sound.playAsync();
    } catch (err) {
      console.error("Error playing audio", err);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, newUserMessage]);
    const prompt = userInput;
    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      console.log("Chat response:", data);

      // Create a bot message with the text response and optional audio response
      const botMessage = {
        role: "assistant",
        content: data.response,
        audio: data.audio_response || "",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      alert("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const sendAudioMessage = async (uri) => {
    setLoading(true);
    let formData = new FormData();
    formData.append("audio", {
      uri: uri,
      name: "recording.m4a",
      type: "audio/m4a",
    });

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Audio chat response:", data);
      const botMessage = {
        role: "assistant",
        content: data.response,
        audio: data.audio_response || "",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      alert("Error sending audio message");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setRecordedURI(null);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      setRecordedURI(uri);
      setRecording(null);
      // Send the recorded audio to the backend
      await sendAudioMessage(uri);
    } catch (error) {
      console.error("Error stopping recording", error);
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
      {item.role === "assistant" && (
        <TouchableOpacity
          onPress={() =>
            item.audio ? playAudio(item.audio) : Speech.speak(item.content)
          }
          style={styles.speakerButton}
        >
          <Text style={styles.speakerButtonText}>🔊</Text>
        </TouchableOpacity>
      )}
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
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.micButton}
        >
          <Text style={styles.micButtonText}>
            {isRecording ? "Stop" : "🎤"}
          </Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#2196F3" />}
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
    backgroundColor: "#F0FFF0", // light, earthy background (Honeydew)
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#F0FFF0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: "#2E8B57", // sea green for titles
  },
  predictionText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#2E8B57",
  },
  additionalInfoText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
    color: "#556B2F",
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
    flexDirection: "row",
    alignItems: "center",
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
    flex: 1,
  },
  speakerButton: {
    marginLeft: 5,
    padding: 5,
    backgroundColor: "#2E8B57",
    borderRadius: 20,
  },
  speakerButtonText: {
    color: "#fff",
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
    backgroundColor: "#6B8E23", // olive drab for send button
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  micButton: {
    backgroundColor: "#228B22", // forest green for mic button
    padding: 10,
    borderRadius: 20,
    marginLeft: 5,
  },
  micButtonText: {
    color: "#fff",
    fontSize: 20,
  },
});
