// Initialize ZXing decoder
const codeReader = new ZXing.BrowserQRCodeReader();
// Initialize ZXing encoder
const codeWriter = new ZXing.BrowserQRCodeSvgWriter();

// Debug log function
function debugLog(message) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
}

// Get DOM elements
function getDOMElements() {
    return {
        resultDiv: document.getElementById('result'),
        errorDiv: document.getElementById('error'),
        qrImageDiv: document.getElementById('qr-image'),
        copyBtn: document.getElementById('copy-btn')
    };
}

// Show error message
function showError(errorDiv, resultDiv, message) {
    resultDiv.textContent = 'Waiting for QR code decoding...';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError(errorDiv) {
    errorDiv.style.display = 'none';
}

// Process text content from clipboard
async function processClipboardText(text, elements) {
    const { resultDiv, errorDiv, qrImageDiv, copyBtn } = elements;

    if (!text || text.trim() === '') {
        return false;
    }

    debugLog(`Found text in clipboard: ${text}`);

    // Generate QR code
    qrImageDiv.innerHTML = '';
    const qrCode = codeWriter.write(text, 200, 200);
    qrImageDiv.appendChild(qrCode);

    // Display text content
    renderResult(text, elements);

    // Hide copy button (text content is already in clipboard, no need to copy again)
    copyBtn.style.display = 'none';
    debugLog('Copy button hidden for text content already in clipboard');

    hideError(errorDiv);
    return true;
}

function parseHttpUrl(text) {
    if (typeof text !== 'string') {
        return null;
    }

    const displayText = text.trim();
    if (!displayText) {
        return null;
    }
    if (!/^https?:\/\/[^/]/i.test(displayText) ||
        /[\s\u0000-\u001F\u007F\\]/.test(displayText)) {
        return null;
    }

    try {
        const parsedUrl = new URL(displayText);
        if ((parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') ||
            !parsedUrl.hostname) {
            return null;
        }

        return { displayText, url: parsedUrl.href };
    } catch (error) {
        return null;
    }
}

// Render text content, making only complete HTTP(S) URLs clickable
function renderResult(text, elements) {
    const { resultDiv, errorDiv } = elements;
    const parsedUrl = parseHttpUrl(text);

    resultDiv.replaceChildren();

    if (!parsedUrl) {
        resultDiv.textContent = text;
        return;
    }

    const urlLink = document.createElement('a');
    urlLink.className = 'url-link';
    urlLink.href = parsedUrl.url;
    urlLink.textContent = parsedUrl.displayText;
    urlLink.addEventListener('click', async event => {
        event.preventDefault();
        try {
            await chrome.tabs.create({ url: parsedUrl.url });
        } catch (error) {
            console.error('Failed to open link:', error);
            errorDiv.textContent = 'Failed to open link';
            errorDiv.style.display = 'block';
        }
    });
    resultDiv.appendChild(urlLink);
}

// Handle decoded text
function handleDecodedText(decodedText, elements) {
    const { errorDiv, copyBtn } = elements;

    renderResult(decodedText, elements);

    // Show copy button
    copyBtn.style.display = 'inline-block';
    copyBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(decodedText);
            debugLog('Text copied to clipboard');
        } catch (err) {
            debugLog('Copy failed');
            console.error('Copy failed:', err);
        }
    };

    hideError(errorDiv);
}

// Process image content from clipboard
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

        // Display QR code image
        qrImageDiv.innerHTML = '';
        const displayImg = img.cloneNode();
        qrImageDiv.appendChild(displayImg);

        // Process image loading and decoding
        await processLoadedImage(img, url, elements);
        return true;
    } catch (error) {
        console.error('Error reading clipboard image:', error);
        showError(errorDiv, resultDiv, 'Failed to read clipboard');
        return false;
    }
}

// Process loaded image and decode QR code
async function processLoadedImage(img, url, elements) {
    const { resultDiv, errorDiv } = elements;

    return new Promise(resolve => {
        img.onload = async () => {
            debugLog('Image loaded, starting QR code decoding');
            debugLog(`Image size: ${img.naturalWidth}x${img.naturalHeight}`);

            // Wait for image to fully load
            await new Promise(r => setTimeout(r, 100));

            if (!img.complete) {
                debugLog('Image not fully loaded');
                showError(errorDiv, resultDiv, 'Image not fully loaded');
                URL.revokeObjectURL(url);
                resolve(false);
                return;
            }

            try {
                // Directly use img element for decoding
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

// Process clipboard content
async function processClipboard() {
    debugLog('Start reading clipboard content');
    const elements = getDOMElements();

    try {
        // Try to read text from clipboard
        try {
            const text = await navigator.clipboard.readText();
            debugLog('Clipboard text reading completed');

            // If text was processed successfully, return
            if (await processClipboardText(text, elements)) {
                return;
            }
        } catch (textError) {
            debugLog('Failed to read text from clipboard, trying image');
            console.error('Error reading clipboard text:', textError);
        }

        // If no text or text reading failed, try reading image
        await processClipboardImage(elements);
    } catch (error) {
        console.error('Error reading clipboard:', error);
        showError(elements.errorDiv, elements.resultDiv, 'Failed to read clipboard');
    }
}

// Wait for focus after page loads
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Page loaded, waiting for focus');
    window.focus();
});

// Process clipboard when page gains focus
window.addEventListener('focus', () => {
    debugLog('Page gained focus, starting clipboard processing');
    processClipboard();
});

// Notify background.js that processing is complete
chrome.runtime.sendMessage({ type: 'processClipboard' }, response => {
    if (response && response.success) {
        debugLog('Notified background.js processing completed');
    }
});
