// frontend/screens/WeatherScreen.js
import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { BACKEND_URL } from "../config";
import styles from "../styles/styles";

const WeatherScreen = () => {
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchWeather(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await fetch(`${BACKEND_URL}/weather?lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
      } else {
        // Group the 3-hour forecasts by day
        const grouped = groupForecastByDay(data.list);
        let dailyForecasts = [];
        for (let date in grouped) {
          const forecasts = grouped[date];
          let middayForecast = forecasts.find((item) =>
            item.dt_txt.includes("12:00:00")
          );
          if (!middayForecast) {
            middayForecast = forecasts[0];
          }
          dailyForecasts.push({ date, forecast: middayForecast });
        }
        setForecast(dailyForecasts);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching weather", error);
      alert("Error fetching weather data");
      setLoading(false);
    }
  };

  const groupForecastByDay = (list) => {
    let grouped = {};
    list.forEach((item) => {
      let date = item.dt_txt.split(" ")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading Weather Forecast...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weather Forecast</Text>
      {forecast &&
        forecast.map((item, index) => {
          const { date, forecast: fc } = item;
          return (
            <View key={index} style={styles.card}>
              <Text style={styles.schemeTitle}>{date}</Text>
              <Text style={styles.schemeDescription}>
                {fc.weather[0].main} - {fc.weather[0].description}
              </Text>
              <Text style={styles.schemeDescription}>
                Temp: {fc.main.temp}°C, Humidity: {fc.main.humidity}%
              </Text>
            </View>
          );
        })}
    </ScrollView>
  );
};

export default WeatherScreen;
