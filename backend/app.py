import os
import sys
import tempfile
import requests  # For HTTP requests (now to GoMaps.pro)
import urllib.parse
from flask import Flask, request, jsonify, send_file
import tensorflow as tf
import numpy as np
from PIL import Image
import google.generativeai as genai
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from gtts import gTTS
import base64

# -----------------------------
# Set ffmpeg path for pydub (if needed)
# -----------------------------
if os.name == 'nt':  # Windows
    # Replace with the actual path to your ffmpeg.exe if necessary
    AudioSegment.converter = r"C:\ffmpeg-2025-02-06-git-6da82b4485-essentials_build\ffmpeg.exe"

# -----------------------------
# Determine the Base Directory for Data Files
# -----------------------------
if getattr(sys, 'frozen', False):
    bundle_dir = sys._MEIPASS
else:
    bundle_dir = os.path.dirname(os.path.abspath(__file__))

# Absolute path to the plant disease prediction model
model_path = os.path.join(bundle_dir, 'plant_disease_prediction_model.h5')

# -----------------------------
# Configuration & Initialization
# -----------------------------
GEN_AI_API_KEY = "AIzaSyDlXMPgEKz9rySMSPtsgRlyeyoti35xFLU"  # Replace with your actual Gemini API key
genai.configure(api_key=GEN_AI_API_KEY)
model_name = "gemini-2.0-flash-exp"  # Change if needed
gemini_model = genai.GenerativeModel(model_name)

# Load your pre-trained plant disease model
try:
    model_disease = tf.keras.models.load_model(model_path)
    print("Plant disease model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# -----------------------------
# Classes List
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
# Helper Functions
# -----------------------------
def load_and_preprocess_image(image_path, target_size=(224, 224)):
    img = Image.open(image_path)
    img = img.resize(target_size)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array.astype('float32') / 255.0  # Normalize
    return img_array

def predict_disease(img_path):
    img_array = load_and_preprocess_image(img_path)
    predictions = model_disease.predict(img_array)
    predicted_class_index = int(np.argmax(predictions, axis=1)[0])
    predicted_disease = classes[predicted_class_index]
    return predicted_class_index, predicted_disease

def get_disease_info(disease_name):
    prompt = (f"Provide comprehensive details about {disease_name}. "
              "Include introduction, causes, prevention methods, danger level, "
              "and recommended pesticides, fertilizers, or herbicides if available.")
    response = gemini_model.generate_content(prompt)
    return response.text

def get_healthy_advice():
    prompt = "My crop is healthy. How can I ensure it remains healthy and prevent diseases?"
    response = gemini_model.generate_content(prompt)
    return response.text

def transcribe_audio(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            raise ValueError("Audio is not clear or unrecognizable.")
        except sr.RequestError as e:
            raise RuntimeError(f"Speech Recognition service error: {e}")

# -----------------------------
# Flask App & Endpoints
# -----------------------------
app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No image file provided."}), 400
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
    try:
        advice = get_healthy_advice()
        return jsonify({"advice": advice})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/recommended_store_type', methods=['GET'])
def recommended_store_type():
    """
    For a given disease, ask Gemini API what type of store a farmer should visit
    to obtain remedy products. The answer is a short text (for example, "fertilizer store").
    """
    disease_name = request.args.get("disease_name")
    if not disease_name:
        return jsonify({"error": "No disease name provided."}), 400
    prompt = (f"For the crop disease '{disease_name}', what is the best type of store a farmer "
              f"should visit to purchase remedy products (such as pesticides, fertilizers, or herbicides)? "
              f"Provide only a short answer (for example, 'fertilizer store').")
    try:
        response = gemini_model.generate_content(prompt)
        store_type = response.text.strip()
        return jsonify({"store_type": store_type})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    if 'audio' in request.files:
        file = request.files["audio"]
        if file.filename == "":
            return jsonify({"error": "No audio file provided."}), 400
        temp_path = os.path.join(tempfile.gettempdir(), file.filename)
        file.save(temp_path)
        if not file.filename.lower().endswith('.wav'):
            try:
                sound = AudioSegment.from_file(temp_path)
                wav_path = os.path.splitext(temp_path)[0] + ".wav"
                sound.export(wav_path, format="wav")
                audio_path = wav_path
            except Exception as e:
                return jsonify({"error": f"Audio conversion error: {e}"}), 500
        else:
            audio_path = temp_path
        try:
            prompt = transcribe_audio(audio_path)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        language = request.form.get("language", "en")
        read_aloud = request.form.get("read_aloud", "false").lower() == "true"
    else:
        data = request.get_json()
        if not data or "prompt" not in data:
            return jsonify({"error": "No prompt provided."}), 400
        prompt = data["prompt"]
        language = data.get("language", "en")
        read_aloud = data.get("read_aloud", False)

    system_message = (
        "You are KrishiSahay, an AI assistant specialized in crop management, "
        "crop diseases, healthy plant practices, and crop-related advice. "
        "You will only answer questions related to crops and agriculture."
    )
    prompt_with_context = f"{system_message}\nUser: {prompt}"
    try:
        response = gemini_model.generate_content(prompt_with_context)
        text_response = response.text
        if read_aloud:
            tts = gTTS(text=text_response, lang=language)
            mp3_fp = BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            audio_bytes = mp3_fp.read()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            audio_data_url = f"data:audio/mpeg;base64,{audio_b64}"
        else:
            audio_data_url = ""
        result = {
            "response": text_response,
            "audio_response": audio_data_url
        }
        if 'audio' in request.files:
            result["user_transcription"] = prompt
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------------------------------------------------------
# New Endpoint: Map-Based Local Store Finder Using GoMaps.pro Text Search API
# ------------------------------------------------------------------------------
@app.route('/store_finder', methods=['GET'])
def store_finder():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    store_type = request.args.get("store_type")  # e.g., "fertilizer store"
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude required."}), 400
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided."}), 400

    # Build the query string. If a recommended store type is provided, use it.
    if store_type:
        query = f"{store_type} near me"
    else:
        query = "agriculture supply store near me"

    # Create a location bias string: "lat,lon"
    location_str = f"{lat},{lon}"
    radius = 50000  # up to 50,000 meters

    # Build the parameters for the GoMaps.pro Text Search API.
    params = {
        "query": query,
        "location": location_str,
        "radius": radius,
        "key": "AlzaSyfcloyQHdKevkRd44l5mCDEMkVFV89-M8u"  # <-- Replace with your actual GoMaps.pro API key
    }

    url = "https://maps.gomaps.pro/maps/api/place/textsearch/json"

    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK":
            return jsonify({
                "error": f"GoMaps Places API error: {data.get('status')}",
                "details": data.get("error_message")
            }), 500
        results = data.get("results", [])
        stores = []
        for result in results:
            store = {
                "name": result.get("name"),
                "address": result.get("formatted_address"),
                "lat": result.get("geometry", {}).get("location", {}).get("lat"),
                "lon": result.get("geometry", {}).get("location", {}).get("lng"),
                "place_id": result.get("place_id")
            }
            stores.append(store)
        return jsonify({"stores": stores})
    except Exception as e:
        return jsonify({"error": f"Error fetching store data: {e}"}), 500

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>KrishiSahay Chat</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .response { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
            .speaker-button { cursor: pointer; margin-left: 10px; font-size: 18px; }
            textarea { width: 80%; }
        </style>
    </head>
    <body>
        <h1>KrishiSahay Chat</h1>
        <textarea id="prompt" rows="4" placeholder="Type your query about crops..."></textarea><br>
        <button onclick="sendPrompt()">Send</button>
        <div id="chat-responses"></div>
        <script>
            function sendPrompt() {
                const prompt = document.getElementById('prompt').value;
                fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt, read_aloud: true, language: 'en' })
                })
                .then(response => response.json())
                .then(data => {
                    const chatDiv = document.getElementById('chat-responses');
                    let responseHtml = '<div class="response">';
                    responseHtml += '<p>' + data.response + '</p>';
                    responseHtml += '<button class="speaker-button" onclick="playAudio(\\'' + data.audio_response + '\\')">&#128266;</button>';
                    responseHtml += '</div>';
                    chatDiv.innerHTML = responseHtml + chatDiv.innerHTML;
                })
                .catch(error => console.error('Error:', error));
            }
            
            function playAudio(audioDataUrl) {
                if (audioDataUrl) {
                    var audio = new Audio(audioDataUrl);
                    audio.play();
                } else {
                    var responses = document.getElementsByClassName('response');
                    if (responses.length > 0) {
                        var text = responses[0].getElementsByTagName('p')[0].innerText;
                        var msg = new SpeechSynthesisUtterance(text);
                        window.speechSynthesis.speak(msg);
                    }
                }
            }
        </script>
    </body>
    </html>
    '''

@app.route('/disease_prediction')
def disease_prediction():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
      <title>Disease Prediction</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
      </style>
    </head>
    <body>
      <h1>Disease Prediction</h1>
      <h2>Pick an Image</h2>
      <form id="uploadForm" enctype="multipart/form-data">
        <input type="file" id="imageFile" name="image" accept="image/*"><br><br>
        <button type="button" onclick="uploadImage()">Upload Image</button>
      </form>
      <hr>
      <h2>Or Capture an Image</h2>
      <video id="video" width="300" height="200" autoplay></video><br>
      <button id="captureButton">Capture</button>
      <canvas id="canvas" width="300" height="200" style="display:none;"></canvas><br>
      <button id="submitCapture" style="display:none;" onclick="submitCapturedImage()">Submit Captured Image</button>
      <div id="result"></div>
      <script>
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const captureButton = document.getElementById('captureButton');
      const submitCapture = document.getElementById('submitCapture');
      const resultDiv = document.getElementById('result');
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
              video.srcObject = stream;
              video.play();
          });
      }
      captureButton.addEventListener('click', function() {
          const context = canvas.getContext('2d');
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.style.display = 'block';
          submitCapture.style.display = 'inline-block';
      });
      function submitCapturedImage() {
          canvas.toBlob(function(blob) {
              const formData = new FormData();
              formData.append('image', blob, 'captured.png');
              fetch('/predict', {
                  method: 'POST',
                  body: formData
              })
              .then(response => response.json())
              .then(data => {
                  resultDiv.innerHTML = '<h3>Prediction Result</h3><p>Predicted Disease: ' + data.predicted_disease + '</p>';
              })
              .catch(error => {
                  resultDiv.innerHTML = 'Error: ' + error;
              });
          }, 'image/png');
      }
      function uploadImage() {
          const fileInput = document.getElementById('imageFile');
          if(fileInput.files.length === 0) {
              alert("Please select an image file.");
              return;
          }
          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          fetch('/predict', {
              method: 'POST',
              body: formData
          })
          .then(response => response.json())
          .then(data => {
              resultDiv.innerHTML = '<h3>Prediction Result</h3><p>Predicted Disease: ' + data.predicted_disease + '</p>';
          })
          .catch(error => {
              resultDiv.innerHTML = 'Error: ' + error;
          });
      }
      </script>
    </body>
    </html>
    '''

# -----------------------------
# Run the App
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
