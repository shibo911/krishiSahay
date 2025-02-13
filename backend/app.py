import os
import sys
import tempfile
import requests
import urllib.parse
import time
import base64
from flask import Flask, request, jsonify, session
import tensorflow as tf
import numpy as np
from PIL import Image
import google.generativeai as genai
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from gtts import gTTS
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# New imports for database and security
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# -----------------------------
# Set ffmpeg path for pydub (if needed)
# -----------------------------
if os.name == 'nt':
    # Replace with the actual path if necessary
    AudioSegment.converter = r"C:\ffmpeg-2025-02-06-git-6da82b4485-essentials_build\ffmpeg.exe"

# -----------------------------
# Determine the Base Directory
# -----------------------------
if getattr(sys, 'frozen', False):
    bundle_dir = sys._MEIPASS
else:
    bundle_dir = os.path.dirname(os.path.abspath(__file__))

# Path to the plant disease prediction model
model_path = os.path.join(bundle_dir, 'plant_disease_prediction_model.h5')

# -----------------------------
# Configuration & Initialization
# -----------------------------
# Hardcoded API keys (not recommended for production)
GEN_AI_API_KEY = "AIzaSyDlXMPgEKz9rySMSPtsgRlyeyoti35xFLU"
GOMAPS_API_KEY = "AlzaSyH0NMUUZXYmHKHNNTNIt99pztmSxlG4NWQ"
OPENWEATHER_API_KEY = "8f357a7db28608c3a382d54f22603874"

# Configure the generative AI service
genai.configure(api_key=GEN_AI_API_KEY)
model_name = "gemini-2.0-flash-exp"
gemini_model = genai.GenerativeModel(model_name)

# Load the plant disease prediction model
try:
    model_disease = tf.keras.models.load_model(model_path)
    print("Plant disease model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# Updated human-friendly class names
classes = [
    "Apple - Apple Scab",
    "Apple - Black Rot",
    "Apple - Cedar Apple Rust",
    "Apple - Healthy",
    "Blueberry - Healthy",
    "Cherry (including sour) - Powdery Mildew",
    "Cherry (including sour) - Healthy",
    "Corn (maize) - Cercospora Leaf Spot, Gray Leaf Spot",
    "Corn (maize) - Common Rust",
    "Corn (maize) - Northern Leaf Blight",
    "Corn (maize) - Healthy",
    "Grape - Black Rot",
    "Grape - Esca (Black Measles)",
    "Grape - Leaf Blight (Isariopsis Leaf Spot)",
    "Grape - Healthy",
    "Orange - Haunglongbing (Citrus Greening)",
    "Peach - Bacterial Spot",
    "Peach - Healthy",
    "Bell Pepper - Bacterial Spot",
    "Bell Pepper - Healthy",
    "Potato - Early Blight",
    "Potato - Late Blight",
    "Potato - Healthy",
    "Raspberry - Healthy",
    "Soybean - Healthy",
    "Squash - Powdery Mildew",
    "Strawberry - Leaf Scorch",
    "Strawberry - Healthy",
    "Tomato - Bacterial Spot",
    "Tomato - Early Blight",
    "Tomato - Late Blight",
    "Tomato - Leaf Mold",
    "Tomato - Septoria Leaf Spot",
    "Tomato - Spider Mites (Two-spotted Spider Mite)",
    "Tomato - Target Spot",
    "Tomato - Tomato Yellow Leaf Curl Virus",
    "Tomato - Tomato Mosaic Virus",
    "Tomato - Healthy"
]

# -----------------------------
# Helper Functions
# -----------------------------
def load_and_preprocess_image(image_path, target_size=(224, 224)):
    img = Image.open(image_path)
    img = img.resize(target_size)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array.astype('float32') / 255.0
    return img_array

def predict_disease(img_path):
    img_array = load_and_preprocess_image(img_path)
    predictions = model_disease.predict(img_array)
    predicted_class_index = int(np.argmax(predictions, axis=1)[0])
    predicted_disease = classes[predicted_class_index]
    return predicted_class_index, predicted_disease

def get_disease_info(disease_name):
    prompt = (
        f"Explain the crop disease '{disease_name}' in simple, short, and clear language that a farmer can easily understand. "
        "The answer must include exactly five sections with the following headings in the exact format provided:\n\n"
        "1. **Introduction**: A brief overview of the disease.\n"
        "2. **Causes**: What factors lead to this disease.\n"
        "3. **Prevention Methods**: How to prevent or reduce the risk of the disease.\n"
        "4. **Danger Level**: How severe or harmful the disease is.\n"
        "5. **Recommended Remedies**: Short suggestions for treatments such as pesticides or fertilizers.\n\n"
        "Ensure your answer starts with '1. **Introduction**:' and that no section is omitted. Keep your sentences short and avoid technical jargon."
    )
    response = gemini_model.generate_content(prompt)
    return response.text

def get_healthy_advice():
    prompt = (
        "My crop is healthy. In simple and short language that a farmer can easily understand, give me a few easy tips to keep it healthy and prevent diseases."
    )
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
# Flask App & Database Setup
# -----------------------------
app = Flask(__name__)
app.secret_key = 'replace_with_a_random_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///krishisahay.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -----------------------------
# Database Models
# -----------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Rental(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    contact = db.Column(db.String(100), nullable=False)  # required phone number
    equipment_type = db.Column(db.String(100), nullable=False)
    rental_duration = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    posted_by = db.Column(db.String(80), nullable=False)
    photo = db.Column(db.String(255), nullable=True)  # optional photo field

# -----------------------------
# Endpoints for Crop-related Functionality
# -----------------------------
@app.route('/predict', methods=['POST'])
def predict_endpoint():
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
def disease_info_endpoint():
    disease_name = request.args.get('disease_name')
    if not disease_name:
        return jsonify({"error": "No disease name provided."}), 400
    try:
        info = get_disease_info(disease_name)
        return jsonify({"disease_info": info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/healthy_advice', methods=['GET'])
def healthy_advice_endpoint():
    try:
        advice = get_healthy_advice()
        return jsonify({"advice": advice})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/recommended_store_type', methods=['GET'])
def recommended_store_type_endpoint():
    disease_name = request.args.get("disease_name")
    if not disease_name:
        return jsonify({"error": "No disease name provided."}), 400
    prompt = (f"For the crop disease '{disease_name}', what is the best type of store a farmer should visit to buy treatments like pesticides or fertilizers? Provide only a short answer (for example, 'fertilizer store').")
    try:
        response = gemini_model.generate_content(prompt)
        store_type = response.text.strip()
        return jsonify({"store_type": store_type})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_endpoint():
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
        "You are KrishiSahay, an AI assistant specialized in crop management, crop diseases, healthy plant practices, and crop-related advice. "
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
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/govt_schemes', methods=['GET'])
def govt_schemes_endpoint():
    page = request.args.get("page", default="1")
    try:
        page = int(page)
    except:
        page = 1

    target_url = "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; MyScraper/1.0; +http://yourwebsite.com)"}
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(target_url)
    time.sleep(5)

    if page > 1:
        try:
            page_xpath = f"//ul[contains(@class,'list-none') and contains(@class,'flex')]/li[normalize-space(text())='{page}']"
            page_button = driver.find_element("xpath", page_xpath)
            driver.execute_script("arguments[0].click();", page_button)
            time.sleep(3)
        except Exception as e:
            print(f"DEBUG: Could not navigate to page {page}: {e}")
            driver.quit()
            return jsonify({"schemes": []})

    html = driver.page_source
    driver.quit()
    soup = BeautifulSoup(html, "html.parser")
    candidate_cards = soup.find_all("div", class_="flex flex-col")
    
    schemes = []
    base_url = "https://www.myscheme.gov.in"
    for card in candidate_cards:
        a_tag = card.find("a", href=True)
        if a_tag and a_tag.get("href", "").startswith("/schemes/"):
            title = a_tag.get_text(strip=True)
            relative_link = a_tag.get("href")
            link = urllib.parse.urljoin(base_url, relative_link)
            h2_tags = card.find_all("h2")
            ministry = h2_tags[1].get_text(strip=True) if len(h2_tags) > 1 else ""
            description_tag = card.find("span", class_=lambda v: v and "line-clamp" in v)
            description = description_tag.get_text(strip=True) if description_tag else ""
            schemes.append({
                "title": title,
                "link": link,
                "ministry": ministry,
                "description": description
            })
    return jsonify({"schemes": schemes})

@app.route('/store_finder', methods=['GET'])
def store_finder_endpoint():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    store_type = request.args.get("store_type")
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude required."}), 400
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided."}), 400

    query = f"{store_type} near me" if store_type else "agriculture supply store near me"
    location_str = f"{lat},{lon}"
    radius = 50000

    params = {
        "query": query,
        "location": location_str,
        "radius": radius,
        "key": GOMAPS_API_KEY
    }

    url = "https://maps.gomaps.pro/maps/api/place/textsearch/json"

    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK":
            return jsonify({
                "error": f"GoMaps Places API error: {data.get('status')}",
                "details": data.get("error_message", "No additional details provided")
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

@app.route('/place_details', methods=['GET'])
def place_details_endpoint():
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "No place_id provided."}), 400
    url = f"https://maps.gomaps.pro/maps/api/place/details/json?place_id={urllib.parse.quote(place_id)}&key={GOMAPS_API_KEY}"
    try:
        r = requests.get(url)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK":
            return jsonify({
                "error": f"GoMaps Place Details API error: {data.get('status')}",
                "details": data.get("error_message", "No additional details provided")
            }), 500
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Error fetching place details: {e}"}), 500

@app.route('/weather', methods=['GET'])
def weather_forecast_endpoint():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude required."}), 400
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided."}), 400

    weather_url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }

    try:
        r = requests.get(weather_url, params=params)
        r.raise_for_status()
        forecast_data = r.json()
        
        crisis_mode = False
        crisis_events = []
        
        for item in forecast_data.get("list", []):
            weather_info = item.get("weather", [{}])[0]
            weather_main = weather_info.get("main", "").lower()
            forecast_time = item.get("dt_txt", "Unknown time")
            temp = item.get("main", {}).get("temp", None)
            wind_speed = item.get("wind", {}).get("speed", 0)
            rain = item.get("rain", {}).get("3h", 0)
            
            if weather_main in ["thunderstorm", "tornado"]:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": weather_main.title()})
            if rain and rain > 20:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": "Heavy Rain"})
            if temp is not None and temp > 40:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": "Extreme Heat"})
            if temp is not None and temp < 5:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": "Severe Cold"})
            if wind_speed and wind_speed > 20:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": "High Winds"})
            if weather_main in ["dust", "sand", "ash"] and wind_speed > 10:
                crisis_mode = True
                crisis_events.append({"time": forecast_time, "condition": "Dust/Sand Storm"})
        
        forecast_data["crisis_mode"] = crisis_mode
        forecast_data["crisis_events"] = crisis_events
        
        return jsonify(forecast_data)
    except Exception as e:
        print("Error in /weather endpoint:", e)
        return jsonify({"error": str(e)}), 500

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
def disease_prediction_html():
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
# Registration, Login & Rental Endpoints
# -----------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No registration data provided."}), 400
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
    password_hash = generate_password_hash(password)
    new_user = User(username=username, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully."})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No login data provided."}), 400
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        session['logged_in'] = True
        session['username'] = username
        return jsonify({"message": "Login successful."})
    else:
        return jsonify({"error": "Invalid credentials."}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."})

@app.route('/rentals', methods=['GET'])
def get_rentals():
    rentals = Rental.query.all()
    rental_list = []
    for rental in rentals:
        rental_list.append({
            "id": rental.id,
            "title": rental.title,
            "description": rental.description,
            "price": rental.price,
            "contact": rental.contact,
            "equipment_type": rental.equipment_type,
            "rental_duration": rental.rental_duration,
            "location": rental.location,
            "posted_by": rental.posted_by,
            "photo": rental.photo
        })
    return jsonify({"rentals": rental_list})

@app.route('/rentals', methods=['POST'])
def add_rental():
    if not session.get('logged_in'):
        return jsonify({"error": "Authentication required to add rental."}), 401
    # Support both JSON and multipart/form-data
    if request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
    else:
        data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    price = data.get('price')
    contact = data.get('contact')
    equipment_type = data.get('equipment_type')
    rental_duration = data.get('rental_duration')
    location = data.get('location')
    if not title or not description or price is None or not contact or not equipment_type or not rental_duration or not location:
         return jsonify({"error": "Missing required rental information. All fields are required."}), 400
    try:
        price = float(price)
    except:
        return jsonify({"error": "Price must be a number."}), 400
    new_rental = Rental(
        title=title,
        description=description,
        price=price,
        contact=contact,
        equipment_type=equipment_type,
        rental_duration=rental_duration,
        location=location,
        posted_by=session.get('username')
    )
    # Process optional photo upload
    if 'photo' in request.files:
        photo_file = request.files['photo']
        if photo_file.filename != "":
            uploads_dir = os.path.join(bundle_dir, "uploads")
            if not os.path.exists(uploads_dir):
                os.makedirs(uploads_dir)
            file_path = os.path.join(uploads_dir, photo_file.filename)
            photo_file.save(file_path)
            new_rental.photo = file_path
    db.session.add(new_rental)
    db.session.commit()
    return jsonify({
        "message": "Rental added successfully.",
        "rental": {
            "id": new_rental.id,
            "title": new_rental.title,
            "description": new_rental.description,
            "price": new_rental.price,
            "contact": new_rental.contact,
            "equipment_type": new_rental.equipment_type,
            "rental_duration": new_rental.rental_duration,
            "location": new_rental.location,
            "posted_by": new_rental.posted_by,
            "photo": new_rental.photo
        }
    })

# -----------------------------
# Main
# -----------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
