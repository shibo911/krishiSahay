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
  Modal,
  Linking
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as Location from "expo-location";
import MapView, { Marker, Callout } from "react-native-maps";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

// Replace with your backend URL
const BACKEND_URL = "http://172.70.110.142:5000";

/* =======================================================
   DiseasePredictionScreen
======================================================= */
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
          <Text style={styles.predictionText}>Prediction: {prediction}</Text>
        </View>
      )}
      {additionalInfo && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.additionalInfoText}>{additionalInfo}</Text>
        </View>
      )}
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

/* =======================================================
   ChatScreen
======================================================= */
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
        headers: { "Content-Type": "application/json" },
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
        const userMessage = { role: "user", content: data.user_transcription };
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

/* =======================================================
   GovernmentSchemesScreen: Fetches and displays government schemes.
======================================================= */
function GovernmentSchemesScreen() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/govt_schemes`);
        const data = await response.json();
        console.log("Schemes received:", data.schemes);
        setSchemes(data.schemes);
      } catch (error) {
        console.error("Error fetching schemes", error);
        alert("Error fetching government schemes");
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const openLink = (url) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading Government Schemes...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={schemes}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.schemeTitle}>{item.title}</Text>
          {item.ministry && (
            <Text style={styles.schemeDescription}>{item.ministry}</Text>
          )}
          {item.description ? (
            <Text style={styles.schemeDescription}>{item.description}</Text>
          ) : null}
          {item.link && (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => openLink(item.link)}
            >
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

/* =======================================================
   StoreFinderScreen: Uses location services to get the user’s coordinates,
   calls the backend /store_finder endpoint, and displays a map with markers.
======================================================= */
function StoreFinderScreen({ route }) {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
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

  const fetchStoreDetails = async (place_id) => {
    try {
      const url = `${BACKEND_URL}/place_details?place_id=${encodeURIComponent(place_id)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setStoreDetails(data.result);
      }
    } catch (error) {
      console.error("Error fetching store details", error);
      alert("Failed to fetch store details");
    }
  };

  const handleMarkerPress = (store) => {
    setSelectedStore(store);
    if (store.place_id) {
      fetchStoreDetails(store.place_id);
    }
    setModalVisible(true);
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
            onPress={() => handleMarkerPress(store)}
          >
            <Callout onPress={() => handleMarkerPress(store)}>
              <View style={{ width: 200 }}>
                <Text style={{ fontWeight: "bold" }}>{store.name}</Text>
                <Text>{store.address}</Text>
                <Text style={{ color: "blue", marginTop: 5 }}>View Details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {loading && (
        <ActivityIndicator style={styles.mapLoading} size="large" color="#2196F3" />
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setStoreDetails(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {storeDetails ? (
              <>
                <Text style={styles.modalTitle}>{storeDetails.name}</Text>
                <Text style={styles.modalText}>{storeDetails.formatted_address}</Text>
                {storeDetails.formatted_phone_number && (
                  <Text style={styles.modalText}>
                    Phone: {storeDetails.formatted_phone_number}
                  </Text>
                )}
                {storeDetails.website && (
                  <Text style={styles.modalText}>
                    Website: {storeDetails.website}
                  </Text>
                )}
                {storeDetails.opening_hours &&
                  storeDetails.opening_hours.weekday_text && (
                    <>
                      <Text style={[styles.modalText, { marginTop: 10 }]}>
                        Opening Hours:
                      </Text>
                      {storeDetails.opening_hours.weekday_text.map((line, index) => (
                        <Text key={index} style={styles.modalText}>
                          {line}
                        </Text>
                      ))}
                    </>
                  )}
                <Button
                  title="Close"
                  onPress={() => {
                    setModalVisible(false);
                    setStoreDetails(null);
                  }}
                />
              </>
            ) : (
              <ActivityIndicator size="large" color="#2196F3" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =======================================================
   Navigation Setup
======================================================= */
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Disease Prediction" component={DiseasePredictionScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Schemes" component={GovernmentSchemesScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Store Finder" component={StoreFinderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* =======================================================
   Styles
======================================================= */
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  // Styles for Government Schemes Screen
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    width: "100%",
    elevation: 2,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E8B57",
  },
  schemeDescription: {
    fontSize: 16,
    marginTop: 5,
    color: "#333",
  },
  applyButton: {
    backgroundColor: "#6B8E23",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
