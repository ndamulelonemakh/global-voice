
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
      status.textContent = 'Opening microphone setup...';
      openMicSetupPage();
      return;
    }
    
    try {
      console.log('Requesting recording start via background...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs && tabs[0] ? tabs[0].id : undefined;
        chrome.runtime.sendMessage({ type: 'request-start-recording', targetTabId: tabId });
      });
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
    recordButton.innerHTML = '<svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 6h12v12H6z"/></svg><span>Stop Recording</span>';
    recordButton.classList.add('recording');
    status.textContent = 'Recording...';
  } else if (request.type === 'recording-error') {
    status.textContent = request.error;
    recording = false;
    recordButton.innerHTML = '<svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg><span>Start Recording</span>';
    recordButton.classList.remove('recording');
  } else if (request.type === 'recording-stopped') {
    recording = false;
    recordButton.innerHTML = '<svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg><span>Start Recording</span>';
    recordButton.classList.remove('recording');
    status.textContent = 'Transcribing...';
  } else if (request.transcript) {
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
