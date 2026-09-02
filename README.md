# Haikyuu Volleyball Retro RPG 🏐

A browser-based retro volleyball game inspired by Game Boy Advance aesthetics.

## 📸 Gameplay Preview

| Gym Training & Reception Drills | Beach Match & Spiking |
| :---: | :---: |
| ![Gym Training](./drill-mode.png) | ![Beach Match](./match-mode.png) |

---

### What it is

A mini action-RPG volleyball match simulator with 8-bit sound effects and a retro handheld UI.

- **Volleyball Mechanics**: Real-time positioning, jump timing, bumping, setting, and spiking.
- **RPG Stats & Dialogue**: Character progression, dialogue prompts, and player stats for Hinata Shoyo.
- **Retro Audio**: Built-in 8-bit synthesizer using the Web Audio API (no external audio assets needed).
- **GBA Layout**: Handheld-style interface supporting both keyboard input and on-screen controls.

---

### Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Graphics**: HTML5 2D Canvas
- **Audio**: Web Audio API
- **Styling**: Tailwind CSS

---

### Running locally

``bash
# 1. Clone repository
git clone https://github.com/kritanshSharma/RPG-Game.git

# 2. Enter directory
cd RPG-Game/Haikyuu

# 3. Install packages
npm install

# 4. Start dev server
node .\node_modules\vite\bin\vite.js --port=3000
``