# QRClip

A Chrome extension that detects and parses QR codes from clipboard images, and generates QR codes from clipboard text content.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID_HERE?label=Chrome%20Web%20Store)](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID_HERE)
[![GitHub](https://img.shields.io/github/v/release/JackSho/qrclip?label=GitHub)](https://github.com/JackSho/qrclip)

## Features

- Automatically detects QR codes from clipboard images
- One-click copy decoded text to clipboard
- Directly open URL if decoded content is a web address
- Generate QR codes from clipboard text content
- Automatic processing when extension popup gains focus
- Error handling for various clipboard content types
- Support for PNG image format
- Real-time display of QR code images from clipboard

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

### Decoding QR Codes from Images

1. Copy an image containing a QR code to clipboard
2. Click the extension icon
3. The decoded content will be displayed in the popup
4. Click the copy button to copy text or click the link to open URL

### Generating QR Codes from Text

1. Copy any text or URL to clipboard
2. Click the extension icon
3. The extension will generate a QR code from your text
4. The generated QR code will be displayed in the popup
5. You can scan this QR code with any QR code scanner

## CHANGES

### 1.0

- Project initialization, implemented basic QR code recognition functionality.
  - Support detecting QR codes from clipboard image.
  - Support generating QR codes from clipboard text.
