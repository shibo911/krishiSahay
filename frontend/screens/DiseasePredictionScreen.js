//frontend/screens/DiseasePredictionScreen.js
import React, { useState } from "react";
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

/**
 * Helper function to remove markdown formatting.
 * It removes any asterisks (both ** and *) and leading numbering (e.g., "1. ") from the text.
 * (This is still used for the prediction text.)
 */
function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")     // Remove all instances of **
    .replace(/\*/g, "")        // Remove all instances of *
    .replace(/^\d+\.\s+/gm, ""); // Remove numbering at the beginning of each line
}

/**
 * Helper function to render text with bold formatting where text is wrapped in ** **.
 */
function renderFormattedText(text) {
  if (!text) return null;
  // Split text by any occurrence of **...**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Remove the ** markers and render this part in bold.
      return (
        <Text key={index} style={{ fontWeight: "bold" }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
}

/**
 * Parse the additional info string into an array of sections.
 * Expected format:
 * 1. **Introduction**: ...
 * 2. **Causes**: ...
 * 3. **Prevention Methods**: ...
 * 4. **Danger Level**: ...
 * 5. **Recommended Remedies**: ...
 */
const parseDiseaseInfo = (info) => {
  // This regex captures the section headers in the expected format.
  const regex = /(\d+\.\s\*\*[A-Za-z ]+\*\*:)/g;
  // Split the info string by the headers.
  const parts = info.split(regex).filter((part) => part.trim() !== "");
  const sections = [];
  for (let i = 0; i < parts.length; i += 2) {
    // Keep the title as-is (with ** markers) so it can be rendered with bold formatting.
    const title = parts[i].trim();
    const content = parts[i + 1] ? parts[i + 1].trim() : "";
    sections.push({ title, content });
  }
  return sections;
};

const DiseasePredictionScreen = () => {
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
          `${BACKEND_URL}/disease_info?disease_name=${encodeURIComponent(data.predicted_disease)}`
        );
        const diseaseInfoData = await diseaseInfoResponse.json();
        setAdditionalInfo(diseaseInfoData.disease_info);
      }
      const storeTypeResponse = await fetch(
        `${BACKEND_URL}/recommended_store_type?disease_name=${encodeURIComponent(data.predicted_disease)}`
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: "#E8F5E9" }]}>
      <Text style={styles.title}>KrishiSahay: Crop Disease Prediction</Text>
      
      {/* Button to Pick an Image */}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>
      
      <View style={{ marginVertical: 10 }} />
      
      {/* Button to Capture an Image */}
      <TouchableOpacity style={styles.button} onPress={captureImage}>
        <Text style={styles.buttonText}>Capture an Image</Text>
      </TouchableOpacity>
      
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 300, height: 300, marginVertical: 20, borderRadius: 10 }}
        />
      )}
      
      {image && (
        // Button to Upload and Predict
        <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={loading}>
          <Text style={styles.uploadButtonText}>Upload and Predict</Text>
        </TouchableOpacity>
      )}
      
      {loading && <ActivityIndicator size="large" color="#2196F3" />}
      
      {prediction && (
        <View style={{ marginTop: 20, backgroundColor: "lightgreen", padding: 10, borderRadius: 8 }}>
          <Text style={styles.predictionText}>
            Prediction: {stripMarkdown(prediction)}
          </Text>
        </View>
      )}
      
      {additionalInfo && (
        <View style={{ marginTop: 20 }}>
          {parseDiseaseInfo(additionalInfo).map((section, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.schemeTitle}>
                {renderFormattedText(section.title)}
              </Text>
              <Text style={styles.schemeDescription}>
                {renderFormattedText(section.content)}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {recommendedStoreType && (
        // Button to Find Local Stores
        <TouchableOpacity
          style={styles.findStoreButton}
          onPress={() =>
            navigation.navigate("Store Finder", { storeType: recommendedStoreType })
          }
        >
          <Text style={styles.findStoreButtonText}>Find Local Stores</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default DiseasePredictionScreen;
