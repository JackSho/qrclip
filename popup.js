// 导入jsQR库
const script = document.createElement('script');
script.src = 'js/jsQR.js';
document.head.appendChild(script);

// 调试日志函数
function debugLog(message) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
}

// 处理剪切板内容
async function processClipboard() {
    debugLog('开始读取剪切板内容');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');

    try {
        const imageData = await navigator.clipboard.read();
        debugLog('剪切板内容读取完成');

        if (!imageData || !imageData[0] || !imageData[0].types.includes('image/png')) {
            debugLog('剪切板中没有图片或图片格式不支持');
            resultDiv.textContent = '等待二维码解析...';
            errorDiv.textContent = '剪切板中没有图片';
            errorDiv.style.display = 'block';
            return;
        }

        const blob = await imageData[0].getType('image/png');
        debugLog('成功读取剪切板图片数据');
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;

        img.onload = () => {
            debugLog('图片加载完成，开始解析二维码');
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                debugLog(`成功解码二维码：${code.data}`);
                resultDiv.textContent = code.data;
                errorDiv.style.display = 'none';
            } else {
                debugLog('无法解码二维码');
                resultDiv.textContent = '等待二维码解析...';
                errorDiv.textContent = '无法解码二维码';
                errorDiv.style.display = 'block';
            }

            URL.revokeObjectURL(url);
        };
    } catch (error) {
        console.error('Error reading clipboard:', error);
        resultDiv.textContent = '等待二维码解析...';
        errorDiv.textContent = '读取剪切板失败';
        errorDiv.style.display = 'block';
    }
}

// 页面加载完成后开始处理剪切板
document.addEventListener('DOMContentLoaded', () => {
    debugLog('页面加载完成，开始处理剪切板');
    processClipboard();
});

// 通知background.js处理已完成
chrome.runtime.sendMessage({type: 'processClipboard'}, response => {
    if (response && response.success) {
        debugLog('已通知background.js处理完成');
    }
});