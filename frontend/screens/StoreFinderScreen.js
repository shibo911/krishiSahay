import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

export default function StoreFinderScreen({ route }) {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storeType = route.params?.storeType || "farm supply";

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync();
      setLocation(loc.coords);
      fetchStores(loc.coords.latitude, loc.coords.longitude);
    })();
  }, [storeType]);

  const fetchStores = async (lat, lon) => {
    setLoading(true);
    try {
      const url =
        `${BACKEND_URL}/store_finder?lat=${lat}&lon=${lon}` +
        `&store_type=${encodeURIComponent(storeType)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStores(data.stores);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{error}</Text>
      </View>
    );
  }
  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Getting your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={location} title="You are here" pinColor="blue" />
        {stores.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lon }}
            title={s.name}
            description={s.address}
          />
        ))}
      </MapView>

      {loading && <ActivityIndicator style={styles.mapLoading} size="large" />}
    </View>
  );
}
