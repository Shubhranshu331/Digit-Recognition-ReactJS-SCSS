import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.scss";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [offsetY, setOffsetY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  // Canvas / prediction state
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [allProbs, setAllProbs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Parallax scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset);
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fade-in observer
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    setHasDrawn(true);
    setPrediction(null);
    setConfidence(null);
    setAllProbs(null);
    setError(null);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, []);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
    setConfidence(null);
    setAllProbs(null);
    setError(null);
    setHasDrawn(false);
  };

  const predict = async () => {
    if (!hasDrawn) {
      setError("Please draw a digit first!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");
      const res = await axios.post(`${API_URL}/predict`, { image: imageData });
      setPrediction(res.data.digit);
      setConfidence(res.data.confidence);
      setAllProbs(res.data.all_probabilities);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Backend unreachable. Make sure the API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="Parallax">
      {/* Progress Bar */}
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Scroll to Top */}
      {showTop && (
        <button
          className="top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑ Top
        </button>
      )}

      {/* Parallax Background Layers */}
      <div
        className="Parallax__background"
        style={{ transform: `translateY(-${offsetY * 0.5}px)` }}
      />
      <div
        className="Parallax__background-triangles"
        style={{ transform: `translateY(${offsetY * 0.8}px)` }}
      />

      {/* ── HERO ── */}
      <div className="Parallax__content">
        <div className="Parallax__content__heading fade-in">
          <div className="hero-badge">✦ MNIST CNN · ~99% Accuracy</div>
          <h1 className="Parallax__content__heading__text">
            Digit<br />
            <span className="accent">Recognition</span>
          </h1>
          <h2 className="Parallax__content__heading__caption">
            Draw any handwritten digit and watch a Convolutional Neural Network
            identify it in real time — powered by FastAPI and TensorFlow.
          </h2>
          <div className="hero-actions">
            <button className="explore-btn primary" onClick={scrollToDemo}>
              Try the Demo ↓
            </button>
            <a
              className="explore-btn secondary"
              href="https://github.com/Shubhranshu331"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        {/* ── ABOUT ── */}
        <div className="Parallax__content__cta fade-in" id="about">
          <div className="section-label">About the Project</div>
          <h3>How It Works</h3>
          <p>
            A CNN trained on the MNIST dataset — 60,000 handwritten digit images
            — learns spatial features through convolutional and pooling layers,
            achieving <strong>~99% validation accuracy</strong>.
          </p>
          <p>
            You draw on the canvas, the image is sent as base64 to a FastAPI
            backend, preprocessed to match MNIST's 28×28 grayscale format, and
            the model returns a prediction with confidence scores for all 10 digits.
          </p>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-value">99%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat-value">60K</span>
              <span className="stat-label">Training Images</span>
            </div>
            <div className="stat">
              <span className="stat-value">10</span>
              <span className="stat-label">Output Classes</span>
            </div>
            <div className="stat">
              <span className="stat-value">CNN</span>
              <span className="stat-label">Architecture</span>
            </div>
          </div>
        </div>

        {/* ── LIVE DEMO ── */}
        <div className="Parallax__content__cta demo-section fade-in" id="demo">
          <div className="section-label">Live Demo</div>
          <h3>Draw a Digit</h3>
          <p className="demo-subtitle">
            Use your mouse or finger to draw any digit (0–9) on the canvas below.
          </p>

          <div className="demo-layout">
            <div className="canvas-wrapper">
              <div className="canvas-label">Draw here ✏️</div>
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="digit-canvas"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              <div className="canvas-actions">
                <button
                  className="explore-btn primary"
                  onClick={predict}
                  disabled={loading}
                >
                  {loading ? "Predicting…" : "🔍 Predict"}
                </button>
                <button className="explore-btn secondary" onClick={clearCanvas}>
                  🗑 Clear
                </button>
              </div>
            </div>

            <div className="result-panel">
              {error && <div className="result-error">{error}</div>}

              {prediction !== null && (
                <>
                  <div className="result-digit">{prediction}</div>
                  <div className="result-label">Predicted Digit</div>
                  <div className="confidence-bar-wrapper">
                    <div className="confidence-bar-label">
                      Confidence: <strong>{confidence ? confidence.toFixed(1) : 0}%</strong>
                    </div>
                    <div className="confidence-bar-track">
                      <div
                        className="confidence-bar-fill"
                        style={{ width: `${confidence || 0}%` }}
                      />
                    </div>
                  </div>

                  {allProbs && (
                    <div className="prob-grid">
                      {Object.entries(allProbs).map(([digit, prob]) => (
                        <div
                          key={digit}
                          className={`prob-cell ${parseInt(digit) === prediction ? "active" : ""
                            }`}
                        >
                          <span className="prob-digit">{digit}</span>
                          <div className="prob-bar-track">
                            <div
                              className="prob-bar-fill"
                              style={{ height: `${prob}%` }}
                            />
                          </div>
                          <span className="prob-pct">{prob.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {prediction === null && !error && (
                <div className="result-placeholder">
                  <div className="placeholder-icon">🧠</div>
                  <p>Draw a digit and hit Predict</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TECH STACK ── */}
        <div className="Parallax__content__cta tech-section fade-in">
          <div className="section-label">Tech Stack</div>
          <h3>Built With</h3>
          <div className="tech-grid">
            {[
              { name: "React.js", desc: "Frontend UI + parallax", icon: "⚛️" },
              { name: "SCSS", desc: "Modular styling", icon: "🎨" },
              { name: "FastAPI", desc: "Python REST backend", icon: "⚡" },
              { name: "TensorFlow", desc: "CNN model + inference", icon: "🧠" },
              { name: "Pillow", desc: "Image preprocessing", icon: "🖼️" },
              { name: "Vercel", desc: "Frontend deployment", icon: "▲" },
              { name: "Render.com", desc: "Backend hosting", icon: "☁️" },
              { name: "Axios", desc: "HTTP client", icon: "🔗" },
            ].map((t) => (
              <div key={t.name} className="tech-card">
                <span className="tech-icon">{t.icon}</span>
                <strong>{t.name}</strong>
                <span>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── GITHUB ── */}
        <div className="Parallax__content__cta github-section fade-in">
          <div className="section-label">Open Source</div>
          <h3>View the Source</h3>
          <p>
            Full source code including the trained model, FastAPI backend, and
            React frontend are available on GitHub.
          </p>
          <div className="hero-actions">
            <a
              className="explore-btn primary"
              href="https://github.com/Shubhranshu331"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
            <a
              className="explore-btn secondary"
              href="https://portfolio-pied-seven-64.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              Portfolio ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
