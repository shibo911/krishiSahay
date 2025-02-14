// frontend/screens/RentalsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Image,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BACKEND_URL } from "../config";

// New background image from Unsplash (farm-like scene)
const farmlandImage = {
  uri: "https://images.unsplash.com/photo-1601758123927-5db98a7dbd11?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
};

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
    photo: null,
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

    if (rentalForm.photo) {
      const formData = new FormData();
      formData.append("title", rentalForm.title);
      formData.append("description", rentalForm.description);
      formData.append("price", rentalForm.price);
      formData.append("contact", rentalForm.contact);
      formData.append("equipment_type", rentalForm.equipment_type);
      formData.append("rental_duration", rentalForm.rental_duration);
      formData.append("location", rentalForm.location);

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
    <ImageBackground
      source={farmlandImage}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 1 }}
    >
      <View style={styles.overlay}>
        {/* Updated header with a plant emoji */}
        <View style={styles.headerContainer}>
          <Text style={styles.mainHeader}>🌿 Farm Rentals</Text>
        </View>

        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.rentalItem}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.value}>${item.price}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{item.contact}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Equipment:</Text>
                <Text style={styles.value}>{item.equipment_type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>{item.rental_duration}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{item.location}</Text>
              </View>
              {item.photo && (
                <Image source={{ uri: item.photo }} style={styles.photo} />
              )}
              <Text style={styles.postedBy}>Posted by: {item.posted_by}</Text>
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.addRentalButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addRentalButtonText}>Add Rental</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Add New Rental</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#777"
            value={rentalForm.title}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, title: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            placeholderTextColor="#777"
            value={rentalForm.description}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, description: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            placeholderTextColor="#777"
            keyboardType="numeric"
            value={rentalForm.price}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, price: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Phone (required)"
            placeholderTextColor="#777"
            value={rentalForm.contact}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, contact: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Equipment Type (e.g., Tractor, Harvester)"
            placeholderTextColor="#777"
            value={rentalForm.equipment_type}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, equipment_type: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Rental Duration (e.g., per day, per week)"
            placeholderTextColor="#777"
            value={rentalForm.rental_duration}
            onChangeText={(text) =>
              setRentalForm({ ...rentalForm, rental_duration: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Location (required)"
            placeholderTextColor="#777"
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

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddRental}
            >
              <Text style={styles.submitButtonText}>Submit Rental</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLoginModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#777"
            value={loginForm.username}
            onChangeText={(text) =>
              setLoginForm({ ...loginForm, username: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            value={loginForm.password}
            onChangeText={(text) =>
              setLoginForm({ ...loginForm, password: text })
            }
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
              <Text style={styles.submitButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => {
              setShowLoginModal(false);
              navigation.navigate("Register");
            }}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default RentalsScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    // Changed overlay to a dark semi-transparent background
    backgroundColor: "rgba(160, 240, 163, 0.5)",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  mainHeader: {
    fontSize: 28,
    color: "#2E7D32",
    fontWeight: "700",
  },
  listContainer: {
    paddingBottom: 20,
  },
  rentalItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#e0f2f1",
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 16,
    color: "#424242",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    color: "#388E3C",
    width: 100,
  },
  value: {
    color: "#424242",
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 10,
  },
  postedBy: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#555",
    textAlign: "right",
  },
  addRentalButton: {
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#43A047",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: "center",
    marginTop: 100,
    marginBottom: 10,
    elevation: 3,
  },
  addRentalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    justifyContent: "center",
  },
  modalHeader: {
    fontSize: 26,
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 25,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  uploadButton: {
    backgroundColor: "#0277BD",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: "center",
    elevation: 2,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 10,
    alignSelf: "center",
    marginVertical: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 25,
  },
  submitButton: {
    backgroundColor: "#388E3C",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 2,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#FFA726",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 2,
    marginTop: 15,
    alignSelf: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
