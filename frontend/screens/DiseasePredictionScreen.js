// screens/DiseasePredictionScreen.js
import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

/**
 * Helper function to remove markdown formatting.
 */
function stripMarkdown(text) {
  if (!text) return "";
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^\d+\.\s+/gm, "");
}

/**
 * Helper function to render formatted text with bold formatting.
 */
function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
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
 * Parses the additional info string into sections.
 */
const parseDiseaseInfo = (info) => {
  const regex = /(\d+\.\s\*\*[A-Za-z ]+\*\*:)/g;
  const parts = info.split(regex).filter((part) => part.trim() !== "");
  const sections = [];
  for (let i = 0; i < parts.length; i += 2) {
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
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: "#E8F5E9", padding: 20 },
      ]}
    >
      {/* Header Image */}
      {image ? (
        <Image source={{ uri: image }} style={localStyles.headerImage} />
      ) : (
        // Placeholder image (update the path if needed)
        <Image
          source={require("../assets/Disease.png")}
          style={localStyles.headerImage}
        />
      )}

      {/* Heading */}
      <Text style={localStyles.heading}>
        KrishiSahay: Crop Disease Prediction
      </Text>

      {/* Buttons Group */}
      <View style={localStyles.buttonGroup}>
        <TouchableOpacity style={localStyles.button} onPress={pickImage}>
          <Text style={localStyles.buttonText}>Pick an Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.button} onPress={captureImage}>
          <Text style={localStyles.buttonText}>Capture an Image</Text>
        </TouchableOpacity>
        {image && (
          <TouchableOpacity
            style={localStyles.uploadButton}
            onPress={uploadImage}
            disabled={loading}
          >
            <Text style={localStyles.uploadButtonText}>
              Upload and Predict
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={{ marginTop: 20 }}
        />
      )}

      {prediction && (
        <View style={localStyles.predictionContainer}>
          <Text style={localStyles.predictionText}>
            Prediction: {stripMarkdown(prediction)}
          </Text>
        </View>
      )}

      {additionalInfo && (
        <View style={localStyles.infoContainer}>
          {parseDiseaseInfo(additionalInfo).map((section, index) => (
            <View key={index} style={localStyles.card}>
              <Text style={localStyles.schemeTitle}>
                {renderFormattedText(section.title)}
              </Text>
              <Text style={localStyles.schemeDescription}>
                {renderFormattedText(section.content)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {recommendedStoreType && (
        <TouchableOpacity
          style={localStyles.findStoreButton}
          onPress={() =>
            navigation.navigate("StoreFinderScreen", {
              storeType: recommendedStoreType,
            })
          }
        >
          <Text style={localStyles.findStoreButtonText}>
            Find Local Stores
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  headerImage: {
    width: "100%",
    height: 260,
    borderRadius: 10,
    marginBottom: 35,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2E8B57",
    marginBottom: 20,
  },
  buttonGroup: {
    width: "100%",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E8B57",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    width: "100%",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    width: "100%",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  predictionContainer: {
    backgroundColor: "lightgreen",
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    width: "100%",
  },
  predictionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    textAlign: "center",
  },
  infoContainer: {
    marginTop: 20,
    width: "100%",
  },
  card: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  schemeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00796B",
    marginBottom: 5,
  },
  schemeDescription: {
    fontSize: 16,
    color: "#424242",
  },
  findStoreButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  findStoreButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default DiseasePredictionScreen;
