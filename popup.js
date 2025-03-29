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
    resultDiv.textContent = text;

    // Hide copy button (text content is already in clipboard, no need to copy again)
    copyBtn.style.display = 'none';
    debugLog('Copy button hidden for text content already in clipboard');

    hideError(errorDiv);
    return true;
}

// Handle decoded text
function handleDecodedText(decodedText, elements) {
    const { resultDiv, errorDiv, copyBtn } = elements;

    // Check if it's a URL
    const isUrl = /^(https?:\/\/)?[\w-]+(\.\w[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(decodedText);

    if (isUrl) {
        // Create clickable link
        resultDiv.innerHTML = `<span class="url-link">${decodedText}</span>`;
        const urlLink = resultDiv.querySelector('.url-link');
        urlLink.addEventListener('click', () => {
            chrome.tabs.create({ url: decodedText.startsWith('http') ? decodedText : `https://${decodedText}` });
        });
    } else {
        resultDiv.textContent = decodedText;
    }

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
