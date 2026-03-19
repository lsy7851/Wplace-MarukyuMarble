# Building from Source

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

## Development Build

1. **Clone the repository**
   ```bash
   git clone https://github.com/lsy7851/Wplace-MarukyuMarble.git
   cd Wplace-MarukyuMarble
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run development build**
   ```bash
   pnpm dev
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `.output/chrome-mv3/` directory

## Production Build

```bash
pnpm build
```

Output will be in `.output/chrome-mv3/`.

## Firefox

```bash
pnpm dev:firefox      # Development
pnpm build:firefox    # Production
```
