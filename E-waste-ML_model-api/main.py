from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO

# Initialize the App
app = FastAPI()

# Load your model (Explicitly set task='detect' to fix the warning)
# Ensure 'best.onnx' is in the SAME folder as this file
model = YOLO("best.onnx", task="detect")

# Define the Input Format
class ImageRequest(BaseModel):
    image_url: str

# --- HOME ROUTE (Fixes the 404 Error) ---
@app.get("/")
def home():
    return {
        "message": "E-waste API is Running!",
        "instructions": "Send a POST request to /predict with a JSON body: {'image_url': 'YOUR_LINK_HERE'}"
    }

# --- PREDICTION ROUTE (Returns Confidence Only) ---
@app.post("/predict")
def get_confidence_only(request: ImageRequest):
    try:
        # 1. Download the image from the URL
        response = requests.get(request.image_url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch image from URL.")
        
        # Convert bytes to an Image object
        img = Image.open(BytesIO(response.content))

        # 2. Run YOLO Inference
        # conf=0.25 ignores weak detections below 25% confidence
        results = model(img, conf=0.25)

        # 3. Extract ONLY Label and Confidence
        scores = []
        for r in results:
            for box in r.boxes:
                # Get the class name (e.g., 'plastic_bottle')
                class_id = int(box.cls[0])
                label = model.names[class_id]
                
                # Get the confidence score (e.g., 0.95)
                confidence = round(float(box.conf[0]), 2)

                scores.append({
                    "label": label,
                    "score": confidence
                })

        # 4. Return the clean list
        return scores

    except Exception as e:
        return {"error": str(e)}