// frontend/screens/RentalsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BACKEND_URL } from "../config";

const RentalsScreen = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [rentalForm, setRentalForm] = useState({
    title: "",
    description: "",
    price: "",
    contact: "",
    equipment_type: "",
    rental_duration: "",
    location: "",
    photo: null, // URI of the selected photo
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/rentals`);
      const data = await response.json();
      setRentals(data.rentals);
    } catch (error) {
      console.error("Error fetching rentals:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (data.message) {
        setLoggedIn(true);
        setShowLoginModal(false);
        Alert.alert("Login", "Login successful!");
      } else {
        Alert.alert("Login Error", data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Permission to access media library is required!"
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.cancelled) {
      setRentalForm({ ...rentalForm, photo: result.uri });
    }
  };

  const handleAddRental = async () => {
    if (!loggedIn) {
      setShowLoginModal(true);
      return;
    }
    // If a photo is selected, use multipart form data
    if (rentalForm.photo) {
      const formData = new FormData();
      formData.append("title", rentalForm.title);
      formData.append("description", rentalForm.description);
      formData.append("price", rentalForm.price);
      formData.append("contact", rentalForm.contact);
      formData.append("equipment_type", rentalForm.equipment_type);
      formData.append("rental_duration", rentalForm.rental_duration);
      formData.append("location", rentalForm.location);
      // Append photo file
      let uriParts = rentalForm.photo.split(".");
      let fileType = uriParts[uriParts.length - 1];
      formData.append("photo", {
        uri: rentalForm.photo,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
      try {
        const response = await fetch(`${BACKEND_URL}/rentals`, {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });
        const data = await response.json();
        if (data.message) {
          Alert.alert("Success", "Rental added successfully!");
          setShowAddModal(false);
          setRentalForm({
            title: "",
            description: "",
            price: "",
            contact: "",
            equipment_type: "",
            rental_duration: "",
            location: "",
            photo: null,
          });
          fetchRentals();
        } else {
          Alert.alert("Error", data.error || "Could not add rental.");
        }
      } catch (error) {
        console.error("Error adding rental:", error);
      }
    } else {
      // Otherwise, send as JSON
      try {
        const response = await fetch(`${BACKEND_URL}/rentals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...rentalForm,
            price: parseFloat(rentalForm.price),
          }),
        });
        const data = await response.json();
        if (data.message) {
          Alert.alert("Success", "Rental added successfully!");
          setShowAddModal(false);
          setRentalForm({
            title: "",
            description: "",
            price: "",
            contact: "",
            equipment_type: "",
            rental_duration: "",
            location: "",
            photo: null,
          });
          fetchRentals();
        } else {
          Alert.alert("Error", data.error || "Could not add rental.");
        }
      } catch (error) {
        console.error("Error adding rental:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rental Listings</Text>
      <FlatList
        data={rentals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.rentalItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>Price: ${item.price}</Text>
            <Text>Contact: {item.contact}</Text>
            <Text>Equipment: {item.equipment_type}</Text>
            <Text>Duration: {item.rental_duration}</Text>
            <Text>Location: {item.location}</Text>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.photo} />
            ) : null}
            <Text style={styles.postedBy}>Posted by: {item.posted_by}</Text>
          </View>
        )}
      />
      <Button title="Add Rental" onPress={() => setShowAddModal(true)} />

      {/* Rental Form Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Add New Rental</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={rentalForm.title}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, title: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={rentalForm.description}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, description: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={rentalForm.price}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, price: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Phone (required)"
            value={rentalForm.contact}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, contact: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Equipment Type (e.g., Tractor, Harvester)"
            value={rentalForm.equipment_type}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, equipment_type: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Rental Duration (e.g., per day, per week)"
            value={rentalForm.rental_duration}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, rental_duration: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Location (required)"
            value={rentalForm.location}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, location: text })
            }
          />
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>
              {rentalForm.photo
                ? "Change Photo"
                : "Upload Product Photo (Optional)"}
            </Text>
          </TouchableOpacity>
          {rentalForm.photo && (
            <Image
              source={{ uri: rentalForm.photo }}
              style={styles.previewPhoto}
            />
          )}
          <Button title="Submit Rental" onPress={handleAddRental} />
          <Button title="Cancel" onPress={() => setShowAddModal(false)} />
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal visible={showLoginModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={loginForm.username}
            onChangeText={(text) =>
              setLoginForm({ ...loginForm, username: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={loginForm.password}
            onChangeText={(text) =>
              setLoginForm({ ...loginForm, password: text })
            }
          />
          <Button title="Login" onPress={handleLogin} />
          <Button title="Cancel" onPress={() => setShowLoginModal(false)} />
          <Button
            title="Register"
            onPress={() => {
              setShowLoginModal(false);
              navigation.navigate("Register");
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

export default RentalsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  rentalItem: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 6,
    marginVertical: 6,
  },
  title: { fontWeight: "bold", fontSize: 16 },
  postedBy: { marginTop: 4, fontStyle: "italic", color: "#555" },
  header: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 4,
    padding: 8,
    marginVertical: 6,
  },
  uploadButton: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginVertical: 6,
  },
  uploadButtonText: { color: "#333" },
  previewPhoto: {
    width: 100,
    height: 100,
    marginVertical: 6,
    alignSelf: "center",
  },
});
