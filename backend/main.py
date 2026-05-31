from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import base64
import io
import os
from PIL import Image, ImageOps, ImageFilter

# Lazy-load TensorFlow to speed up cold starts on Render
model = None

def load_model():
    global model
    if model is None:
        import tensorflow as tf
        model_path = os.environ.get("MODEL_PATH", "digits_recognition_cnn.h5")
        model = tf.keras.models.load_model(model_path)
    return model

app = FastAPI(title="Digit Recognition API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    image: str  # base64 encoded PNG from canvas


@app.get("/")
def root():
    return {"status": "ok", "message": "Digit Recognition API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/predict")
async def predict(req: PredictRequest):
    try:
        # ── Step 1: Decode base64 image from canvas ──────────────────────────
        image_data = req.image
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        # ── Step 2: Open and flatten transparency onto BLACK background ───────
        # Canvas background is BLACK (#000), digit is WHITE
        # So we do NOT invert — we keep it as-is
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        background = Image.new("RGBA", image.size, (0, 0, 0, 255))  # BLACK bg
        background.paste(image, mask=image.split()[3])
        image = background.convert("L")  # grayscale

        # ── Step 3: Threshold — make it purely black and white ────────────────
        # Anything above 50 brightness = white digit pixel
        image = image.point(lambda p: 255 if p > 50 else 0)

        # ── Step 4: Crop to just the digit, removing empty black borders ─────
        bbox = image.getbbox()
        if bbox:
            image = image.crop(bbox)
        else:
            # Nothing was drawn — return error
            raise ValueError("Canvas is empty. Please draw a digit first.")

        # ── Step 5: Make it square by padding the shorter side ────────────────
        w, h = image.size
        max_side = max(w, h)
        square = Image.new("L", (max_side, max_side), 0)  # black square
        # Paste digit centered inside the square
        offset_x = (max_side - w) // 2
        offset_y = (max_side - h) // 2
        square.paste(image, (offset_x, offset_y))
        image = square

        # ── Step 6: Add padding (20%) so digit doesn't touch edges ────────────
        pad = int(max_side * 0.2)
        padded = Image.new("L", (max_side + pad * 2, max_side + pad * 2), 0)
        padded.paste(image, (pad, pad))
        image = padded

        # ── Step 7: Smooth slightly to reduce jagged edges from resizing ──────
        image = image.filter(ImageFilter.SMOOTH)

        # ── Step 8: Resize to exactly 28×28 (MNIST size) ─────────────────────
        image = image.resize((28, 28), Image.LANCZOS)

        # ── Step 9: Normalize pixel values from 0-255 to 0.0-1.0 ─────────────
        img_array = np.array(image, dtype=np.float32) / 255.0
        img_array = img_array.reshape(1, 28, 28, 1)

        # ── Step 10: Predict ──────────────────────────────────────────────────
        m = load_model()
        predictions = m.predict(img_array, verbose=0)
        predicted_digit = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100
        all_probs = {str(i): round(float(predictions[0][i]) * 100, 2) for i in range(10)}

        return {
            "digit": predicted_digit,
            "confidence": round(confidence, 2),
            "all_probabilities": all_probs,
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")