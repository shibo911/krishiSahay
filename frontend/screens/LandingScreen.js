// // screens/LandingScreen.js
// import React, { useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Animated,
//   Dimensions,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";

// const { width } = Dimensions.get("window");

// const LandingScreen = ({ navigation }) => {
//   // Menu items with route mappings.
//   const menuItems = [
//     { label: "Disease Prediction", route: "Disease Prediction" },
//     { label: "Chat", route: "Chat" },
//     { label: "Government Schemes", route: "Schemes" },
//     { label: "Weather", route: "Weather" },
//     { label: "AgriTrade", route: "Rentals" },
//   ];

//   // Animated values for title and each menu button.
//   const titleAnim = useRef(new Animated.Value(0)).current;
//   const menuAnims = useRef(menuItems.map(() => new Animated.Value(0))).current;

//   useEffect(() => {
//     // Animate title: fade in and slide down.
//     Animated.timing(titleAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();

//     // Staggered button animations: fade in and slide up.
//     Animated.stagger(
//       150,
//       menuAnims.map((anim) =>
//         Animated.timing(anim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         })
//       )
//     ).start();
//   }, [titleAnim, menuAnims]);

//   const handlePress = (routeName) => {
//     // Navigate to MainTabs and pass the initialTab parameter.
//     navigation.navigate("MainTabs", { initialTab: routeName });
//   };

//   return (
//     <LinearGradient
//       colors={["#4CAF50", "#8BC34A"]}
//       style={styles.gradient}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       <ScrollView contentContainerStyle={styles.container}>
//         <Animated.Text
//           style={[
//             styles.title,
//             {
//               opacity: titleAnim,
//               transform: [
//                 {
//                   translateY: titleAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [-50, 0],
//                   }),
//                 },
//               ],
//             },
//           ]}
//         >
//           Welcome to Krishi Sahay
//         </Animated.Text>
//         {menuItems.map((item, index) => (
//           <Animated.View
//             key={index}
//             style={{
//               opacity: menuAnims[index],
//               transform: [
//                 {
//                   translateY: menuAnims[index].interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [50, 0],
//                   }),
//                 },
//               ],
//             }}
//           >
//             <TouchableOpacity
//               style={styles.button}
//               onPress={() => handlePress(item.route)}
//             >
//               <Text style={styles.buttonText}>{item.label}</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         ))}
//       </ScrollView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   gradient: {
//     flex: 1,
//   },
//   container: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 20,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 40,
//     textShadowColor: "rgba(0, 0, 0, 0.5)",
//     textShadowOffset: { width: 2, height: 2 },
//     textShadowRadius: 5,
//   },
//   button: {
//     width: width * 0.8, // All buttons are 80% of the screen width
//     height: 60, // Fixed height for uniformity
//     backgroundColor: "rgba(255, 255, 255, 0.95)",
//     borderRadius: 30,
//     marginBottom: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   buttonText: {
//     color: "#4CAF50",
//     fontSize: 18,
//     fontWeight: "600",
//   },
// });

// export default LandingScreen;
// import React, { useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Animated,
//   Dimensions,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { FontAwesome } from "@expo/vector-icons"; // Import FontAwesome icons

// const { width } = Dimensions.get("window");

// // Menu items now include an icon property.
// const menuItems = [
//   { label: "Disease Prediction", route: "Disease Prediction", icon: "medkit" },
//   { label: "Chat", route: "Chat", icon: "comments" },
//   { label: "Government Schemes", route: "Schemes", icon: "info-circle" },
//   { label: "Weather", route: "Weather", icon: "cloud" },
//   { label: "AgriTrade", route: "Rentals", icon: "shopping-cart" },
// ];

// const LandingScreen = ({ navigation }) => {
//   // Animated values for title and each menu button.
//   const titleAnim = useRef(new Animated.Value(0)).current;
//   const menuAnims = useRef(menuItems.map(() => new Animated.Value(0))).current;

//   useEffect(() => {
//     // Animate title: fade in and slide down.
//     Animated.timing(titleAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();

//     // Staggered button animations: fade in and slide up.
//     Animated.stagger(
//       150,
//       menuAnims.map((anim) =>
//         Animated.timing(anim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         })
//       )
//     ).start();
//   }, [titleAnim, menuAnims]);

//   const handlePress = (routeName) => {
//     // Navigate to MainTabs and pass the initialTab parameter.
//     navigation.navigate("MainTabs", { initialTab: routeName });
//   };

//   return (
//     <LinearGradient
//       colors={["#4CAF50", "#8BC34A"]}
//       style={styles.gradient}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       <ScrollView contentContainerStyle={styles.container}>
//         <Animated.Text
//           style={[
//             styles.title,
//             {
//               opacity: titleAnim,
//               transform: [
//                 {
//                   translateY: titleAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [-50, 0],
//                   }),
//                 },
//               ],
//             },
//           ]}
//         >
//           Welcome to Krishi Sahay
//         </Animated.Text>
//         {menuItems.map((item, index) => (
//           <Animated.View
//             key={index}
//             style={{
//               opacity: menuAnims[index],
//               transform: [
//                 {
//                   translateY: menuAnims[index].interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [50, 0],
//                   }),
//                 },
//               ],
//             }}
//           >
//             <TouchableOpacity
//               style={styles.button}
//               onPress={() => handlePress(item.route)}
//             >
//               <FontAwesome
//                 name={item.icon}
//                 size={24}
//                 color="#4CAF50"
//                 style={{ marginRight: 10 }}
//               />
//               <Text style={styles.buttonText}>{item.label}</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         ))}
//       </ScrollView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   gradient: {
//     flex: 1,
//   },
//   container: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 20,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 40,
//     textShadowColor: "rgba(0, 0, 0, 0.5)",
//     textShadowOffset: { width: 2, height: 2 },
//     textShadowRadius: 5,
//   },
//   button: {
//     width: width * 0.8, // 80% of the screen width
//     height: 60, // Fixed height for uniformity
//     backgroundColor: "rgba(255, 255, 255, 0.95)",
//     borderRadius: 30,
//     marginBottom: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 4,
//     flexDirection: "row", // Ensure icon and text are in a row
//   },
//   buttonText: {
//     color: "#4CAF50",
//     fontSize: 18,
//     fontWeight: "600",
//   },
// });

// export default LandingScreen;
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Import FontAwesome icons
const { width } = Dimensions.get("window");

// Define your menu items along with their routes and icons.
const menuItems = [
  { label: "Disease Prediction", route: "Disease Prediction", icon: "medkit" },
  { label: "Chat", route: "Chat", icon: "comments" },
  { label: "Government Schemes", route: "Schemes", icon: "info-circle" },
  { label: "Weather", route: "Weather", icon: "cloud" },
  { label: "AgriTrade", route: "Rentals", icon: "shopping-cart" },
];

const LandingScreen = ({ navigation }) => {
  // Animated values for the title and each menu button.
  const titleAnim = useRef(new Animated.Value(0)).current;
  const menuAnims = useRef(menuItems.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate the title: fade in and slide down.
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate the buttons with a staggered fade in and slide up.
    Animated.stagger(
      150,
      menuAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [titleAnim, menuAnims]);

  const handlePress = (routeName) => {
    // Navigate to MainTabs and pass the initialTab parameter.
    navigation.navigate("MainTabs", { initialTab: routeName });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo Image above the welcome text */}
        <Image
          source={require("../assets/logo.webp")} // Update the path if needed.
          style={styles.logo}
        />
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Welcome to KrishiSahay
        </Animated.Text>
        {menuItems.map((item, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: menuAnims[index],
              transform: [
                {
                  translateY: menuAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => handlePress(item.route)}
            >
              <FontAwesome
                name={item.icon}
                size={24}
                color="#fff"
                style={styles.icon}
              />
              <Text style={styles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9", // Light green background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E8B57", // Dark green text
    marginBottom: 40,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  button: {
    width: width * 0.8, // 80% of the screen width
    height: 60, // Fixed height for uniformity
    backgroundColor: "#2E8B57", // Dark green buttons
    borderRadius: 30, // Oval (pill-shaped)
    marginBottom: 20,
    flexDirection: "row", // Place icon and text side by side
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LandingScreen;
