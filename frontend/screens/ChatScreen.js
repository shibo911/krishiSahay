// frontend/screens/ChatScreen.js
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  ImageBackground 
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

const ChatScreen = () => {
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
      <Text
        style={
          item.role === "user"
            ? [styles.messageText, { color: "#000" }] // Display user messages in black
            : styles.messageText // AI responses use the default style
        }
      >
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
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="cover"
    >
      <View style={styles.chatContainer}>
        {/* Heading with white color and extra spacing */}
        <Text style={[styles.title, { color: "#fff", marginTop: 30 }]}>
          Chat with KrishiSahay
        </Text>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          style={styles.chatList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: "#fff" }]} // Typing text appears white
            placeholder="Ask a question about crops..."
            placeholderTextColor="#ccc"
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
    </ImageBackground>
  );
};

export default ChatScreen;
