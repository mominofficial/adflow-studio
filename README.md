# AdFlow Studio — 10-Second Commercial Storyboard & Google Flow Prompt Engine

A specialized, client-side web application designed to generate high-converting commercial video prompts using Google Gemini AI, ChatGPT, and Google Flow.

---

## 🚀 The Complete Commercial Workflow

This app directly implements the exact 2-stage commercial advertising workflow:

1. **Brand Asset Analysis (Stage 01)**
   - Upload your product photo, packaging, or brand logo.
   - Enter an optional brand name and choose a mood (Cinematic Luxury, High-Energy Viral, Cyber-Futuristic, etc.).
   - Click **"Analyze & Generate ChatGPT Storyboard Prompt"**.
   - Gemini AI analyzes the composition, lighting, materials, and colors.

2. **ChatGPT Storyboard Generation (Stage 02)**
   - Copy the generated 10-second multi-frame prompt.
   - Open [ChatGPT](https://chatgpt.com) (with DALL-E 3) or Midjourney and paste the prompt.
   - ChatGPT generates a 4-panel sequential storyboard image (0-2s Hook, 2-5s Dynamic Use, 5-8s Peak Benefit, 8-10s Brand Outro).
   - Download the generated image.

3. **Storyboard Upload (Stage 03)**
   - Upload the ChatGPT storyboard image into Stage 03.
   - AdFlow applies your strict video production requirements:
     - **Exact Duration**: 10 seconds.
     - **No Voiceover**: Pure sound design and atmospheric audio only.
     - **No On-Screen Text**: Clean cinematic visuals throughout the scenes.
     - **Brand Outro**: Dedicated 1 to 2-second logo/product reveal at the end (08.0s - 10.0s).

4. **Google Flow Video Generation (Stage 04)**
   - Gemini AI generates the master prompt for [Google Flow](https://labs.google/flow) (Veo / Video FX).
   - Includes detailed camera trajectory (dolly push, orbiting, speed ramps), lighting physics, audio sound effects cues, and outro specifications.
   - Click **"Copy Flow Prompt"** and open Google Flow with your storyboard image to generate your final 10-second commercial video!
   - You can also click **"Download Full Ad Brief (.md)"** to save the complete production sheet.

---

## 🔑 Setting Up Your Gemini API Key

1. Click the **"Gemini API Key"** button in the top right header.
2. Enter your Google Gemini API Key. (Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Select your preferred model (`gemini-2.5-flash` recommended).
4. Click **"Save Key"**. The key is stored locally and securely in your browser's `localStorage`.

> **💡 Quick Testing**: You can also click **"Load Demo Preset"** in the top bar to test the entire end-to-end interface immediately with high-fidelity sample brand assets and storyboard images without entering an API key.

---

## 🛠️ How to Run Locally

You can run this application using any local web server or live preview extension:

### Using Python HTTP Server:
```bash
python -m http.server 3000
```
Then visit: `http://localhost:3000`

### Using Node / npx:
```bash
npx serve .
```

Or simply double-click `index.html` to open directly in your web browser!
