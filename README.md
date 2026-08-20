# QRClip

A Chrome extension that detects and parses QR codes from clipboard images, and generates QR codes from clipboard text content.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/oimgoeaiackbfhgdidmiffkcgmhgknnm?label=QRClip)](https://chrome.google.com/webstore/detail/oimgoeaiackbfhgdidmiffkcgmhgknnm)

## Features

- Automatically detects QR codes from clipboard images
- One-click copy decoded text to clipboard
- Only complete decoded HTTP/HTTPS links can be opened in a new tab
- Generate QR codes from clipboard text content
- Show complete HTTP/HTTPS clipboard text as a clickable link while generating
  its QR code

## Installation

1. Go to [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/oimgoeaiackbfhgdidmiffkcgmhgknnm?label=QRClip)](https://chrome.google.com/webstore/detail/oimgoeaiackbfhgdidmiffkcgmhgknnm)
2. Click Button `Add To Chrome`.

## Usage

### Decoding QR Codes from Images

1. Copy an image containing a QR code to clipboard
2. Click the extension icon
3. The decoded content will be displayed in the popup
4. Click the copy button to copy text, or click a decoded HTTP/HTTPS link to
   open it in a new tab

### Generating QR Codes from Text

1. Copy any text or URL to clipboard
2. Click the extension icon
3. The extension will generate a QR code from your text
4. Complete HTTP/HTTPS clipboard text is displayed as a clickable link; click
   it to open the link in a new tab
5. Other clipboard text is displayed as plain text
6. The generated QR code will be displayed in the popup
7. You can scan this QR code with any QR code scanner

## CHANGES

### 1.1

- Display complete HTTP/HTTPS clipboard text as a clickable link.
- Only treat complete decoded HTTP/HTTPS URLs as clickable links.

### 1.0

- Project initialization, implemented basic QR code recognition functionality.
  - Support detecting QR codes from clipboard image.
  - Support generating QR codes from clipboard text.
