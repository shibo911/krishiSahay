import os
import sys
import tempfile
import random
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import google.generativeai as genai

# -----------------------------
# Determine the Base Directory for Data Files
# -----------------------------
if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    bundle_dir = sys._MEIPASS
else:
    # Running in a normal Python process
    bundle_dir = os.path.dirname(os.path.abspath(__file__))

# Absolute path to the plant_disease_prediction_model.h5 relative to the bundle directory
model_path = os.path.join(bundle_dir, 'plant_disease_prediction_model.h5')

# -----------------------------
# Configuration & Initialization
# -----------------------------
# Initialize Gemini API Key and Model
GEN_AI_API_KEY = "AIzaSyDlXMPgEKz9rySMSPtsgRlyeyoti35xFLU"  # Place your API key here
genai.configure(api_key=GEN_AI_API_KEY)
model_name = "gemini-2.0-flash-exp"  # Example, use a different model if needed
gemini_model = genai.GenerativeModel(model_name)

# Load your pre-trained plant disease model (the better model)
try:
    model_disease = tf.keras.models.load_model(model_path)
    print("Plant disease model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# -----------------------------
# Classes List (New Model)
# -----------------------------
classes = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# -----------------------------
# Helper Functions (Prediction Updated)
# -----------------------------
def load_and_preprocess_image(image_path, target_size=(224, 224)):
    """
    Loads and preprocesses the image using Pillow.
    Resizes the image to the target size, converts it to a numpy array,
    expands its dimensions and normalizes it.
    """
    img = Image.open(image_path)
    img = img.resize(target_size)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array.astype('float32') / 255.0  # Normalize to [0,1]
    return img_array

def predict_disease(img_path):
    """
    Loads and preprocesses the image using the new method,
    then returns the predicted class index and disease name.
    """
    img_array = load_and_preprocess_image(img_path)
    predictions = model_disease.predict(img_array)
    predicted_class_index = int(np.argmax(predictions, axis=1)[0])
    predicted_disease = classes[predicted_class_index]
    return predicted_class_index, predicted_disease

def get_disease_info(disease_name):
    """
    Returns comprehensive details about a specific crop disease using Gemini API.
    """
    prompt = (f"Provide comprehensive details about {disease_name}. "
              "Include introduction, causes, prevention methods, danger level, "
              "recommended pesticides, and any images if available.")
    response = gemini_model.generate_content(prompt)
    return response.text

def get_healthy_advice():
    """
    Returns advice on how to maintain healthy crops using Gemini API.
    """
    prompt = "My crop is healthy. How can I ensure it remains healthy and prevent diseases?"
    response = gemini_model.generate_content(prompt)
    return response.text

# -----------------------------
# Flask App & Endpoints
# -----------------------------
app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Expects a multipart/form-data POST request with the image file under the key "image".
    Returns the predicted disease class index and name.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No image file provided."}), 400

    # Save the file temporarily
    temp_path = os.path.join(tempfile.gettempdir(), file.filename)
    file.save(temp_path)

    try:
        predicted_class_index, predicted_disease = predict_disease(temp_path)
        response_data = {
            "predicted_class": predicted_class_index,
            "predicted_disease": predicted_disease
        }
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/disease_info', methods=['GET'])
def disease_info():
    """
    Expects a query parameter 'disease_name' and returns comprehensive details.
    """
    disease_name = request.args.get('disease_name')
    if not disease_name:
        return jsonify({"error": "No disease name provided."}), 400
    try:
        info = get_disease_info(disease_name)
        return jsonify({"disease_info": info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/healthy_advice', methods=['GET'])
def healthy_advice():
    """
    Returns healthy crop advice.
    """
    try:
        advice = get_healthy_advice()
        return jsonify({"advice": advice})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Expects a JSON POST request with a "prompt" field.
    Returns a chat response from Gemini.
    """
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "No prompt provided."}), 400

    prompt = data["prompt"]
    system_message = (
        "You are KrishiSahay, an AI assistant specialized in crop management, "
        "crop diseases, healthy plant practices, and crop-related advice. "
        "You will only answer questions related to crops and agriculture."
    )

    prompt_with_context = f"{system_message}\nUser: {prompt}"
    try:
        response = gemini_model.generate_content(prompt_with_context)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# Run the App
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
