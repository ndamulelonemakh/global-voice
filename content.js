
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'insert') {
    const activeElement = document.activeElement;
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable) {
      activeElement.value += request.transcript;
    }
  }
});
