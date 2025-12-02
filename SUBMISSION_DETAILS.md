# Chrome Web Store Submission Details

Use the following text when asked to justify each permission in the "Privacy" tab of the Chrome Web Store Developer Dashboard.

## Permissions Justifications

### `tabs`
**Justification:**
The `tabs` permission is the core requirement for this extension's functionality. The extension works by automatically rotating through the user's open tabs.
*   It uses `chrome.tabs.query({ currentWindow: true })` to retrieve the list of currently open tabs in the window.
*   It uses `chrome.tabs.update(tabId, { active: true })` to activate the next tab in the sequence.
Without this permission, the extension cannot see which tabs are open or switch between them.

### `storage`
**Justification:**
The `storage` permission is used exclusively to save the user's configuration settings locally on their device.
*   It stores the "Interval" (in seconds) that the user sets in the popup.
*   It stores the current "Running" or "Stopped" state.
*   This ensures that the user's preferences are preserved between browser sessions.
*   Data is stored using `chrome.storage.local` and is never transmitted off the device.

### `alarms`
**Justification:**
The `alarms` permission is required to reliably schedule the tab rotation events.
*   The extension uses `chrome.alarms.create` to set a recurring timer based on the user's chosen interval.
*   It listens for `chrome.alarms.onAlarm` to trigger the `rotateToNextTab` function.
*   This API is necessary because standard JavaScript `setInterval` timers in a service worker (Manifest V3) can be terminated by the browser to save resources, whereas the Alarms API ensures the rotation continues reliably.
