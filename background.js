chrome.runtime.onInstalled.addListener(() => {
  console.log('QRClip extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'processClipboard') {
    console.log('Background received processClipboard message');
    sendResponse({success: true});
  }
});