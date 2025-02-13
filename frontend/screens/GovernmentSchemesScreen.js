// frontend/screens/GovernmentSchemesScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Button, TouchableOpacity, ActivityIndicator, Linking, TextInput } from "react-native";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

const GovernmentSchemesScreen = () => {
  const [schemes, setSchemes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSchemes = async (page, query = "") => {
    try {
      // Build URL with optional search query
      let url = `${BACKEND_URL}/govt_schemes?page=${page}`;
      if (query && query.trim() !== "") {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      //console.log(`Schemes received for page ${page}:`, data.schemes);
      
      if (data.schemes.length === 0) {
        setAllLoaded(true);
      } else {
        if (page === 1) {
          setSchemes(data.schemes);
        } else {
          setSchemes((prev) => [...prev, ...data.schemes]);
        }
      }
    } catch (error) {
      console.error("Error fetching schemes", error);
      alert("Error fetching government schemes");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch schemes on mount and when searchQuery changes
  useEffect(() => {
    setLoading(true);
    setAllLoaded(false);
    setCurrentPage(1);
    fetchSchemes(1, searchQuery);
  }, [searchQuery]);

  const loadMore = () => {
    if (!allLoaded && !loadingMore) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchSchemes(nextPage, searchQuery);
    }
  };

  const openLink = (url) => {
    Linking.openURL(url);
  };

  if (loading && schemes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading Government Schemes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search Government Schemes"
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        onSubmitEditing={() => {
          setLoading(true);
          setAllLoaded(false);
          setCurrentPage(1);
          fetchSchemes(1, searchQuery);
        }}
      />
      
      <FlatList
        data={schemes}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.schemeTitle}>{item.title}</Text>
            {item.ministry ? (
              <Text style={styles.schemeDescription}>{item.ministry}</Text>
            ) : null}
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
        ListFooterComponent={() =>
          !allLoaded ? (
            loadingMore ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : (
              <Button title="Load More" onPress={loadMore} />
            )
          ) : (
            <Text style={{ margin: 20 }}>All schemes loaded.</Text>
          )
        }
      />
    </View>
  );
};

export default GovernmentSchemesScreen;