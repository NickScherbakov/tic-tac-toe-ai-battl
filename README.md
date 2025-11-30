# 🎮 AI vs AI Tic-Tac-Toe Battle

Watch AI battle AI in a game of Tic-Tac-Toe! An interactive web application where you can observe different AI strategies compete against each other.

## 🌐 Live Demo

**[Play Now → https://nickscherbakov.github.io/tic-tac-toe-ai-battl/](https://nickscherbakov.github.io/tic-tac-toe-ai-battl/)**

## 🚀 Features

- AI vs AI battles with different strategies
- Interactive and animated game board
- Sound effects and visual feedback
- Mobile-friendly responsive design
- Multi-language support (English/Russian)

## Мобильный режим (MobileFlow)

Для устройств с сенсорным экраном и диагональю <~10" включается упрощённый мобильный флоу с последовательными экранами:
- Язык
- Правила
- Игровое поле: игрок vs ИИ
- Тотализатор и правила ставок
- Конфигурация стратегий ИИ (X и O) и скорость
- Игровое поле: ИИ «X» против ИИ «O»

Определение мобильного режима происходит эвристически (ширина <1024px, `(pointer: coarse)`, `maxTouchPoints > 0`) и реализовано в `src/hooks/use-mobile.ts` (`useIsTouchMobile`).

Принудительное включение мобильного режима для тестирования на десктопе:

```bash
npm run dev
# откройте в браузере:
# http://localhost:5173/?mobile=1
```

При принудительном режиме MobileFlow отображается независимо от эвристик. Стандартный десктопный интерфейс остаётся без изменений, когда мобильный режим не активен.

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm

### Getting Started

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📦 Deployment

The project is automatically deployed to GitHub Pages on every push to the `main` branch via GitHub Actions.

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
