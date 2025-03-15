// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');

    if (message.type === 'qrCodeResult') {
        resultDiv.textContent = message.data;
        errorDiv.style.display = 'none';
    } else if (message.type === 'qrCodeError') {
        resultDiv.textContent = '等待二维码解析...';
        errorDiv.textContent = message.data;
        errorDiv.style.display = 'block';
    }
});