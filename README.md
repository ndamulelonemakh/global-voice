# 🎤 Global Voice

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://www.google.com/chrome/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

A simple and lightweight Chrome extension that enables advanced voice input capabilities in any web application. Use your microphone to input text in any text field, textarea, or contenteditable element across the web.

## ✨ Features

- ⚡ **Fast transcriptions** powered by [Gemini 2.5 Flash Lite](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-lite)
- 🌐 **Universal compatibility** - works with any text field, textarea, or contenteditable element
- 🔒 **Secure API key storage** using Chrome's storage API (synced across devices)
- 🎯 **Smart element detection** - automatically inserts transcription into focused fields
- 🔐 **Privacy-conscious** - extension collects no data; audio processed by Google Gemini API (subject to [Google's privacy policy](https://policies.google.com/privacy))
- 🚀 **Manifest V3** - built with the latest Chrome extension standards

## 🚀 Quick Start

### Prerequisites

- Chrome browser (version 120+)
- [Google AI Studio API key](https://aistudio.google.com/app/apikey) (free tier available)
- Node.js 16+ (for building from source)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ndamulelonemakh/global-voice.git
   cd global-voice
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the extension:**

   ```bash
   npm run build
   ```

4. **Load in Chrome:**

   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `global-voice` directory

5. **Configure API key:**

   - Click the Global Voice extension icon in your browser toolbar
   - Paste your [Google AI Studio API key](https://aistudio.google.com/app/apikey)
   - Click "Save"

## 📖 Usage

1. Navigate to any website with a text input field
2. Click on the text field where you want to insert transcribed text
3. Click the Global Voice extension icon
4. Click "Start Recording"
5. Speak clearly into your microphone
6. Click "Stop Recording" when done
7. The transcribed text will be automatically inserted into the focused field

## 🛠️ Development

### Project Structure

```
global-voice/
├── background.js        # Service worker handling transcription
├── popup.js            # Extension popup logic
├── popup.html          # Extension popup UI
├── popup.css           # Extension styles
├── offscreen.js        # Offscreen document for mic access
├── mic-setup.js        # Microphone permission handler
├── mic-setup.html      # Permission prompt UI
├── manifest.json       # Extension configuration
├── webpack.config.js   # Build configuration
└── dist/               # Built files (generated)
```

### Available Scripts

```bash
npm run build     # Build extension with webpack
npm run lint      # Check code with Biome linter
npm run lint:fix  # Auto-fix linting issues
npm run format    # Format code with Biome
```

### Tech Stack

- **Chrome Extensions API** - Manifest V3
- **Google Generative AI SDK** - Gemini 2.5 Flash for transcription
- **Webpack 5** - Module bundling
- **Biome** - Fast linting and formatting

## 🔐 Privacy & Security

- **Extension privacy** - this extension collects no personal data, analytics, or tracking information
- **Audio processing** - recordings are sent to Google Gemini API for transcription (subject to [Google's privacy policy](https://policies.google.com/privacy))
- **User control** - you provide your own API key and can modify the code to use alternative models or self-hosted solutions
- **API key security** - stored using `chrome.storage.sync` API, accessible only by this extension
- **Minimal permissions** - only requests necessary permissions (storage, activeTab, scripting, offscreen, tabs)
- **Open source** - full transparency; review and modify the code to meet your privacy requirements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- Built with [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub Issues](https://github.com/ndamulelonemakh/global-voice/issues)
- Check existing issues for solutions

---

Made with ❤️ by [Ndamulelo Nemakhavhani](https://github.com/ndamulelonemakh)
