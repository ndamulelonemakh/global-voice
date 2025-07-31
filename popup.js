
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

async function checkMicrophonePermission() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    console.log('Microphone permission status:', result.state);
    return result.state;
  } catch (error) {
    console.log('Permissions API not supported, will try direct access');
    return 'unknown';
  }
}

recordButton.addEventListener('click', async () => {
  if (!recording) {
    try {
      console.log('Attempting to access microphone...');
      const permissionStatus = await checkMicrophonePermission();
      console.log('Permission status:', permissionStatus);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
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
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      let errorMessage = 'Error starting recording.';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow access, then try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Audio recording not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Microphone access was aborted.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked by security policy.';
      } else {
        errorMessage = `Recording error: ${error.name} - ${error.message}`;
      }

      status.textContent = errorMessage;
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
