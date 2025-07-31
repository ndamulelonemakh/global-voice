# Global Voice - Voice Chat in any Browser Tab

Global Voice is a simple and lightweight chrome extension that enables advanced voice input capabilities in any web application. It allows users to use their microphone to input text in any text field, textarea, or contenteditable element across the web.

## Features

- Fast transcriptions powered by [Gemini Flash](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-lite)
- Supports any text field, textarea, or contenteditable element
- Secure storage of API key using Chrome's storage API



## How to Use

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ndamulelonemakh/global-voice.git
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the extension:**

    ```bash
    npm run build
    ```

4.  **Load the extension in Chrome:**

    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode".
    *   Click "Load unpacked" and select the `global-voice` directory.

5.  **Add your API Key:**

    *   Click on the Global Voice extension icon in your browser toolbar.
    *   Paste your Google AI Studio API key into the input field and click "Save".

6.  **Start using:**

    *   Click on any text field, textarea, or contenteditable element in your browser.
    *   Click the Global Voice extension icon and then click "Start Recording".
    *   Speak, and the transcribed text will be inserted into the selected field.

## API Key Storage

> Your Google AI Studio API key is stored securely using the `chrome.storage.sync` API. This means it is synced to your Google account, allowing you to use the extension with your saved API key on any device where you are logged into Chrome. The API key is only accessible by the extension and is not shared with any third parties.