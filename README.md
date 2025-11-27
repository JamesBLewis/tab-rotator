# Tab Rotator Chrome Extension

A simple Chrome extension that automatically rotates through all open tabs in the current window at a configurable interval.

## Features

- Rotate through all tabs in the current window
- Configurable interval (in seconds)
- Start/Stop controls
- Saves your interval preference
- Clean, simple interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked"
4. Select the `rotate-chrome` directory
5. The Tab Rotator extension should now appear in your extensions list

## Usage

1. Click the Tab Rotator icon in your Chrome toolbar
2. Set your desired interval in seconds (default is 5 seconds)
3. Click "Start Rotation" to begin cycling through tabs
4. Click "Stop Rotation" to stop the rotation

The extension will rotate through all tabs in the current window, moving to the next tab after the specified interval.

## Files

- `manifest.json` - Extension configuration
- `background.js` - Service worker handling tab rotation logic
- `popup.html` - Popup interface
- `popup.js` - Popup interaction logic
- `popup.css` - Popup styling
- `icon.svg` - SVG icon (can be converted to PNG if desired)

## Notes

- The extension only rotates tabs in the current Chrome window
- If tabs are closed during rotation, the extension will automatically adjust
- Your interval preference is saved and will be remembered next time you open the popup

## Permissions

- **tabs**: To rotate through open tabs
- **storage**: To save your interval preference locally
- **alarms**: To schedule the rotation timer

## Customization

You can customize the extension by:
- Modifying the styling in `popup.css`
- Adding custom icons (16x16, 48x48, 128x128 PNG files)
- Adjusting the rotation logic in `background.js`
