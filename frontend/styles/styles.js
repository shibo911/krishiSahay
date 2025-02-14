import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  // Semi-transparent overlay to ensure content readability over the background image
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E8B57", // Deep green color
    textAlign: "center",
    marginVertical: 15,
  },
  loadingText: {
    fontSize: 18,
    color: "#2E8B57",
    marginTop: 10,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "transparent",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: "#2E8B57",
  },
  predictionText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#2E8B57",
  },
  additionalInfoText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
    color: "#556B2F",
  },
  chatList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "center",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f0f0",
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  speakerButton: {
    marginLeft: 5,
    padding: 5,
    backgroundColor: "#2E8B57",
    borderRadius: 20,
  },
  speakerButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#6B8E23",
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  micButton: {
    backgroundColor: "#228B22",
    padding: 10,
    borderRadius: 20,
    marginLeft: 5,
  },
  micButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fff0",
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  card: {
  backgroundColor: "#e8f5e9", // Light green background to evoke freshness
  padding: 24,
  marginVertical: 12,
  borderRadius: 20,
  width: width - 40,
  alignSelf: "center",
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.35,
  shadowRadius: 4.65,
  borderWidth: 1,
  borderColor: "#c8e6c9", // Subtle light green border for a refined look
},

  schemeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#388E3C", // A deeper, natural green color
    marginBottom: 5,
  },
  schemeDescription: {
    fontSize: 16,
    marginTop: 8,
    color: "#424242", // A neutral dark tone for better readability
    lineHeight: 22,
  },
  applyButton: {
    backgroundColor: "#4CAF50", // Vibrant green for a call-to-action
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    borderRadius: 30,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4CAF50", // Pleasant green tone
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginVertical: 10,
    alignSelf: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#2196F3", // Distinct blue for another type of action
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  findStoreButton: {
    backgroundColor: "#FF5722", // A vibrant orange for standout calls-to-action
    paddingVertical: 20,
    paddingHorizontal: 45,
    borderRadius: 40,
    marginVertical: 15,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E64A19",
  },
  findStoreButtonText: {
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  allLoadedText: {
    textAlign: "center",
    marginVertical: 25,
    fontSize: 20,
    color: "#388E3C",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Search bar style added and placed a little lower.
 searchInput: {
  height: 50,
  borderColor: "#2E8B57", // Deep green border for a natural look
  borderWidth: 1,
  borderRadius: 30,
  marginHorizontal: 15,
  marginTop: 40, // Positioned lower from the top for better separation
  marginBottom: 20,
  paddingHorizontal: 20,
  backgroundColor: "#fff",
  fontSize: 16,
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  },
 
});

export default styles;