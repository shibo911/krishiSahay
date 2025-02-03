import os
import tempfile
import random
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from keras.preprocessing import image
from PIL import Image
from openai import OpenAI  # Using the client style similar to your previous code

# -----------------------------
# Configuration & Initialization
# -----------------------------
client = OpenAI(
    api_key="2158b5dcd7b84550b05870af0c7e8f8a",
    base_url="https://api.aimlapi.com",
)

# Load your pre-trained crop disease model
model_path = 'crop_disease_model.h5'
try:
    model_disease = tf.keras.models.load_model(model_path)
    print("Crop disease model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# -----------------------------
# Label Dictionary
# -----------------------------
label_dict = {
    0: 'bacterial_blight in Cotton',
    1: 'Corn___Northern_Leaf_Blight',
    2: 'RedRust sugarcane',
    3: 'Grape___healthy',
    4: 'Healthy Maize',
    5: 'Orange___Haunglongbing_(Citrus_greening)',
    6: 'Wheat___Yellow_Rust',
    7: 'Pepper__bell___Bacterial_spot',
    8: 'Tungro',
    9: 'Soybean___healthy',
    10: 'Wheat mite',
    11: 'Anthracnose on Cotton',
    12: 'Healthy Wheat',
    13: 'Squash___Powdery_mildew',
    14: 'Cotton Aphid',
    15: 'Common_Rust',
    16: 'Background_without_leaves',
    17: 'Potato___healthy',
    18: 'American Bollworm on Cotton',
    19: 'fresh cotton plant',
    20: 'Tomato_Leaf_Mold',
    21: 'Yellow Rust Sugarcane',
    22: 'Flag Smut',
    23: 'Tomato__Tomato_YellowLeaf__Curl_Virus',
    24: 'Corn___healthy',
    25: 'fresh cotton leaf',
    26: 'Wheat scab',
    27: 'Strawberry___Leaf_scorch',
    28: 'Army worm',
    29: 'cotton whitefly',
    30: 'Peach___healthy',
    31: 'Wheat leaf blight',
    32: 'Healthy cotton',
    33: 'Wilt',
    34: 'Tomato_Bacterial_spot',
    35: 'bollrot on Cotton',
    36: 'Apple___Apple_scab',
    37: 'Rice Blast',
    38: 'Becterial Blight in Rice',
    39: 'Tomato_Septoria_leaf_spot',
    40: 'Tomato_healthy',
    41: 'diseased cotton plant',
    42: 'cotton mealy bug',
    43: 'maize ear rot',
    44: 'Tomato_Spider_mites_Two_spotted_spider_mite',
    45: 'Tomato_Early_blight',
    46: 'Apple___Black_rot',
    47: 'Wheat Stem fly',
    48: 'Blueberry___healthy',
    49: 'Cherry___Powdery_mildew',
    50: 'Peach___Bacterial_spot',
    51: 'Tomato__Target_Spot',
    52: 'Apple___Cedar_apple_rust',
    53: 'Tomato___Target_Spot',
    54: 'Mosaic sugarcane',
    55: 'Sugarcane Healthy',
    56: 'Pepper__bell___healthy',
    57: 'red cotton bug',
    58: 'Pepper,_bell___healthy',
    59: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    60: 'Potato___Late_blight',
    61: 'Corn___Cercospora_leaf_spot Gray_leaf_spot',
    62: 'maize stem borer',
    63: 'Brownspot',
    64: 'bollworm on Cotton',
    65: 'pink bollworm in cotton',
    66: 'Strawberry___healthy',
    67: 'Leaf Curl',
    68: 'Corn___Common_rust',
    69: 'Apple___healthy',
    70: 'Grape___Black_rot',
    71: 'Wheat aphid',
    72: 'Tomato_Late_blight',
    73: 'diseased cotton leaf',
    74: 'Potato___Early_blight',
    75: 'maize fall armyworm',
    76: 'Wheat Brown leaf Rust',
    77: 'Leaf smut',
    78: 'Grape___Esca_(Black_Measles)',
    79: 'Wheat black rust',
    80: 'Raspberry___healthy',
    81: 'thirps on cotton',
    82: 'Tomato__Tomato_mosaic_virus',
    83: 'Cherry___healthy',
    84: 'RedRot sugarcane',
    85: 'Tomato___Spider_mites Two-spotted_spider_mite',
    86: 'Pepper,_bell___Bacterial_spot',
    87: 'Gray_Leaf_Spot',
    88: 'Wheat powdery mildew'
}

# -----------------------------
# Helper Functions
# -----------------------------
def predict_disease(img_path):
    """
    Loads and preprocesses the image, then returns the predicted disease index.
    """
    img = image.load_img(img_path, target_size=(150, 150))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0  # Normalize
    predictions = model_disease.predict(img_array)
    predicted_class = np.argmax(predictions, axis=1)
    return predicted_class[0]

def get_disease_info(disease_name):
    """
    Returns comprehensive details about a specific crop disease.
    """
    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages=[
            {"role": "system", "content": "You are an expert on crop diseases and agriculture."},
            {"role": "user", "content": f"Provide comprehensive details about {disease_name}. Include introduction, causes, prevention methods, danger level, recommended pesticides, and any images if available."}
        ],
        max_tokens=100
    )
    return response.choices[0].message.content

def get_healthy_advice():
    """
    Returns advice on how to maintain healthy crops.
    """
    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages=[
            {"role": "system", "content": "You are an expert on crop care and agriculture."},
            {"role": "user", "content": "My crop is healthy. How can I ensure it remains healthy and prevent diseases?"}
        ],
        max_tokens=100
    )
    return response.choices[0].message.content

# -----------------------------
# Flask App & Endpoints
# -----------------------------
app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Expects a multipart/form-data POST request with the image file under the key "image".
    Returns the predicted disease class and name.
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
        predicted_class = predict_disease(temp_path)
        predicted_disease = label_dict.get(predicted_class, "Unknown")
        response_data = {
            "predicted_class": int(predicted_class),
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
    Returns a chat response.
    """
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "No prompt provided."}), 400

    prompt = data["prompt"]
    # (For chat we continue to use the same logic as before.)
    system_message = (
        "You are KrishiSahay, an AI assistant specialized in crop management, "
        "crop diseases, healthy plant practices, and crop-related advice. "
        "You will only answer questions related to crops and agriculture."
    )
    
    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        max_tokens=100
    )
    return jsonify({"response": response.choices[0].message.content})

# -----------------------------
# Run the App
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
