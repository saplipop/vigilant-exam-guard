# 🚀 ProctorAI – AI-Powered Exam Proctoring System

🌐 **Live Demo:** https://velvety-marigold-7d3ce7.netlify.app/

ExamEye is a modern AI-powered online exam proctoring system designed to detect cheating in real-time using computer vision, browser APIs, and smart behavior analysis. It provides a seamless exam experience for students while giving admins powerful monitoring tools.

---

## ✨ Features

### 🎓 Student Side

* Secure authentication
* Pre-exam system check (camera, mic, environment)
* Fullscreen exam interface
* Timer-based auto submission
* MCQ + subjective questions

### 🧠 AI Cheating Detection

* 👁️ Face detection (missing / multiple faces)
* 👀 Eye tracking (looking away detection)
* 🖥️ Tab switching detection
* 🔊 Noise / voice detection
* ⌨️ Copy-paste & right-click blocking
* 📊 Real-time risk scoring

### ⚠️ Smart Actions

* Live warning alerts
* Auto submit on high risk
* Exam lock for repeated violations

### 📹 Monitoring

* Webcam tracking
* Suspicious activity capture
* Event logs

### 🧑‍💼 Admin Dashboard

* Live student monitoring
* Risk score tracking
* Activity timeline

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Framer Motion

### Backend / Database

* Supabase (Auth + Database + Realtime)

### AI / Detection (Open Source)

* MediaPipe
* face-api.js
* TensorFlow.js

### Browser APIs

* WebRTC (camera access)
* Web Audio API (noise detection)
* Page Visibility API

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/proctorai.git
cd ExamEye
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4️⃣ Run Locally

```bash
npm run dev
```

---

## 🌍 Deployment

* **Frontend:** Netlify
* **Backend/DB:** Supabase

To deploy:

```bash
npm run build
```

Upload the `dist/` folder to Netlify or connect your GitHub repo for auto-deploy.

---

## 📊 Risk Scoring System

| Event            | Score |
| ---------------- | ----- |
| Tab Switch       | +10   |
| Face Not Visible | +15   |
| Multiple Faces   | +25   |
| Looking Away     | +5    |
| Noise Detected   | +10   |

**Levels:**

* 0–20 → Safe
* 20–50 → Suspicious
* 50+ → High Risk

---

## 🎨 UI Highlights

* Modern SaaS-style interface
* Smooth animations
* Responsive design
* Clean dashboard layout

---

## 🔮 Future Improvements

* Advanced AI behavior analysis
* Voice assistant warnings
* Multi-device detection
* Enhanced reporting system

---

## 🤝 Contributing

Feel free to fork and improve the project. Suggestions and improvements are welcome!

---

💡 **Note:**
For best performance, ensure stable internet, proper lighting, and uninterrupted webcam access during exams.
