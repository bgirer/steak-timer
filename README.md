# 🔥 Seared — The Perfect Steak Planner & Timer

**Seared** is a premium, client-side web application designed to guide culinary enthusiasts from prep to plate, ensuring a perfect cook every single time. Combining food science, a dynamic warning engine, and an interactive timer, Seared acts as a digital sous-chef tailored to your specific steak cut, thickness, starting temperature, and cooking surface.

Live at: **[searedsteaktimer.com](https://searedsteaktimer.com)**

---

## ✨ Features

- **🎯 Smart Configurator**
  Choose from multiple steak cuts (Ribeye, NY Strip, Filet Mignon, Sirloin, Flank/Skirt) and adjust thickness ($0.5"$ to $3.0"$) to dynamically generate custom plans.
- **⚠️ Dynamic Warning & Food Safety Engine**
  Evaluates your configurations in real time to prevent culinary mishaps (e.g., trying to pan-sear a frozen cut, using dangerous temperatures, or using non-stick surfaces at unsafe searing temperatures).
- **🥩 "The Perfect Steak" Algorithm**
  Calculates tailored stage durations (searing times, low-temp baking, sous-vide water baths, carryover resting) based on the thermodynamics of your selected cut, thickness, starting temperature, cooking surface, and target doneness.
- **⏱️ Active Timer & Circular SVG Progress Ring**
  Provides a visual circular countdown, current stage details, dynamic step-by-step instructions, and easy stage controls (play, pause, skip, and reset).
- **🔊 Web Audio API Sound Engine**
  Uses pure client-side audio synthesis (no external audio assets required) to play distinctive alert beeps for stage countdowns, transition alerts, and a celebratory chime upon completion. Includes a mute toggle.
- **📋 Review Overlay Modal**
  Enables you to peek at the full cooking checklist and tips mid-cook without resetting or leaving the active timer page.
- **✨ Premium Culinary Aesthetics**
  Features a responsive dark steakhouse-themed UI utilizing modern typography (Lora & Plus Jakarta Sans), smooth CSS transitions, HSL color palettes, glassmorphism, and responsive layouts.

---

## 🛠️ Technology Stack

Seared is built entirely with vanilla web technologies to guarantee high performance, instant loading times, and zero external runtime dependencies:
* **HTML5**: Semantic structure, interactive SVG progress ring, and modal interfaces.
* **CSS3**: Variables, custom HSL color palette, custom sliders, flexbox/grid layout, and micro-animations.
* **JavaScript (ES6)**: State management, algorithm math, UI transitions, and Web Audio API synthesis.

---

## ⚙️ How the Algorithm Works

The cooking engine behind Seared calculates specific stage durations by combining multiple thermodynamic adjustments:
1. **Base Cook Time**: Determined by the steak cut (e.g., Flank/Skirt requires shorter, faster cooks, while thick Ribeyes/Filet Mignons require longer processes).
2. **Thickness Adjustment**: Scales duration quadratically/linearly based on the steak thickness ($4$ minutes per inch for searing, $20$ minutes per inch for low-temp oven baking).
3. **Doneness Modifier**: Adjusts cooking intervals to reach target internal temperatures:
   - **Rare**: $120°F - 125°F$
   - **Medium Rare**: $130°F - 135°F$
   - **Medium**: $140°F - 145°F$
   - **Medium Well**: $145°F - 150°F$
   - **Well Done**: $160°F+$
4. **Surface Modifiers**: Accounts for the heat retention capacity of different materials (e.g., Cast Iron sears faster than Stainless Steel, while Non-Stick requires lower temperatures and longer times to cook safely).
5. **Initial Temperature Offset**: Accounts for fridge-cold ($~38°F$), room-temperature ($~70°F$), or frozen ($~32°F$) states.

---

## 💻 Local Development

Since Seared is a static client-side application, it does not require any compile or build steps. You can run it instantly on your machine.

### Option 1: Open Directly
Simply double-click the `index.html` file or open it in your web browser of choice.

### Option 2: Live Server (Recommended)
For full Web Audio API support and smooth navigation, serve the project files using a simple HTTP server:

**Using Python:**
```bash
python3 -m http.server 8080
```
Then visit: `http://localhost:8080`

**Using Node.js (`npx`):**
```bash
npx serve
```
or
```bash
npx live-server
```

---

## 📂 Project Structure

```
steak-timer/
├── index.html     # Application structure & UI markup
├── style.css      # Premium dark theme styles & layout rules
├── app.js         # State machine, math engine, and Audio Context
├── favicon.svg    # Custom designed flame/steak favicon
└── CNAME          # Domain mapping (searedsteaktimer.com)
```

---

## 🍽️ Chef's Food Safety Disclaimer

Always verify the internal temperature of your steak using a reliable digital probe meat thermometer. Carryover cooking continues to raise the internal temperature of the steak by $5°F$ to $10°F$ during the resting phase.
