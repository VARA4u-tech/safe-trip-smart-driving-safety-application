# 🛡️ SafeTrip Pro | Intelligence in Motion

![SafeTrip Pro Banner](https://raw.githubusercontent.com/VARA4u-tech/safe-trip-smart-driving-safety-application/main/frontend/public/logo.svg)

> **Elevate your driving experience with the next generation of smart safety.** SafeTrip Pro is a premium, AI-powered navigation and safety companion designed to protect lives through real-time intelligence and predictive analytics.

---

## ✨ Features that Empower

### 🧠 Predictive Safety AI

Real-time hazard evaluation using Mapbox Engine v3. Our algorithms analyze traffic density, weather conditions, and road incidents to provide a "Safety Score" for every trip.

### 👁️ Drowsiness Detection

Integrated computer vision module that monitors driver fatigue. Stay alert with tactile and visual warnings when the system detects signs of exhaustion.

### 🆘 Guardian Network (SOS)

Advanced emergency response system. Configure your "Guardian Registry" to automatically broadcast your location and status during critical incidents.

### 🎙️ Voice Intelligence

Hands-free control. Execute commands, report hazards, or get navigation updates using high-fidelity voice recognition powered by the Web Speech API.

### 🗺️ Augmented Navigation

Experience the road in 3D. Features immersive terrain rendering, real-time traffic layers, and dynamic hazard reporting.

### 🏆 Global Leaderboard

Join an elite community of safe drivers. Earn badges, maintain a platinum safety score, and rank globally for your responsible driving habits.

---

## 🎨 Aesthetic Design System: "Vintage Luxe"

SafeTrip Pro isn't just a utility; it's an experience.

- **Premium Palettes**: Deep Espresso, Burnt Gold, and Midnight tones.
- **Glassmorphism**: Sleek, translucent UI elements for a modern "tech-first" feel.
- **Night Vision Mode**: Optimized high-contrast display for superior low-light visibility.

---

## 🛠️ Technology Stack

| Component    | Technology                       |
| :----------- | :------------------------------- |
| **Frontend** | React 18, Vite, Typecript        |
| **Styling**  | Tailwind CSS, Shadcn/UI          |
| **Database** | Supabase (PostgreSQL)            |
| **Mapping**  | Mapbox GL JS v3                  |
| **Backend**  | Node.js, Express                 |
| **ML/Logic** | Custom Safety Scoring Algorithms |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn
- Supabase Project
- Mapbox Access Token

### Local Installation

1. **Clone the Registry**

   ```bash
   git clone https://github.com/VARA4u-tech/safe-trip-smart-driving-safety-application.git
   cd safe-trip-smart-driving-safety-application
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   # Create a .env file with:
   # VITE_SUPABASE_URL=your_url
   # VITE_SUPABASE_ANON_KEY=your_key
   npm run dev
   ```

3. **Backend Setup**

   ```bash
   cd ../backend
   npm install
   # Create a .env file with your credentials
   npm run dev
   ```

4. **Database Initialization**
   Paste the contents of `backend/db_setup.sql` into your Supabase SQL Editor to initialize the Guardian Network and Trip History tables.

---

## 👤 Credits & Systems

**Developer**: [VARA4u Intelligence Systems](https://github.com/VARA4u-tech)  
**Version**: 2.4.0-LUXE  
**Status**: Intelligence in Motion

---

<p align="center">
  <i>"The journey of a thousand miles begins with a single safe turn."</i>
</p>
