// 初始化ZXing解码器
const codeReader = new ZXing.BrowserQRCodeReader();

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

        // 显示二维码图片
        const qrImageDiv = document.getElementById('qr-image');
        qrImageDiv.innerHTML = '';
        const displayImg = img.cloneNode();
        qrImageDiv.appendChild(displayImg);

        img.onload = async () => {
            debugLog('图片加载完成，开始解析二维码');
            debugLog(`图片尺寸: ${img.naturalWidth}x${img.naturalHeight}`);

            // 等待图像完全加载
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!img.complete) {
                debugLog('图片未完全加载');
                resultDiv.textContent = '等待二维码解析...';
                errorDiv.textContent = '图片未完全加载';
                errorDiv.style.display = 'block';
                URL.revokeObjectURL(url);
                return;
            }

            try {
                // 直接使用img元素进行解码
                const result = await codeReader.decode(img);
                debugLog('二维码解析完成');
                if (result && result.text) {
                    debugLog(`成功解码二维码：${result.text}`);
                    const decodedText = result.text;
                    const copyBtn = document.getElementById('copy-btn');

                    // 检查是否为URL
                    const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(decodedText);

                    if (isUrl) {
                        // 创建可点击的链接
                        resultDiv.innerHTML = `<span class="url-link">${decodedText}</span>`;
                        const urlLink = resultDiv.querySelector('.url-link');
                        urlLink.addEventListener('click', () => {
                            chrome.tabs.create({ url: decodedText.startsWith('http') ? decodedText : `https://${decodedText}` });
                        });
                    } else {
                        resultDiv.textContent = decodedText;
                    }

                    // 显示复制按钮
                    copyBtn.style.display = 'inline-block';
                    copyBtn.onclick = async () => {
                        try {
                            await navigator.clipboard.writeText(decodedText);
                            debugLog('文本已复制到剪切板');
                        } catch (err) {
                            debugLog('复制失败');
                            console.error('复制失败:', err);
                        }
                    };

                    errorDiv.style.display = 'none';
                } else {
                    debugLog('无法解码二维码');
                    resultDiv.textContent = '等待二维码解析...';
                    errorDiv.textContent = '无法解码二维码';
                    errorDiv.style.display = 'block';
                }

                URL.revokeObjectURL(url);
            }
            catch (error) {
                console.error('Error reading clipboard:', error);
                resultDiv.textContent = '等待二维码解析...';
                errorDiv.textContent = '读取剪切板失败';
                errorDiv.style.display = 'block';
            }
        }
    }
    catch (error) {
        console.error('Error reading clipboard:', error);
        resultDiv.textContent = '等待二维码解析...';
        errorDiv.textContent = '读取剪切板失败';
        errorDiv.style.display = 'block';
    }
}

// 页面加载完成后等待获得焦点
document.addEventListener('DOMContentLoaded', () => {
    debugLog('页面加载完成，等待获得焦点');
    window.focus();
});

// 当页面获得焦点时处理剪切板
window.addEventListener('focus', () => {
    debugLog('页面获得焦点，开始处理剪切板');
    processClipboard();
});

// 通知background.js处理已完成
chrome.runtime.sendMessage({ type: 'processClipboard' }, response => {
    if (response && response.success) {
        debugLog('已通知background.js处理完成');
    }
});
