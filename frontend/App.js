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
import * as Speech from "expo-speech";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Replace with your backend URL
const BACKEND_URL = "http://172.70.110.142:5000";

//
// DiseasePredictionScreen: Lets the user pick or capture an image, uploads it for prediction,
// fetches additional info, and then (silently) gets the recommended store type for remedy products.
// A button is displayed that navigates to the Store Finder (with the recommended store type) without
// revealing the recommendation to the user.
//
function DiseasePredictionScreen() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [recommendedStoreType, setRecommendedStoreType] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setPrediction(null);
      setAdditionalInfo(null);
      setRecommendedStoreType(null);
    }
  };

  const captureImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setPrediction(null);
      setAdditionalInfo(null);
      setRecommendedStoreType(null);
    }
  };

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
      setPrediction(data.predicted_disease);
      // Fetch additional info based on prediction
      if (data.predicted_disease.toLowerCase().includes("healthy")) {
        const adviceResponse = await fetch(`${BACKEND_URL}/healthy_advice`);
        const adviceData = await adviceResponse.json();
        setAdditionalInfo(adviceData.advice);
      } else {
        const diseaseInfoResponse = await fetch(
          `${BACKEND_URL}/disease_info?disease_name=${encodeURIComponent(
            data.predicted_disease
          )}`
        );
        const diseaseInfoData = await diseaseInfoResponse.json();
        setAdditionalInfo(diseaseInfoData.disease_info);
      }
      // Now, silently fetch the recommended store type for this disease
      const storeTypeResponse = await fetch(
        `${BACKEND_URL}/recommended_store_type?disease_name=${encodeURIComponent(
          data.predicted_disease
        )}`
      );
      const storeTypeData = await storeTypeResponse.json();
      if (storeTypeData.store_type) {
        setRecommendedStoreType(storeTypeData.store_type);
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
          <Text style={styles.predictionText}>
            Prediction: {prediction}
          </Text>
        </View>
      )}
      {additionalInfo && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.additionalInfoText}>{additionalInfo}</Text>
        </View>
      )}
      {/* The recommended store type is not shown to the user */}
      {recommendedStoreType && (
        <View style={{ marginTop: 20 }}>
          <Button
            title="Find Local Stores"
            onPress={() =>
              navigation.navigate("Store Finder", {
                storeType: recommendedStoreType,
              })
            }
          />
        </View>
      )}
    </ScrollView>
  );
}

//
// ChatScreen: Chat interface with text and audio messaging.
//
function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
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
        body: JSON.stringify({ prompt, read_aloud: true, language: "en" }),
      });
      const data = await response.json();
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
      if (data.user_transcription) {
        const userMessage = {
          role: "user",
          content: data.user_transcription,
        };
        setMessages((prev) => [...prev, userMessage]);
      }
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setRecording(null);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
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
// StoreFinderScreen: Uses location services to get the user’s coordinates,
// accepts an optional recommended store type (passed as "storeType") from navigation,
// calls the backend /store_finder endpoint (now using GoMaps.pro Text Search API),
// and displays a map with store markers.
//
function StoreFinderScreen({ route }) {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const storeType = route.params?.storeType || null;

  const fetchStores = async (lat, lon) => {
    setLoading(true);
    try {
      const url = storeType
        ? `${BACKEND_URL}/store_finder?lat=${lat}&lon=${lon}&store_type=${storeType}`
        : `${BACKEND_URL}/store_finder?lat=${lat}&lon=${lon}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setStores(data.stores);
      }
    } catch (error) {
      console.error("Error fetching stores", error);
      alert("Failed to fetch store data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchStores(loc.coords.latitude, loc.coords.longitude);
    })();
  }, [storeType]);

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <Text style={styles.title}>Local Stores for Your Remedy</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Your Location"
          pinColor="blue"
        />
        {stores.map((store) => (
          <Marker
            key={store.place_id ? store.place_id : store.name}
            coordinate={{ latitude: store.lat, longitude: store.lon }}
            title={store.name}
            description={store.address}
          />
        ))}
      </MapView>
      {loading && (
        <ActivityIndicator
          style={styles.mapLoading}
          size="large"
          color="#2196F3"
        />
      )}
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Disease Prediction" component={DiseasePredictionScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Store Finder" component={StoreFinderScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0FFF0",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#F0FFF0",
  },
  mapContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: "#2E8B57",
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
    backgroundColor: "#6B8E23",
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  micButton: {
    backgroundColor: "#228B22",
    padding: 10,
    borderRadius: 20,
    marginLeft: 5,
  },
  micButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18,
  },
});
