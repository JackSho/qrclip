// 初始化ZXing解码器
const codeReader = new ZXing.BrowserQRCodeReader();
// 初始化ZXing编码器
const codeWriter = new ZXing.BrowserQRCodeSvgWriter();

// 调试日志函数
function debugLog(message) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
}

// 处理剪切板内容
async function processClipboard() {
    debugLog('Start reading clipboard content');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const qrImageDiv = document.getElementById('qr-image');
    const copyBtn = document.getElementById('copy-btn');

    try {
        // 尝试读取剪贴板中的文本
        try {
            const text = await navigator.clipboard.readText();
            debugLog('Clipboard text reading completed');

            if (text && text.trim() !== '') {
                debugLog(`Found text in clipboard: ${text}`);

                // 生成二维码
                qrImageDiv.innerHTML = '';
                const qrCode = codeWriter.write(text, 200, 200);
                qrImageDiv.appendChild(qrCode);

                // 显示文本内容
                resultDiv.textContent = text;

                // 隐藏复制按钮（文本内容已在剪切板中，不需要再次复制）
                copyBtn.style.display = 'none';
                debugLog('Copy button hidden for text content already in clipboard');

                errorDiv.style.display = 'none';
                return;
            }
        } catch (textError) {
            debugLog('Failed to read text from clipboard, trying image');
            console.error('Error reading clipboard text:', textError);
        }

        // 如果没有文本或读取文本失败，尝试读取图像
        const imageData = await navigator.clipboard.read();
        debugLog('Clipboard content reading completed');

        if (!imageData || !imageData[0] || !imageData[0].types.includes('image/png')) {
            debugLog('No image in clipboard or unsupported image format');
            resultDiv.textContent = 'Waiting for QR code decoding...';
            errorDiv.textContent = 'No image or text in clipboard';
            errorDiv.style.display = 'block';
            return;
        }

        const blob = await imageData[0].getType('image/png');
        debugLog('Successfully read clipboard image data');
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;

        // 显示二维码图片
        qrImageDiv.innerHTML = '';
        const displayImg = img.cloneNode();
        qrImageDiv.appendChild(displayImg);

        img.onload = async () => {
            debugLog('Image loaded, starting QR code decoding');
            debugLog(`Image size: ${img.naturalWidth}x${img.naturalHeight}`);

            // 等待图像完全加载
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!img.complete) {
                debugLog('Image not fully loaded');
                resultDiv.textContent = 'Waiting for QR code decoding...';
                errorDiv.textContent = 'Image not fully loaded';
                errorDiv.style.display = 'block';
                URL.revokeObjectURL(url);
                return;
            }

            try {
                // 直接使用img元素进行解码
                const result = await codeReader.decode(img);
                debugLog('QR code decoding completed');
                if (result && result.text) {
                    debugLog(`Successfully decoded QR code: ${result.text}`);
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
                            debugLog('Text copied to clipboard');
                        } catch (err) {
                            debugLog('Copy failed');
                            console.error('复制失败:', err);
                        }
                    };

                    errorDiv.style.display = 'none';
                } else {
                    debugLog('Unable to decode QR code');
                    resultDiv.textContent = 'Waiting for QR code decoding...';
                    errorDiv.textContent = 'Unable to decode QR code';
                    errorDiv.style.display = 'block';
                }

                URL.revokeObjectURL(url);
            }
            catch (error) {
                console.error('Error reading clipboard:', error);
                resultDiv.textContent = 'Waiting for QR code decoding...';
                errorDiv.textContent = 'Failed to decode qrcode';
                errorDiv.style.display = 'block';
            }
        }
    }
    catch (error) {
        console.error('Error reading clipboard:', error);
        resultDiv.textContent = 'Waiting for QR code decoding...';
        errorDiv.textContent = 'Failed to read clipboard';
        errorDiv.style.display = 'block';
    }
}

// 页面加载完成后等待获得焦点
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Page loaded, waiting for focus');
    window.focus();
});

// 当页面获得焦点时处理剪切板
window.addEventListener('focus', () => {
    debugLog('Page gained focus, starting clipboard processing');
    processClipboard();
});

// 通知background.js处理已完成
chrome.runtime.sendMessage({ type: 'processClipboard' }, response => {
    if (response && response.success) {
        debugLog('Notified background.js processing completed');
    }
});
