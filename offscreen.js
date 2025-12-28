let mediaRecorder;
let chunks = [];

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.type === 'start-recording') {
    startRecording();
  } else if (request.type === 'stop-recording') {
    stopRecording();
  }
  return true;
});

async function startRecording() {
  try {
    console.log('Offscreen: Attempting to access microphone...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Offscreen: Microphone access granted');

    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.addEventListener('dataavailable', (event) => {
      chunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      chunks = [];
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        chrome.runtime.sendMessage({
          type: 'recording-complete',
          audioData: reader.result,
        });
      };
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });

    mediaRecorder.start();
    chrome.runtime.sendMessage({ type: 'recording-started' });
  } catch (error) {
    console.error('Offscreen: Error accessing microphone:', error);
    let errorMessage = 'Error starting recording.';

    if (error.name === 'NotAllowedError') {
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone is being used by another application.';
    } else {
      errorMessage = `Recording error: ${error.name} - ${error.message}`;
    }

    chrome.runtime.sendMessage({
      type: 'recording-error',
      error: errorMessage,
    });
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
