# Kung Fu Inc.

A Tetris-inspired pixel-art arcade game with a kung fu theme — a recreation of the classic Gamee Telegram game **Kung Fu Inc.**

## 🥋 About

Clean the machines uprising! You play as a kung fu fighter defending against waves of cleaning machines that fall from the sky in Tetris-style block formations. Punch, kick, and smash the machines before they stack up to the top of the screen!

## 🎮 How to Play

| Key | Action |
|-----|--------|
| ← → / A D | Move your fighter |
| ↑ / W | Punch |
| ↓ / S | Kick |
| Space | Jump |
| P / Esc | Pause |

### Mobile Controls
On-screen buttons appear automatically on touch devices — directional buttons on the left, action buttons (punch, kick, jump) on the right.

## 🎯 Gameplay

- **🤖 Machine Blocks**: Cleaning machines fall from the top in Tetris-style shapes (I, O, T, S, Z, J, L pieces)
- **👊 Fight Back**: Punch and kick the blocks to destroy them before they land
- **⭐ Row Clears**: When blocks fill a complete row, they explode for bonus points
- **🏃 Enemy Bots**: Vacuum, washer, and duster bots roam the battlefield — destroy them for high scores
- **💀 Game Over**: If blocks stack to the top, it's game over!
- **📈 Level Up**: Earn points to level up — blocks fall faster, enemies spawn quicker, but you heal 1 HP

## ✨ Features

- **Pixel Art Graphics** — Hand-crafted pixel sprites with retro arcade aesthetic
- **Chiptune Audio** — Web Audio API generated sound effects and music
- **Particle Effects** — Explosions, hit sparks, and dust on impact
- **Combo System** — Chain hits for score multipliers
- **Progressive Difficulty** — Game gets faster and harder as you level up
- **High Score** — Saved locally between sessions
- **Responsive Controls** — Works with keyboard and touch
- **Screen Shake & Flash** — Juicy feedback on hits and level ups

## 🏗️ Tech Stack

- **Vanilla JavaScript** — No frameworks, no dependencies
- **HTML5 Canvas** — Pixel-perfect rendering
- **Web Audio API** — Procedural chiptune audio
- **CSS3** — Retro arcade styling

## 📁 Project Structure

```
kung-fu-inc/
├── index.html          # Main game page
├── css/
│   └── style.css       # Game styling
├── js/
│   ├── sprites.js      # Pixel art sprite definitions
│   ├── audio.js         # Web Audio sound system
│   ├── particle.js      # Particle effect system
│   ├── player.js        # Player character logic
│   ├── enemies.js       # Enemy/machine AI
│   ├── tetris.js        # Tetris block system
│   └── game.js          # Main game engine
└── README.md
```

## 🚀 Run Locally

Just open `index.html` in any modern web browser. No build step needed!

```bash
# Clone the repo
git clone https://github.com/marcoreliogames-dotcom/kung-fu-inc.git

# Open the game
cd kung-fu-inc
open index.html  # macOS
# or
start index.html  # Windows
# or
xdg-open index.html  # Linux
```

Alternatively, serve it locally:
```bash
npx serve .
# or
python -m http.server 8000
```

## 🎨 Inspired By

The original **Kung Fu Inc.** by [Gamee](https://gamee.com) — a classic Telegram arcade game. This is a fan recreation built with love for retro gaming.

## 📜 License

MIT License — feel free to use, modify, and distribute.

---

*"Prepare yourself for the cleaning machines uprising!"*
