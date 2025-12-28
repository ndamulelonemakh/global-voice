const enableButton = document.getElementById('enable-mic');
const statusDiv = document.getElementById('status');

enableButton.addEventListener('click', async () => {
  enableButton.disabled = true;
  enableButton.textContent = 'Requesting access...';
  
  try {
    // This WILL show the permission prompt because we're in a visible tab with user gesture
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Permission granted! Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    // Notify the extension that permission is granted
    chrome.runtime.sendMessage({ type: 'mic-permission-granted' });
    
    statusDiv.style.display = 'block';
    statusDiv.className = 'status success';
    statusDiv.textContent = '✓ Microphone access granted! You can close this tab and use the extension.';
    
    enableButton.textContent = 'Permission Granted ✓';
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
    
  } catch (error) {
    console.error('Microphone access error:', error);
    
    statusDiv.style.display = 'block';
    statusDiv.className = 'status error';
    
    if (error.name === 'NotAllowedError') {
      statusDiv.innerHTML = '✗ Permission denied. Please click the camera icon in the address bar and allow microphone access, or check macOS System Settings → Privacy & Security → Microphone → Chrome';
    } else if (error.name === 'NotFoundError') {
      statusDiv.textContent = '✗ No microphone found. Please connect a microphone.';
    } else {
      statusDiv.textContent = `✗ Error: ${error.message}`;
    }
    
    enableButton.disabled = false;
    enableButton.textContent = 'Try Again';
  }
});
