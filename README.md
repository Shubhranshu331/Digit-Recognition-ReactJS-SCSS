# Handwritten Digit Recognition — Full Stack Web App

> **Draw any digit. Get an instant AI prediction.**
> A CNN trained on MNIST, served via FastAPI, and delivered through a React + SCSS parallax web app — fully deployed and live.

** Live Demo → [digit-recognition-react-js-scss.vercel.app](https://digit-recognition-react-js-scss.vercel.app/)**

---

## What This Project Does

You open the app in any browser, draw a handwritten digit (0–9) on the canvas using your mouse or finger, click **Predict**, and within a second the app tells you:

- The predicted digit
- The model's confidence percentage (as a progress bar)
- The full probability distribution across all 10 digit classes (as a bar chart)

No installation. No setup. Works on desktop and mobile.

---

## How It Works

```
User draws on canvas
        ↓
React encodes it as base64 PNG
        ↓
Axios sends POST /predict to FastAPI backend (Render)
        ↓
Backend runs 10-step preprocessing pipeline
  (RGBA flatten → threshold → crop → square-pad → border-pad → smooth → LANCZOS 28×28 → normalise)
        ↓
TensorFlow CNN model runs inference
        ↓
JSON response: { digit, confidence, all_probabilities }
        ↓
React renders result panel with confidence bar + probability grid
```

---

## Project Structure

```
digit-recognition/
├── backend/
│   ├── main.py                     ← FastAPI app + preprocessing pipeline + /predict endpoint
│   ├── digits_recognition_cnn.h5   ← Trained CNN model (~500 KB)
│   ├── requirements.txt
│   └── .python-version             ← Python 3.11.9
│
├── frontend/
│   ├── src/
│   │   ├── App.js                  ← React app — canvas, prediction state, parallax scroll
│   │   ├── App.scss                ← All styling — variables, canvas, result panel, prob grid
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## The CNN Model

Trained from scratch in a **Kaggle Jupyter Notebook** on the [Digit Recognizer dataset](https://www.kaggle.com/c/digit-recognizer) (MNIST-derived).

| Property | Value |
|---|---|
| Framework | TensorFlow 2.15.0 / Keras 3.3.3 |
| Architecture | 2× Conv2D → 2× MaxPool → Flatten → Dense(128) → Dense(10, softmax) |
| Total parameters | 37,610 |
| Optimiser | Adam (lr = 0.001) |
| Loss | Sparse Categorical Cross-Entropy |
| Epochs | 10 |
| Training accuracy | **99.70%** |
| Validation accuracy | **98.74%** |
| Model file | `digits_recognition_cnn.h5` (~500 KB) |

### Per-Epoch Training Results

| Epoch | Train Loss | Train Acc | Val Loss | Val Acc |
|-------|-----------|-----------|----------|---------|
| 1 | 0.5744 | 82.24% | 0.1009 | 96.85% |
| 2 | 0.1001 | 96.83% | 0.0620 | 98.15% |
| 3 | 0.0689 | 97.87% | 0.0527 | 98.40% |
| 5 | 0.0444 | 98.55% | 0.0546 | 98.44% |
| 7 | 0.0299 | 99.08% | 0.0483 | 98.75% |
| 10 | 0.0219 | **99.30%** | 0.0484 | **98.74%** |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React.js | 18.2.0 |
| Styling | SCSS (Sass) | 1.67.0 |
| HTTP client | Axios | 1.16.1 |
| Backend | FastAPI | 0.111.0 |
| ML framework | TensorFlow / Keras | 2.16.1 |
| Image processing | Pillow | 10.4.0 |
| ASGI server | Uvicorn | 0.29.0 |
| Frontend deploy | Vercel | — |
| Backend deploy | Render.com | — |
| Python | 3.11.9 | — |

---

## Running Locally

### 1. Clone

```bash
git clone https://github.com/Shubhranshu331/Digit-Recognition-ReactJS-SCSS.git
cd Digit-Recognition-ReactJS-SCSS
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local        # REACT_APP_API_URL=http://localhost:8000
npm install
npm start
```

App runs at `http://localhost:3000`

---

## Deployment

### Backend → Render.com

1. Push repo to GitHub
2. Render → **New Web Service** → connect repo
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Copy the generated Render URL

### Frontend → Vercel

1. Vercel → **New Project** → import repo
2. Root directory: `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-app.onrender.com`
4. Deploy

 **Cold starts**: Render's free tier spins down after inactivity. First request may take 30–60s. Subsequent requests are fast.

---

## API Reference

### `POST /predict`

**Request:**
```json
{ "image": "<base64-encoded PNG from canvas>" }
```

**Response:**
```json
{
  "digit": 7,
  "confidence": 98.43,
  "all_probabilities": {
    "0": 0.02, "1": 0.11, "2": 0.08, "3": 0.05, "4": 0.12,
    "5": 0.03, "6": 0.01, "7": 98.43, "8": 0.09, "9": 0.06
  }
}
```

### `GET /health`
Returns `{ "status": "healthy" }` — used by Render for health checks.

---

## Screenshots

| Home / Hero | Result Panel |
|---|---|---|
| <img width="1366" height="768" alt="Screenshot (147)" src="https://github.com/user-attachments/assets/462f66ec-0cbd-4b5d-bd4d-f57cd53596c0" /> | <img width="1366" height="768" alt="Screenshot (148)" src="https://github.com/user-attachments/assets/85844444-9edf-495e-8701-85cd83fca5ce" /> |

---

## Tips for Best Accuracy

- Draw the digit **large and centred** on the canvas
- Use **thick strokes** — the model was trained on thick MNIST-style digits
- **Don't rush** — let the stroke complete before clicking Predict
- If the model is wrong, try drawing the digit more centred

---

## Future Improvements

- [ ] Data augmentation during training (rotations, shifts, elastic distortions)
- [ ] Multi-digit sequence recognition via connected-component segmentation
- [ ] TensorFlow.js conversion for fully client-side inference (no cold starts)
- [ ] User feedback loop to collect real-world canvas training data
- [ ] Deeper CNN (ResNet-style) to push accuracy above 99.5%

---

## License

MIT — free to use, modify, and distribute.

---

**Built independently by [Shubhranshu](https://github.com/Shubhranshu331)**
*No institutional affiliation. Just curiosity and code.*
