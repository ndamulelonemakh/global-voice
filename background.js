import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL_ID = 'gemini-2.5-flash-lite';

let creatingOffscreen = false;
let recordingTargetTabId = null;
let recordingTargetElement = null;

function executeScript(details) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(details, (result) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

async function insertTranscriptIntoTab(tabId, transcript) {
  console.log('[GlobalVoice] insertTranscriptIntoTab called:', { tabId, transcript, recordingTargetElement });
  
  if (!tabId) {
    console.error('[GlobalVoice] No tabId provided, cannot insert transcript');
    return;
  }
  
  if (!transcript) {
    console.error('[GlobalVoice] No transcript provided');
    return;
  }
  
  try {
    const result = await executeScript({
      target: { tabId },
      args: [transcript, recordingTargetElement],
      func: (text, target) => {
        console.log('[GlobalVoice] Injected script running with:', { text, target });
        
        let el = document.activeElement;
        console.log('[GlobalVoice] Initial activeElement:', el?.tagName, el?.id, el?.className);
        
        if (target?.selector) {
          console.log('[GlobalVoice] Trying to find element with selector:', target.selector);
          try {
            const candidate = document.querySelector(target.selector);
            console.log('[GlobalVoice] Found candidate:', candidate?.tagName, candidate?.id);
            if (candidate) {
              candidate.focus({ preventScroll: true });
              el = document.activeElement;
              console.log('[GlobalVoice] After focus, activeElement:', el?.tagName, el?.id);
            }
          } catch (e) {
            console.error('[GlobalVoice] Selector error:', e);
          }
        }
        
        if (!el) {
          console.error('[GlobalVoice] No element to insert into');
          return { success: false, reason: 'no element' };
        }

        const isTextInput =
          el.tagName === 'TEXTAREA' ||
          (el.tagName === 'INPUT' &&
            [
              'text',
              'search',
              'email',
              'url',
              'tel',
              'password',
              'number',
            ].includes(el.type));

        console.log('[GlobalVoice] Element check:', { 
          tagName: el.tagName, 
          type: el.type, 
          isTextInput, 
          isContentEditable: el.isContentEditable 
        });

        if (isTextInput) {
          const value = el.value ?? '';
          const start =
            typeof el.selectionStart === 'number'
              ? el.selectionStart
              : value.length;
          const end =
            typeof el.selectionEnd === 'number'
              ? el.selectionEnd
              : value.length;
          el.value = value.slice(0, start) + text + value.slice(end);
          const cursor = start + text.length;
          try {
            el.setSelectionRange(cursor, cursor);
          } catch (_) {}
          el.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[GlobalVoice] Successfully inserted into text input');
          return { success: true, type: 'textInput' };
        }

        if (el.isContentEditable) {
          try {
            document.execCommand('insertText', false, text);
            console.log('[GlobalVoice] Successfully inserted via execCommand');
            return { success: true, type: 'contentEditable' };
          } catch (e) {
            console.error('[GlobalVoice] execCommand failed:', e);
            el.textContent = (el.textContent || '') + text;
            return { success: true, type: 'contentEditable-fallback' };
          }
        }
        
        console.warn('[GlobalVoice] Element is not a text input or contentEditable:', el.tagName);
        return { success: false, reason: 'not editable', tagName: el.tagName };
      },
    });
    console.log('[GlobalVoice] executeScript result:', result);
  } catch (e) {
    console.error('[GlobalVoice] Unable to insert transcript into page:', e);
    chrome.runtime.sendMessage({
      error:
        'Could not insert text into the page. Click the text field again and retry, or ensure the page allows extensions.',
    });
  }
}

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return setupOffscreenDocument();
  }

  creatingOffscreen = true;
  try {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['USER_MEDIA'],
      justification: 'Recording audio from microphone for voice transcription',
    });
  } finally {
    creatingOffscreen = false;
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'request-start-recording') {
    console.log('[GlobalVoice] request-start-recording received:', request);
    if (typeof request.targetTabId === 'number') {
      recordingTargetTabId = request.targetTabId;
    }
    if (request.targetElement && typeof request.targetElement === 'object') {
      recordingTargetElement = request.targetElement;
    } else {
      recordingTargetElement = null;
    }
    console.log('[GlobalVoice] Stored target:', { recordingTargetTabId, recordingTargetElement });
    setupOffscreenDocument()
      .then(() => {
        chrome.runtime.sendMessage({ type: 'start-recording' });
      })
      .catch((error) => {
        console.error('Error setting up offscreen document:', error);
      });
    return false; // No async response needed
  }

  if (request.type === 'request-stop-recording') {
    chrome.runtime.sendMessage({ type: 'stop-recording' });
    return false; // No async response needed
  }

  if (request.type === 'recording-started') {
    return false;
  }

  if (request.type === 'recording-error') {
    return false;
  }

  if (request.type === 'recording-complete') {
    console.log('[GlobalVoice] recording-complete received');
    chrome.runtime.sendMessage({ type: 'recording-stopped' });

    chrome.storage.sync.get('apiKey', async (data) => {
      if (data.apiKey) {
        const genAI = new GoogleGenerativeAI(data.apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_ID });

        try {
          const base64Audio = request.audioData.split(',')[1];
          console.log('[GlobalVoice] Sending audio to Gemini for transcription...');

          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: base64Audio,
              },
            },
            { text: 'Transcribe the audio.' },
          ]);

          const response = await result.response;
          const text = response.text();
          console.log('[GlobalVoice] Transcription received:', text);
          console.log('[GlobalVoice] Will insert into tab:', recordingTargetTabId);
          await insertTranscriptIntoTab(recordingTargetTabId, text);
          chrome.runtime.sendMessage({ transcript: text });
        } catch (error) {
          console.error('[GlobalVoice] Error transcribing audio:', error);
          chrome.runtime.sendMessage({ error: 'Error transcribing audio.' });
        }
      } else {
        console.error('[GlobalVoice] API key not found');
        chrome.runtime.sendMessage({ error: 'API key not found.' });
      }
    });
    return false; // No async response needed - we broadcast via sendMessage
  }

  if (request.type === 'transcribe') {
    chrome.storage.sync.get('apiKey', async (data) => {
      if (data.apiKey) {
        const genAI = new GoogleGenerativeAI(data.apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_ID });

        const reader = new FileReader();
        reader.readAsDataURL(request.audio);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          try {
            const result = await model.generateContent([
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Audio,
                },
              },
              { text: 'Transcribe the audio.' },
            ]);
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
    return true; // Only this one needs async response via sendResponse
  }
  
  return false; // Default: no async response
});
