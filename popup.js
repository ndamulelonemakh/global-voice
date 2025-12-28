const recordButton = document.getElementById('record');
const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key');
const status = document.getElementById('status');

let recording = false;
let _micPermissionGranted = false;

saveKeyButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value;
  chrome.storage.sync.set({ apiKey }, () => {
    status.textContent = 'API key saved.';
  });
});
async function checkMicPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    _micPermissionGranted = result.state === 'granted';
    return result.state;
  } catch (_e) {
    console.log('Permissions API not available');
    return 'unknown';
  }
}
function openMicSetupPage() {
  chrome.tabs.create({ url: chrome.runtime.getURL('mic-setup.html') });
}

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
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs?.[0] ? tabs[0].id : undefined;
        (async () => {
          let target = null;
          try {
            if (typeof tabId === 'number') {
              const results = await executeScript({
                target: { tabId },
                func: () => {
                  const el = document.activeElement;
                  if (!el) return null;

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
                  const isEditable = el.isContentEditable === true;

                  if (!isTextInput && !isEditable) return null;

                  const esc = (s) => CSS.escape(s);

                  const selectorFor = (node) => {
                    if (!node || node.nodeType !== 1) return null;
                    if (node.id) return `#${esc(node.id)}`;
                    if (node.getAttribute?.('name')) {
                      return `${node.tagName.toLowerCase()}[name="${node.getAttribute('name').replace(/"/g, '\\"')}"]`;
                    }

                    const parts = [];
                    let cur = node;
                    let depth = 0;
                    while (
                      cur &&
                      cur.nodeType === 1 &&
                      cur !== document.body &&
                      depth < 6
                    ) {
                      let part = cur.tagName.toLowerCase();
                      const className = (cur.getAttribute('class') || '')
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(esc)
                        .join('.');
                      if (className) part += `.${className}`;

                      const parent = cur.parentElement;
                      if (!parent) break;
                      const siblings = Array.from(parent.children).filter(
                        (c) => c.tagName === cur.tagName,
                      );
                      if (siblings.length > 1) {
                        const index = siblings.indexOf(cur) + 1;
                        part += `:nth-of-type(${index})`;
                      }
                      parts.unshift(part);
                      cur = parent;
                      depth++;
                    }
                    if (parts.length === 0) return null;
                    return parts.join(' > ');
                  };

                  return {
                    selector: selectorFor(el),
                    isTextInput,
                    isEditable,
                  };
                },
              });
              target = results?.[0] ? results[0].result : null;
            }
          } catch (_e) {
            target = null;
          }
          chrome.runtime.sendMessage({
            type: 'request-start-recording',
            targetTabId: tabId,
            targetElement: target,
          });
        })();
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

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'recording-started') {
    recording = true;
    recordButton.innerHTML =
      '<svg class="mic-icon" viewBox="0 0 24 24" width="20" height="20"><rect fill="currentColor" x="6" y="6" width="12" height="12" rx="2"/></svg><span>Stop Recording</span>';
    recordButton.classList.add('recording');
    status.textContent = 'Recording...';
  } else if (request.type === 'recording-error') {
    status.textContent = request.error;
    recording = false;
    recordButton.innerHTML =
      '<svg class="mic-icon" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg><span>Start Recording</span>';
    recordButton.classList.remove('recording');
  } else if (request.type === 'recording-stopped') {
    recording = false;
    recordButton.innerHTML =
      '<svg class="mic-icon" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg><span>Start Recording</span>';
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
