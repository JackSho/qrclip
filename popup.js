// 初始化ZXing解码器
const codeReader = new ZXing.BrowserQRCodeReader();
// 初始化ZXing编码器
const codeWriter = new ZXing.BrowserQRCodeSvgWriter();

// 调试日志函数
function debugLog(message) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
}

// 获取DOM元素
function getDOMElements() {
    return {
        resultDiv: document.getElementById('result'),
        errorDiv: document.getElementById('error'),
        qrImageDiv: document.getElementById('qr-image'),
        copyBtn: document.getElementById('copy-btn')
    };
}

// 显示错误信息
function showError(errorDiv, resultDiv, message) {
    resultDiv.textContent = 'Waiting for QR code decoding...';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// 隐藏错误信息
function hideError(errorDiv) {
    errorDiv.style.display = 'none';
}

// 处理剪贴板中的文本内容
async function processClipboardText(text, elements) {
    const { resultDiv, errorDiv, qrImageDiv, copyBtn } = elements;

    if (!text || text.trim() === '') {
        return false;
    }

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

    hideError(errorDiv);
    return true;
}

// 处理解码后的文本
function handleDecodedText(decodedText, elements) {
    const { resultDiv, errorDiv, copyBtn } = elements;

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

    hideError(errorDiv);
}

// 处理剪贴板中的图像内容
async function processClipboardImage(elements) {
    const { resultDiv, errorDiv, qrImageDiv } = elements;

    try {
        const imageData = await navigator.clipboard.read();
        debugLog('Clipboard content reading completed');

        if (!imageData || !imageData[0] || !imageData[0].types.includes('image/png')) {
            debugLog('No image in clipboard or unsupported image format');
            showError(errorDiv, resultDiv, 'No image or text in clipboard');
            return false;
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

        // 处理图像加载和解码
        await processLoadedImage(img, url, elements);
        return true;
    } catch (error) {
        console.error('Error reading clipboard image:', error);
        showError(errorDiv, resultDiv, 'Failed to read clipboard');
        return false;
    }
}

// 处理加载的图像并解码二维码
async function processLoadedImage(img, url, elements) {
    const { resultDiv, errorDiv } = elements;

    return new Promise(resolve => {
        img.onload = async () => {
            debugLog('Image loaded, starting QR code decoding');
            debugLog(`Image size: ${img.naturalWidth}x${img.naturalHeight}`);

            // 等待图像完全加载
            await new Promise(r => setTimeout(r, 100));

            if (!img.complete) {
                debugLog('Image not fully loaded');
                showError(errorDiv, resultDiv, 'Image not fully loaded');
                URL.revokeObjectURL(url);
                resolve(false);
                return;
            }

            try {
                // 直接使用img元素进行解码
                const result = await codeReader.decode(img);
                debugLog('QR code decoding completed');

                if (result && result.text) {
                    debugLog(`Successfully decoded QR code: ${result.text}`);
                    handleDecodedText(result.text, elements);
                    resolve(true);
                } else {
                    debugLog('Unable to decode QR code');
                    showError(errorDiv, resultDiv, 'Unable to decode QR code');
                    resolve(false);
                }
            } catch (error) {
                console.error('Error decoding QR code:', error);
                showError(errorDiv, resultDiv, 'Failed to decode qrcode');
                resolve(false);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
    });
}

// 处理剪切板内容
async function processClipboard() {
    debugLog('Start reading clipboard content');
    const elements = getDOMElements();

    try {
        // 尝试读取剪贴板中的文本
        try {
            const text = await navigator.clipboard.readText();
            debugLog('Clipboard text reading completed');

            // 如果成功处理了文本，则返回
            if (await processClipboardText(text, elements)) {
                return;
            }
        } catch (textError) {
            debugLog('Failed to read text from clipboard, trying image');
            console.error('Error reading clipboard text:', textError);
        }

        // 如果没有文本或读取文本失败，尝试读取图像
        await processClipboardImage(elements);
    } catch (error) {
        console.error('Error reading clipboard:', error);
        showError(elements.errorDiv, elements.resultDiv, 'Failed to read clipboard');
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
