
import { GoogleGenerativeAI } from '@google/generative-ai';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
