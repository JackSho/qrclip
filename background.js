chrome.runtime.onInstalled.addListener(() => {
  console.log('QRClip extension installed');
});

chrome.action.onClicked.addListener(async () => {
  try {
    const imageData = await navigator.clipboard.read();
    if (!imageData || !imageData[0] || !imageData[0].types.includes('image/png')) {
      chrome.runtime.sendMessage({type: 'qrCodeError', data: '剪切板中没有图片'});
      return;
    }
    const blob = await imageData[0].getType('image/png');
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        chrome.runtime.sendMessage({type: 'qrCodeResult', data: code.data});
        console.log('QR code decoded:', code.data);
      } else {
        chrome.runtime.sendMessage({type: 'qrCodeError', data: '无法解码二维码'});
        console.log('无法解码二维码');
      }
      console.log('Image loaded from clipboard:', img);
      URL.revokeObjectURL(url);
    };
  } catch (error) {
    console.error('Error reading clipboard:', error);
  }
});