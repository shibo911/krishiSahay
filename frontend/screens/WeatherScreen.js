// frontend/screens/WeatherScreen.js
import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import * as Location from "expo-location";
import { BACKEND_URL } from "../config";

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

  // Format the date label as "Today", "Tomorrow", or the actual date.
  const formatDateLabel = (dateStr) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    if (dateStr === todayStr) return "Today";
    else if (dateStr === tomorrowStr) return "Tomorrow";
    else return dateStr;
  };

  const getWeatherEmoji = (weatherMain) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
        return "☀️";
      case "clouds":
        return "☁️";
      case "rain":
        return "🌧️";
      case "drizzle":
        return "🌦️";
      case "thunderstorm":
        return "⛈️";
      case "snow":
        return "❄️";
      case "mist":
      case "smoke":
      case "haze":
      case "dust":
      case "fog":
      case "sand":
      case "ash":
      case "squall":
      case "tornado":
        return "🌫️";
      default:
        return "";
    }
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
          const formattedDate = formatDateLabel(date);
          const iconUrl = `https://openweathermap.org/img/wn/${fc.weather[0].icon}@2x.png`;
          const weatherEmoji = getWeatherEmoji(fc.weather[0].main);
          return (
            <View key={index} style={styles.card}>
              <Text style={styles.schemeTitle}>{formattedDate}</Text>
              <View style={styles.weatherRow}>
                <Image source={{ uri: iconUrl }} style={styles.weatherIcon} />
                <View style={styles.weatherDetails}>
                  <Text style={styles.schemeDescription}>
                    {weatherEmoji} {fc.weather[0].main} - {fc.weather[0].description}
                  </Text>
                  <Text style={styles.schemeDescription}>
                    Temp: {fc.main.temp}°C
                  </Text>
                  <Text style={styles.schemeDescription}>
                    Humidity: {fc.main.humidity}%
                  </Text>
                  <Text style={styles.schemeDescription}>
                    Wind: {fc.wind.speed} m/s
                  </Text>
                  <Text style={styles.schemeDescription}>
                    Pressure: {fc.main.pressure} hPa
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f3f9f3", // light, refreshing background
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#2E8B57", // deep green for a natural touch
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fff0",
  },
  card: {
    backgroundColor: "#e8f5e9", // refreshing light green for weather cards
    padding: 20,
    marginVertical: 12,
    borderRadius: 20,
    width: "90%",
    alignSelf: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#c8e6c9", // subtle light green border for a refined look
  },
  schemeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00796B", // darker teal for the date/title
    marginBottom: 8,
  },
  schemeDescription: {
    fontSize: 16,
    color: "#424242",
    marginVertical: 4,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  weatherDetails: {
    flex: 1,
  },
});

export default WeatherScreen;
