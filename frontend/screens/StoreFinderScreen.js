// screens/StoreFinderScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

const StoreFinderScreen = ({ route }) => {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const url = `${BACKEND_URL}/place_details?place_id=${encodeURIComponent(
        place_id
      )}`;
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
                <Text style={{ color: "blue", marginTop: 5 }}>
                  View Details
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {loading && (
        <ActivityIndicator
          style={styles.mapLoading}
          size="large"
          color="#2196F3"
        />
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
                <Text style={styles.modalText}>
                  {storeDetails.formatted_address}
                </Text>
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
                      {storeDetails.opening_hours.weekday_text.map(
                        (line, index) => (
                          <Text key={index} style={styles.modalText}>
                            {line}
                          </Text>
                        )
                      )}
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
};

export default StoreFinderScreen;
