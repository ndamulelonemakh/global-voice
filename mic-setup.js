const enableButton = document.getElementById('enable-mic');
const statusDiv = document.getElementById('status');

enableButton.addEventListener('click', async () => {
  enableButton.disabled = true;
  enableButton.textContent = 'Requesting...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    chrome.runtime.sendMessage({ type: 'mic-permission-granted' });
    statusDiv.style.display = 'block';
    statusDiv.className = 'status success';
    statusDiv.textContent =
      'Microphone access granted. You can close this tab.';
    enableButton.textContent = 'Allowed';
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    statusDiv.style.display = 'block';
    statusDiv.className = 'status error';
    enableButton.disabled = false;
    enableButton.textContent = 'Allow';

    if (error.name === 'NotAllowedError') {
      statusDiv.innerHTML =
        'Permission denied. Click the camera icon in the address bar to allow access, or check System Settings → Privacy & Security → Microphone.';
    } else if (error.name === 'NotFoundError') {
      statusDiv.textContent =
        'No microphone detected. Please connect a microphone and try again.';
    } else {
      statusDiv.textContent = `Unable to access microphone: ${error.message}`;
    }
  }
});
