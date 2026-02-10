# ⑨ Marukyu Marble

<div align="center">

![License](https://img.shields.io/github/license/lsy7851/Wplace-MarukyuMarble)
![Status](https://img.shields.io/badge/Status-WIP-orange)

**Wplace.live template overlay tool - Chrome Extension (WXT + Vue 3)**

Fork of [Skirk Marble](https://github.com/Seris0/Wplace-SkirkMarble) by Seris0
Based on [Blue Marble](https://github.com/SwingTheVine/Wplace-BlueMarble) by SwingTheVine

[Features](#-features) • [Installation](#-installation) • [Credits](#-credits) • [License](#-license)

</div>

---

## ⚠️ **Important Notice**

This project is a **fork** of Skirk Marble,
which itself is derived from the original Blue Marble project and its community forks.

The documentation is currently being modified.
Consequently, content retained from the original project may not accurately reflect the current codebase or policies.
### 📜 Project Lineage

```
Blue Marble (SwingTheVine - Original)
    ├─→ Wplace-BM (Hao-1337 - Error Map)
    ├─→ Wplace-Red-planet (pixelkat5 - Search)
    └─→ Skirk Marble (Seris0 - TamperMonkey)
        └─→ Marukyu Marble (This Fork)
```

**Full Credits**: See [CREDITS.md](./CREDITS.md)

---

## ✨ Features

### 🎨 Template Management
- Upload and overlay image templates on Wplace.live canvas
- Support for multiple simultaneous templates
- Enable/disable templates individually
- Smart template positioning with tile and pixel coordinates

### 🔍 Visual Enhancements
- **Customizable Crosshair**: Adjust color, transparency, and size
- **Error Map**: Visual indicators for correct/incorrect pixels
- **Color Filtering**: Show only specific colors from templates
- **Mini Tracker**: Track placement progress in real-time

### ⚡ Performance
- **Smart Tile Caching**: LRU cache for improved performance (up to 500 tiles)
- **Tile Refresh Control**: Pause/resume tile updates as needed
- **Optimized Rendering**: Efficient canvas overlay system

### ⚙️ Customization
- Drag mode options (full overlay vs drag bar only)
- Navigation methods (flyto animation vs URL navigation)
- Template color sorting
- Compact list view
- Mobile mode support

### 💾 Data Management
- Automatic settings persistence (TamperMonkey + localStorage fallback)
- Template import/export
- Wrong color statistics and filtering

---

## 🚀 Installation

### Development Build

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/Wplace-MarukyuMarble.git
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

---

## 📖 Usage

### Quick Start

1. **Upload a Template**
   - Click the template upload section
   - Select an image file
   - Enter tile and pixel coordinates
   - Click "Upload"

2. **Position Your Template**
   - Templates are positioned using coordinates:
     - **Tile X/Y**: Which 1000x1000 tile section
     - **Pixel X/Y**: Exact pixel offset within the tile

3. **Enable/Disable Templates**
   - Toggle templates on/off using the eye icon
   - Multiple templates can be active simultaneously

### Advanced Features

#### Color Filtering
- Click the color filter button
- Select specific colors to show/hide
- Useful for focusing on specific parts of your template

#### Error Map
- Enable to see:
  - ✅ Green: Correctly placed pixels
  - ❌ Red: Wrong pixels
  - ⚠️ Yellow: Unpainted pixels (optional)

#### Settings
- Access settings panel for:
  - Crosshair customization
  - Cache management
  - UI preferences
  - Performance options

---

## 🔧 Building from Source

```bash
# Clone the repository
git clone https://github.com/YourUsername/Wplace-MarukyuMarble.git
cd Wplace-MarukyuMarble

# Install dependencies
npm install

# Build
npm run build

# The output will be in dist/MarukyuMarble.user.js
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) first.

### Before Contributing
- This project follows MPL-2.0 license
- All contributions must maintain proper attribution
- Respect the project's heritage and upstream contributors

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Credits

- **SwingTheVine** - [Blue Marble](https://github.com/SwingTheVine/Wplace-BlueMarble) (Original)
- **Hao-1337** - [Wplace-BM](https://github.com/Hao-1337/Wplace-BM) (Error Map)
- **pixelkat5** - [Wplace-Red-planet](https://github.com/pixelkat5/Wplace-Red-planet) (Search)
- **Seris0** - [Skirk Marble](https://github.com/Seris0/Wplace-SkirkMarble) (UI/Performance)

See [CREDITS.md](./CREDITS.md) for details.

---

## 📜 License

[Mozilla Public License 2.0](./LICENSE.txt) - See [NOTICE](./NOTICE) for copyright details.



---

## 📞 Support

### Documentation
- [User Guide](./docs/USER_GUIDE.md)
- [FAQ](./docs/FAQ.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

### Get Help
- 🐛 [Report a Bug](https://github.com/YourUsername/Wplace-MarukyuMarble/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/YourUsername/Wplace-MarukyuMarble/issues/new?template=feature_request.md)
- 💬 [Ask a Question](https://github.com/YourUsername/Wplace-MarukyuMarble/discussions)

---



---

<div align="center">

**Made with ❤️ by the Wplace community**

[⬆ Back to Top](#-marukyu-marble)

</div>
