# Digit Recognition — Full Stack App

## Project Structure

```
digit-recognition/
├── backend/
│   ├── main.py                   
│   ├── requirements.txt
│   ├── Procfile                  
│   ├── render.yaml              
│   └── digits_recognition_cnn.h5 
│
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── App.scss
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    ├── package.json
    ├── vercel.json
    └── .env.example
```

---

## Step 1 — Add Your Model

Copy your trained model file into the backend folder:

```bash
cp digits_recognition_cnn.h5 backend/digits_recognition_cnn.h5
```

---

## Step 2 — Test Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# → API running at http://localhost:8000
# → Docs at   http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.example .env.local        # keep REACT_APP_API_URL=http://localhost:8000
npm install
npm start
# → App at http://localhost:3000
```

---

## Step 3 — Deploy Backend to Render.com

1. Push the `backend/` folder to a GitHub repo (can be the same repo, in a subfolder).
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Click **Create Web Service**
8. Wait for it to build — you'll get a URL like `https://digit-recognition-api.onrender.com`

> ⚠️ **Upload model file**: Render's free tier has an ephemeral disk.  
> Options:
> - Include the `.h5` file directly in your repo (if <100 MB, fine for GitHub).
> - Or host on Google Drive and download it in a startup script.
> - Or use Render's **Disk** add-on (paid).

**Easiest approach**: just commit the `.h5` file to the repo. It's ~2 MB, totally fine.

---

## Step 4 — Deploy Frontend to Vercel

1. Push the `frontend/` folder to GitHub
2. Go to https://vercel.com → New Project → import your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-app-name.onrender.com` ← your Render URL
5. Click **Deploy**

---

## API Endpoints

| Method | Path       | Description                          |
|--------|------------|--------------------------------------|
| GET    | `/`        | Health check                         |
| GET    | `/health`  | Health check                         |
| POST   | `/predict` | Accepts `{"image": "<base64>"}`, returns digit + confidence |

### Example POST /predict response

```json
{
  "digit": 7,
  "confidence": 98.43,
  "all_probabilities": {
    "0": 0.02, "1": 0.11, "2": 0.08,
    "3": 0.05, "4": 0.12, "5": 0.03,
    "6": 0.01, "7": 98.43, "8": 0.09, "9": 0.06
  }
}
```

---

## Tips

- **Cold starts on Render free tier**: First request may take 30–60s after idle. The model is lazy-loaded on first request.
- **Drawing tips for best accuracy**: Draw the digit large, centered, with thick strokes — same style as MNIST training data.
- **CORS**: Currently set to `allow_origins=["*"]`. For production, lock it to your Vercel domain.
