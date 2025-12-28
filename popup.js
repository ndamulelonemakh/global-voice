
const recordButton = document.getElementById('record');
const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key');
const status = document.getElementById('status');

let recording = false;
let micPermissionGranted = false;

saveKeyButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value;
  chrome.storage.sync.set({ apiKey }, () => {
    status.textContent = 'API key saved.';
  });
});

// Check if we already have microphone permission
async function checkMicPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    micPermissionGranted = result.state === 'granted';
    console.log('Mic permission state:', result.state);
    return result.state;
  } catch (e) {
    console.log('Permissions API not available');
    return 'unknown';
  }
}

// Open the setup page to get permission
function openMicSetupPage() {
  chrome.tabs.create({ url: chrome.runtime.getURL('mic-setup.html') });
}

recordButton.addEventListener('click', async () => {
  if (!recording) {
    const permState = await checkMicPermission();
    
    if (permState === 'denied') {
      status.textContent = 'Microphone blocked. Click to open settings.';
      status.style.cursor = 'pointer';
      status.onclick = openMicSetupPage;
      return;
    }
    
    if (permState !== 'granted') {
      // Need to get permission first - open setup page
      status.textContent = 'Opening microphone setup...';
      openMicSetupPage();
      return;
    }
    
    // Permission granted, start recording via offscreen
    try {
      console.log('Requesting recording start via background...');
      chrome.runtime.sendMessage({ type: 'request-start-recording' });
      status.textContent = 'Starting...';
    } catch (error) {
      console.error('Error requesting recording:', error);
      status.textContent = 'Error starting recording.';
    }
  } else {
    chrome.runtime.sendMessage({ type: 'request-stop-recording' });
    status.textContent = 'Processing...';
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'recording-started') {
    recording = true;
    recordButton.textContent = 'Stop Recording';
    recordButton.classList.add('recording');
    status.textContent = 'Recording...';
  } else if (request.type === 'recording-error') {
    status.textContent = request.error;
    recording = false;
    recordButton.textContent = 'Start Recording';
    recordButton.classList.remove('recording');
  } else if (request.type === 'recording-stopped') {
    recording = false;
    recordButton.textContent = 'Start Recording';
    recordButton.classList.remove('recording');
    status.textContent = 'Transcribing...';
  } else if (request.transcript) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'insert', transcript: request.transcript });
    });
    status.textContent = 'Done!';
  } else if (request.error) {
    status.textContent = request.error;
  }
});

chrome.storage.sync.get('apiKey', (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
  }
});
