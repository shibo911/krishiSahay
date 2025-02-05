import os
import tempfile
import random
from flask import Flask, request, jsonify, send_file
import tensorflow as tf
import numpy as np
from keras.preprocessing import image
from PIL import Image
import google.generativeai as genai

# Additional imports for voice-to-text and text-to-voice functionality
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from gtts import gTTS
import base64  # For encoding audio to base64

# -----------------------------
# Configuration & Initialization
# -----------------------------
# Initialize Gemini API Key and Model
GEN_AI_API_KEY = "AIzaSyDlXMPgEKz9rySMSPtsgRlyeyoti35xFLU"  # Place your API key here
genai.configure(api_key=GEN_AI_API_KEY)
model_name = "gemini-2.0-flash-exp"  # Example, use a different model if needed
gemini_model = genai.GenerativeModel(model_name)

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
    5: 'Orange__Haunglongbing(Citrus_greening)',
    6: 'Wheat___Yellow_Rust',
    7: 'Pepper_bell__Bacterial_spot',
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
    23: 'Tomato_Tomato_YellowLeaf_Curl_Virus',
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
    56: 'Pepper_bell__healthy',
    57: 'red cotton bug',
    58: 'Pepper,bell__healthy',
    59: 'Grape__Leaf_blight(Isariopsis_Leaf_Spot)',
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
    78: 'Grape__Esca(Black_Measles)',
    79: 'Wheat black rust',
    80: 'Raspberry___healthy',
    81: 'thirps on cotton',
    82: 'Tomato__Tomato_mosaic_virus',
    83: 'Cherry___healthy',
    84: 'RedRot sugarcane',
    85: 'Tomato___Spider_mites Two-spotted_spider_mite',
    86: 'Pepper,bell__Bacterial_spot',
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
    Returns comprehensive details about a specific crop disease using Gemini API.
    """
    prompt = f"Provide comprehensive details about {disease_name}. Include introduction, causes, prevention methods, danger level, recommended pesticides, and any images if available."
    response = gemini_model.generate_content(prompt)
    return response.text

def get_healthy_advice():
    """
    Returns advice on how to maintain healthy crops using Gemini API.
    """
    prompt = "My crop is healthy. How can I ensure it remains healthy and prevent diseases?"
    response = gemini_model.generate_content(prompt)
    return response.text

def transcribe_audio(audio_path):
    """
    Transcribes the audio file at audio_path to text using Google's Speech Recognition.
    """
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
    Accepts either a JSON POST request with a "prompt" field OR a multipart/form-data POST request with an "audio" file.
    If an audio file is provided, it is transcribed and used as the prompt.
    An optional parameter "read_aloud" (true/false) determines whether to return an audio (voice) response.
    Returns a chat response from Gemini as text and, if requested, a voice (audio) response.
    """
    # Determine if this is an audio input or a text input
    if 'audio' in request.files:
        file = request.files["audio"]
        if file.filename == "":
            return jsonify({"error": "No audio file provided."}), 400

        # Save the uploaded file temporarily
        temp_path = os.path.join(tempfile.gettempdir(), file.filename)
        file.save(temp_path)

        # If the uploaded audio is not in WAV format, convert it to WAV using pydub
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

        # For audio-based requests, get language and read_aloud from form-data (defaults: English, false)
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

        # Only generate the audio response if read_aloud is True
        if read_aloud:
            tts = gTTS(text=text_response, lang=language)
            mp3_fp = BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            audio_bytes = mp3_fp.read()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            # Create a data URL for the audio file
            audio_data_url = f"data:audio/mpeg;base64,{audio_b64}"
        else:
            audio_data_url = ""

        return jsonify({
            "response": text_response,
            "audio_response": audio_data_url
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# Front-End Route with Speaker Button
# -----------------------------
@app.route('/')
def home():
    """
    Serves a simple HTML page that allows users to chat with KrishiSahay.
    Each response is displayed along with a small speaker button.
    Clicking the speaker icon will play the audio version of the response.
    """
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
                    // Add a speaker icon button that calls playAudio with the audio data URL
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
                    // Fallback: use Web Speech Synthesis to speak the latest response text
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

# -----------------------------
# Disease Prediction Front-End with Capture Image Feature
# -----------------------------
@app.route('/disease_prediction')
def disease_prediction():
    """
    Serves an HTML page that allows users to either pick an image file or capture an image using their camera.
    The selected or captured image is sent to the /predict endpoint for disease prediction.
    """
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
      // For capturing image using webcam
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const captureButton = document.getElementById('captureButton');
      const submitCapture = document.getElementById('submitCapture');
      const resultDiv = document.getElementById('result');

      // Get access to the camera
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
              video.srcObject = stream;
              video.play();
          });
      }

      captureButton.addEventListener('click', function() {
          // Draw the video frame to the canvas.
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
