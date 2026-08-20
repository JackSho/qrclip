# QRClip Development Guide

## Project Overview

QRClip is a small Chrome extension that converts clipboard content in both
directions:

- Clipboard text is rendered as a QR code.
- A QR code in a clipboard PNG image is decoded into text.

The extension uses Manifest V3 and plain JavaScript, HTML, and CSS. There is no
build step, package manager, or automated test suite in this repository.

## Repository Layout

- `manifest.json` defines the extension metadata, permissions, popup, icons,
  and background service worker.
- `popup.html` contains the popup markup and loads the runtime scripts.
- `popup.js` owns clipboard access, QR encoding and decoding, popup state, and
  user interactions.
- `background.js` handles extension lifecycle and runtime messages.
- `styles.css` defines the popup layout and visual styles.
- `js/zxing-0.21.3.min.js` is the vendored ZXing browser bundle.
- `images/` contains Chrome Web Store and toolbar icons.

## Development Workflow

No dependency installation or compilation is required. Test local changes as
an unpacked extension:

1. Open `chrome://extensions/` in Chrome.
2. Enable Developer mode.
3. Choose **Load unpacked** and select the repository root.
4. After each change, reload QRClip from the extensions page.
5. Open the popup and use its DevTools console to inspect popup behavior.
6. Inspect the service worker from the extensions page when changing
   `background.js`.

Do not introduce a build tool or package manager unless the change requires it
and the repository owner has approved that project-level decision.

## Coding Conventions

- Keep implementation code in plain browser-compatible JavaScript.
- Follow the indentation and formatting already used in the file being edited.
- Use semicolons in JavaScript.
- Use `camelCase` for variables and functions, and name functions with verbs
  that describe their behavior.
- Use `kebab-case` for HTML IDs and CSS class names.
- Prefer small functions with one clear responsibility.
- Use `async`/`await` for clipboard and QR operations, with user-visible error
  handling at the operation boundary.
- Treat all clipboard content as untrusted. Render text with `textContent` or
  explicitly created DOM nodes; do not interpolate clipboard data into HTML.
- Revoke every object URL after image processing, including failure paths.
- Keep configuration values replaceable at runtime when adding timeouts,
  thresholds, or limits; do not scatter unexplained constants.
- Comments should explain behavior or constraints, not development history.

## Extension Constraints

- Preserve Manifest V3 compatibility.
- Keep extension permissions minimal. Add a permission only when a feature
  requires it and document the reason in the change.
- Preserve the current clipboard priority: process non-empty text first, then
  fall back to PNG image processing.
- Keep popup element IDs synchronized across `popup.html`, `popup.js`, and
  `styles.css`.
- Do not edit the vendored minified ZXing file directly. Replace it with a
  clearly identified upstream version when upgrading.
- Keep the extension functional without remote scripts or runtime downloads.

## Validation

There is currently no automated test command. Manually verify the relevant
flows in Chrome before considering a change complete:

- Copy plain text and confirm that the popup displays it and generates a QR
  code.
- Copy a URL and confirm that the generated QR code represents the full URL.
- Copy a PNG containing a QR code and confirm that the popup decodes it.
- Confirm decoded non-URL text can be copied with the copy button.
- Confirm decoded URLs open with the expected `http` or `https` scheme.
- Check empty, unsupported, and non-QR clipboard content for a clear error.
- Check the popup console and service worker console for unexpected errors.

When changing `manifest.json`, reload the unpacked extension and confirm Chrome
accepts the manifest without warnings or permission surprises.

## Documentation and Commits

- Keep user-facing documentation in English.
- Update `README.md` when installation, behavior, permissions, or supported
  clipboard formats change.
- Do not commit generated local files or browser profile data.
- Keep commits focused and describe the actual behavior or documentation
  change.
