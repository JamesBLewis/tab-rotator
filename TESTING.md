# Testing Tab Rotator

## Manual Testing Guide

### Test 1: Basic Rotation
1. Load the extension in Chrome (chrome://extensions/, enable Developer mode, Load unpacked)
2. Open 3-5 tabs
3. Click the Tab Rotator extension icon
4. Set interval to 5 seconds
5. Click "Start Rotation"
6. Verify that tabs rotate every 5 seconds
7. Status should show "Running"

### Test 2: Service Worker Persistence (Main Bug Fix)
This test verifies that rotation continues even after the service worker is terminated.

1. Follow Test 1 to start rotation
2. Open Chrome DevTools for the service worker:
   - Go to chrome://extensions/
   - Find Tab Rotator extension
   - Click "service worker" link to open DevTools
3. Let rotation run for 10-15 seconds to verify it's working
4. In the service worker DevTools console, force terminate the service worker:
   - Click the "Terminate" button in the service worker DevTools toolbar
   - OR wait 30 seconds for Chrome to auto-terminate inactive service workers
5. **Expected Result**: Tabs should continue rotating at the specified interval
6. Open the popup again - status should still show "Running"

### Test 3: Stop and Restart
1. Start rotation (Test 1)
2. Click "Stop Rotation"
3. Verify rotation stops and status shows "Stopped"
4. Click "Start Rotation" again
5. Verify rotation resumes

### Test 4: Persistence Across Browser Restart
1. Start rotation with a 10-second interval
2. Close the popup
3. Verify rotation is happening
4. Completely close and restart Chrome
5. **Expected Result**: Extension should automatically resume rotation after Chrome restarts
6. Open the popup - status should show "Running"

### Test 5: Edge Cases
1. Start rotation with only 1 tab open
   - Should work without errors
2. Close tabs during rotation
   - Should handle gracefully and continue with remaining tabs
3. Open new tabs during rotation
   - Should include new tabs in rotation cycle

## Debugging

If rotation stops unexpectedly:
1. Check service worker console for errors: chrome://extensions/ → service worker
2. Check storage state:
   ```javascript
   chrome.storage.local.get(['isRotating', 'interval', 'currentTabIndex'], console.log)
   ```
3. Check active alarms:
   ```javascript
   chrome.alarms.getAll(console.log)
   ```
