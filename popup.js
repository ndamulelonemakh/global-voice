
const recordButton = document.getElementById('record');
const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key');
const status = document.getElementById('status');

let recording = false;

saveKeyButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value;
  chrome.storage.sync.set({ apiKey }, () => {
    status.textContent = 'API key saved.';
  });
});

let mediaRecorder;
let chunks = [];

recordButton.addEventListener('click', async () => {
  if (!recording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      recording = true;
      recordButton.textContent = 'Stop Recording';
      recordButton.classList.add('recording');
      status.textContent = 'Recording...';

      mediaRecorder.addEventListener('dataavailable', event => {
        chunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];
        chrome.runtime.sendMessage({ type: 'transcribe', audio: blob });
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      status.textContent = 'Error starting recording.';
    }
  } else {
    mediaRecorder.stop();
    recording = false;
    recordButton.textContent = 'Start Recording';
    recordButton.classList.remove('recording');
    status.textContent = '';
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.transcript) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'insert', transcript: request.transcript });
    });
  } else if (request.error) {
    status.textContent = request.error;
  }
});
chrome.storage.sync.get('apiKey', (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
  }
});
