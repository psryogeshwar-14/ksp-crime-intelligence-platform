# Intelligent Conversational AI for KSP Crime Database

<div align="center">

![KSP Crime Intelligence Platform](https://img.shields.io/badge/KSP-Datathon%202026-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9%2B-green?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-teal?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**An Intelligent Conversational AI & Crime Analytics Workstation for Karnataka State Police**

*Challenge 01 — Intelligent Conversational AI for KSP Crime Database | KSP Datathon 2026*

</div>

---

## 📌 Problem Statement

The State Crime Records Bureau (SCRB) manages a large and continuously expanding repository of crime-related data from **1,100+ police stations** across Karnataka. Current systems rely on static dashboards and manual queries, which severely limit real-time analytical depth, investigative efficiency, and proactive policing.

**This platform addresses all 10 challenge requirements:**

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Conversational Crime Intelligence (EN + Kannada + Voice) | ✅ |
| 2 | Criminal Network & Relationship Visualization | ✅ |
| 3 | Crime Pattern & Trend Analytics | ✅ |
| 4 | Sociological Crime Insights | ✅ |
| 5 | Criminology-Based Offender Profiling | ✅ |
| 6 | Investigator Decision Support (MO Matcher) | ✅ |
| 7 | Financial Crime & UPI Transaction Analysis | ✅ |
| 8 | Crime Forecasting & Early Warning | ✅ |
| 9 | Explainable AI & Transparent Analytics | ✅ |
| 10 | Secure Role-Based Access & Audit Governance | ✅ |

---

## 🚀 Key Features

### 🗣️ Conversational AI Interface
- Natural language chatbot supporting **English and Kannada (ಕನ್ನಡ)**
- **Voice input** with animated waveform visualizer
- Context-aware follow-up queries with conversation memory
- **PDF export** of full conversation history (browser print)
- Typing indicator with animated chat bubbles

### 🕸️ Criminal Network Analysis
- Force-directed interactive network graph (ECharts)
- Clickable nodes — opens full suspect dossier panel
- Association types: Accomplice, Financial, Phone, Vehicle, Family
- Real-time network expansion by suspect ID

### 📍 Crime Hotspot Map
- Leaflet.js interactive map of Karnataka
- **Pulsing colored markers** — Red (high risk), Amber (medium), Green (low)
- Crime density clustering with popup details
- Socio-economic overlay per district

### 💸 Financial Crime & UPI Trail Analysis
- Flagged UPI transaction table with risk levels
- **Sankey Money Laundering Flow Diagram** (victim → mule → hawala → crypto)
- Force-directed UPI network graph
- Integration with suspect profiles and FIR data

### 🧭 MO Lead Matcher (Decision Support)
- Natural language MO input → automatic suspect matching
- **⚠️ Habitual Offender badge** (Risk Score ≥ 80, red border)
- **🫂 Victim linkage** per matched suspect
- **MO Radar Chart** — 6-axis criminological behavioral profile vs average baseline
- Investigation timeline dossier (4-step protocol)

### 🫂 Victim & Complainant Database
- 5 registered victim profiles with full metadata
- Vulnerability tags: Senior Citizen, Female, Digital Fraud, High Financial Loss
- FIR linkage, suspect association, and incident descriptions
- KPI summary: total loss, female victims, cyber fraud count

### 📊 Predictive Risk & Forecasting
- Early Warning Risk Index bar chart by district
- Recidivism risk scores per suspect
- Seasonal crime trend analysis (monthly line chart)
- Live alert ticker with real-time intelligence feed

### 🗺️ Case Storyboard Mind-Map
- Drag-and-drop interactive board for case narrative assembly
- Node types: Suspect, UPI Flow, FIR, Location
- Bezier bezier arrow connections drawn automatically
- Fully editable node labels — inline content editing

### 🔍 Explainable AI & Audit Trail
- Every AI response includes: SQL query used, reasoning chain, evidence trail
- Full audit log table with timestamp, action, actor, and SQL trace
- Live audit badge counter in sidebar
- Compliant with law enforcement accountability standards

### 🔐 Role-Based Access Control
- 4 roles: **Investigator**, **Analyst**, **Superintendent**, **Admin**
- Role-gated responses in chat (role-specific data visibility)
- Login screen with credential validation
- Session-scoped audit tracking

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **Frontend** | HTML5, Vanilla CSS (dark-mode design system), Vanilla JavaScript (ES2022) |
| **Charts & Viz** | Apache ECharts (network, sankey, radar, bar, pie, line) |
| **Map** | Leaflet.js with OpenStreetMap tiles |
| **Icons** | Lucide Icons |
| **Fonts** | DM Sans (Google Fonts) |
| **Voice** | Web Speech API (SpeechRecognition) |
| **PDF Export** | Browser Print API with custom print stylesheet |

**No external database required** — fully self-contained with in-memory mock data that mirrors real KSP schema.

---

## 📁 Project Structure

```
datahackthon/
├── main.py                  # FastAPI backend — all API endpoints & data models
└── static/
    ├── index.html           # Single-page app — all sections & UI structure
    ├── style.css            # Complete design system (~1300 lines)
    └── app.js               # All frontend logic, charts, events (~2100 lines)
```

---

## ⚙️ Setup & Execution Instructions

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- An internet connection (for CDN libraries: ECharts, Leaflet, Lucide)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ksp-crime-intelligence-platform.git
cd ksp-crime-intelligence-platform
```

### Step 2 — Install Dependencies

```bash
pip install fastapi uvicorn python-multipart
```

Or using a virtual environment (recommended):

```bash
python3 -m venv venv
source venv/bin/activate          # On Windows: venv\Scripts\activate
pip install fastapi uvicorn python-multipart
```

### Step 3 — Run the Server

```bash
python3 main.py
```

The server starts at: **http://127.0.0.1:8000**

### Step 4 — Access the Platform

Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🔑 Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Investigator** | `ksp_invest` | `invest123` |
| **Superintendent** | `ksp_super` | `super123` |
| **Admin** | `admin` | `admin123` |

> **Recommended for demo:** Login as `Investigator` to experience the full workflow.

---

## 🎬 Recommended Demo Flow (for Judges)

1. **Login** as `Investigator` → note role-gated access
2. **Dashboard** → animated KPI counters, live alert ticker, threat gauge
3. **Conversational AI** → type: *"Show UPI transactions"* → see SQL trace + reasoning
4. **Switch to Kannada** → type: *"ಬೆಂಗಳೂರು ಅಪರಾಧ"* → bilingual response
5. **Chat** → type: *"Show victims"* → victim vulnerability table
6. **Hotspot Map** → see pulsing risk-colored suspect markers
7. **Criminal Network** → click a node → full dossier panel
8. **UPI Money Trails** → scroll to Sankey money laundering flow
9. **MO Lead Matcher** → type: `lock break daytime` → see Habitual Offender badge + Radar Chart
10. **Case Storyboard** → add nodes → drag to arrange → bezier connections
11. **Victim Records** → browse detailed profiles with vulnerability tags
12. **Audit Logs** → full SQL trace of every action taken

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate user with role |
| `GET` | `/api/crimes` | Crime records (filterable by district, type, status) |
| `GET` | `/api/suspects` | All suspect profiles with risk scores |
| `GET` | `/api/network` | Criminal network nodes + links |
| `GET` | `/api/victims` | Victim profiles (filterable) |
| `GET` | `/api/upi-trails` | UPI transaction flags |
| `GET` | `/api/interstate-alerts` | Cross-border criminal alerts |
| `GET` | `/api/socio-economic` | District socio-economic crime correlation |
| `POST` | `/api/match-mo` | MO text → matched suspects + radar data |
| `POST` | `/api/chat` | Natural language query → AI response |
| `GET` | `/api/audit-logs` | Full audit log with SQL trace |

---

## 🌐 Deployment on Catalyst Platform

This project is designed to be deployable as a standard Python web application.

**For Catalyst Deployment:**
1. Upload all project files to Catalyst
2. Set the run command to: `uvicorn main:app --host 0.0.0.0 --port 8080`
3. Set the static files directory to `./static`
4. No database setup required — fully in-memory

---

## 📊 Impact & Use Cases

| Stakeholder | Use Case |
|-------------|---------|
| **Police Investigators** | Query crime history in natural language, get leads instantly |
| **Crime Analysts** | Pattern detection, socio-economic correlations, trend forecasting |
| **Superintendents of Police** | Real-time command dashboard, interstate coordination |
| **Policymakers** | Evidence-based crime prevention strategy from demographic insights |
| **Cyber Crime Units** | UPI money trail tracing, hawala network detection |

---

## 🏆 Unique Differentiators

- **Sankey Money Laundering Flow** — Traces victim → mule accounts → hawala → crypto
- **MO Radar Chart** — 6-axis behavioral profile vs. average criminal baseline
- **Dual Language AI** — EN + ಕನ್ನಡ with bilingual voice input
- **Case Storyboard Mind-Map** — Drag-and-drop investigation board unique to this submission
- **Explainable AI** — Every AI response shows the SQL + reasoning chain
- **Victim Database** — Full vulnerability profiling (Senior/Female/Digital fraud/High-loss)
- **Live Alert Ticker** — Real-time intelligence broadcast simulation
- **Pulsing Map Markers** — Risk-colored animated hotspot indicators

---

## 👥 Team

*Karnataka State Police — Datathon 2026 | Challenge 01*

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.
