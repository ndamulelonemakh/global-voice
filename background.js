
import { GoogleGenerativeAI } from '@google/generative-ai';

let creatingOffscreen = false;

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return setupOffscreenDocument();
  }

  creatingOffscreen = true;
  try {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['USER_MEDIA'],
      justification: 'Recording audio from microphone for voice transcription'
    });
  } finally {
    creatingOffscreen = false;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'request-start-recording') {
    setupOffscreenDocument().then(() => {
      chrome.runtime.sendMessage({ type: 'start-recording' });
    }).catch(error => {
      console.error('Error setting up offscreen document:', error);
    });
    return true;
  }
  
  if (request.type === 'request-stop-recording') {
    chrome.runtime.sendMessage({ type: 'stop-recording' });
    return true;
  }

  if (request.type === 'recording-started') {
    // Forward to popup
    return false; // Let the message propagate
  }

  if (request.type === 'recording-error') {
    // Forward to popup
    return false;
  }

  if (request.type === 'recording-complete') {
    chrome.runtime.sendMessage({ type: 'recording-stopped' });
    
    chrome.storage.sync.get('apiKey', async (data) => {
      if (data.apiKey) {
        const genAI = new GoogleGenerativeAI(data.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        try {
          const base64Audio = request.audioData.split(',')[1];
          
          const result = await model.generateContent([{
            inlineData: {
              mimeType: 'audio/webm',
              data: base64Audio
            }
          }, { text: "Transcribe the audio." }]);
          
          const response = await result.response;
          const text = response.text();
          chrome.runtime.sendMessage({ transcript: text });
        } catch (error) {
          console.error('Error transcribing audio:', error);
          chrome.runtime.sendMessage({ error: 'Error transcribing audio.' });
        }
      } else {
        chrome.runtime.sendMessage({ error: 'API key not found.' });
      }
    });
    return true;
  }

  if (request.type === 'transcribe') {
    chrome.storage.sync.get('apiKey', async (data) => {
      if (data.apiKey) {
        const genAI = new GoogleGenerativeAI(data.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

        const reader = new FileReader();
        reader.readAsDataURL(request.audio);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          try {
            const result = await model.generateContent([{
              inlineData: {
                mimeType: 'audio/webm',
                data: base64Audio
              }
            }, { text: "Transcribe the audio." }]);
            const response = await result.response;
            const text = response.text();
            sendResponse({ transcript: text });
          } catch (error) {
            console.error('Error transcribing audio:', error);
            sendResponse({ error: 'Error transcribing audio.' });
          }
        };
      } else {
        sendResponse({ error: 'API key not found.' });
      }
    });
  }
  return true;
});
