# 🎮 Adaptive Learning Tic-Tac-Toe (AI Strategy & Decision Thinking)

[![Deploy to GitHub Pages](https://github.com/NickScherbakov/tic-tac-toe-ai-battl/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/NickScherbakov/tic-tac-toe-ai-battl/actions/workflows/deploy-pages.yml)
[![GitHub Streak](https://streak-stats.demolab.com/?user=NickScherbakov&theme=tokyonight&hide_border=true)](https://github.com/NickScherbakov)

***English** ∙ [العربية](README.ar.md) ∙ [简体中文](README.zh-CN.md) ∙ [Русский](README.ru.md)*

An educational, multi‑phase Tic‑Tac‑Toe experience designed to teach strategic thinking, risk evaluation, planning vs impulsivity, and the basics of probabilistic decision making. The application provides two parallel flows (desktop & mobile) with identical pedagogical progression.

## 📚 Learning Structure (Both Desktop & Mobile)

The interface is intentionally linear to focus attention on one concept per step:

1. Language selection – cognitive priming & accessibility.
2. Rules – goal, win conditions, betting as resource allocation metaphor.
3. Practice: Human vs AI – active engagement, board size choice (3×3 / 4×4 / 5×5) to expose pattern growth & search complexity.
4. Betting & Investing – simplified risk/reward, odds → multiplier intuition.
5. AI Strategy Setup – compare 4 thinking styles (Random, Defensive, Offensive, Calculated/Minimax).
6. AI Battle – observation, hypothesis formation, reflection on prior prediction (bet outcome).

## 🌐 Live Demo

**[Play Now → https://nickscherbakov.github.io/tic-tac-toe-ai-battl/](https://nickscherbakov.github.io/tic-tac-toe-ai-battl/)**  
Force mobile flow: [https://nickscherbakov.github.io/tic-tac-toe-ai-battl/?mobile=1](https://nickscherbakov.github.io/tic-tac-toe-ai-battl/?mobile=1)


## 🧠 Pedagogical Concepts

- Random (Impulsive) → illustrates lack of planning.
- Defensive → safety bias / avoidance behavior.
- Offensive → tunnel vision & neglect of threats.
- Calculated (Minimax) → structured evaluation & foresight.
- Odds & payout → expected value fundamentals in a simplified frame.
- Board scaling (4×4 / 5×5) → exponential growth of state space; why deeper search is limited.
- Mental math mini‑game (mobile) → working memory reinforcement + reward loop.

## 🚀 Feature Highlights

- Dual flow: touch devices get MobileFlow; larger pointers get DesktopFlow with the same staged pedagogy.
- Human practice mode with selectable board size (3, 4, 5).
- AI vs AI autonomous battle with strategy visualization.
- Betting panel (educational framing of investment & probability, including draw bets).
- Multi-language: English, Russian, Arabic, Chinese (simplified).
- Animations, sound FX (toggleable), haptic pulses on supported devices.
- Persistent state via `useKV` (strategy, balance, language, bets, step progression).

## 🏗️ Tech Stack

- Vite 6 + React + TypeScript
- TailwindCSS + custom thematic gradient components
- Framer Motion (progressive reveal & feedback)
- `@github/spark` hooks for lightweight persisted state
- Sonner (toast feedback) for reinforcement loops

## 📐 Game Logic Overview

- Dynamic `BoardSize` (3 | 4 | 5) → board = `size * size` flat array.
- Win detection builds combinations (rows, cols, diagonals) per size.
- Draw detection: all filled & no winning line.
- AI strategies share a unified `getMove(board, player, size)` interface.
- Minimax depth is reduced for larger boards to maintain responsiveness.

## 🔁 Flows

Desktop: `DesktopFlow` (step state stored under `desktop-step`).  
Mobile: `MobileFlow` (heuristic trigger: viewport width < 1024, coarse pointer OR forced `?mobile=1`).

`App.tsx` chooses flow based on `useIsTouchMobile()`.

## 🏦 Betting Model (Simplified)

- Bet types: X, O, Draw (draw mapped internally for odds resolution).
- Odds derived from relative heuristic strength of selected strategies.
- Profit = payout − stake; history tracked for reflection & pattern noticing.

## 🧪 Getting Started

```bash
git clone https://github.com/NickScherbakov/tic-tac-toe-ai-battl
cd tic-tac-toe-ai-battl
npm ci
npm run dev # http://localhost:5173
```


Production build:

```bash
npm run build
```


Tests / logic checks:

```bash
npm test
```


Force mobile flow locally:

```text
http://localhost:5173/?mobile=1
```


## 📦 Deployment

Auto-deployed to GitHub Pages on push to `main` via Actions workflow.

## 🔐 Security & Safety

- No external data persistence beyond KV local storage abstraction.
- No personally identifiable information collected.

## 🗺️ Future Enhancements (Ideas)

- Adaptive difficulty in practice (dynamic strategy shifts).
- Visualization of minimax evaluation heatmap.
- Extended board sizes (6×6) with pruning demonstration.
- Expected value calculator for custom scenarios.

## 📄 License

Spark template assets: MIT (Copyright GitHub, Inc).  
Project logic & educational flow: MIT.

---
Enjoy exploring strategic thinking! If you find insights or have improvement ideas, feel free to open an issue.
