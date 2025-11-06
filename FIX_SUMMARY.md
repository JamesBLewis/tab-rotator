# Tab Rotation Bug Fix

## Issue
Tab rotation would stop after a period of time, even though it had been successfully started. The popup would show "Stopped" status even though the user had started rotation.

## Root Cause
Chrome Manifest V3 uses service workers for background scripts. Service workers have a lifecycle where they:
1. Start when needed (extension event, alarm, message, etc.)
2. Run for a short time
3. Terminate after ~30 seconds of inactivity to save resources

The original implementation used:
- `setInterval()` for scheduling tab rotation
- In-memory global variables for state (`isRotating`, `rotationInterval`, `currentTabIndex`, `allTabs`)

When the service worker terminated:
- The `setInterval` was lost (not persisted)
- All global variables were reset to initial values
- The rotation stopped permanently

## Solution
Replaced the implementation with persistent mechanisms that survive service worker restarts:

### 1. Chrome Alarms API (`chrome.alarms`)
- Replaced `setInterval()` with `chrome.alarms.create()`
- Alarms persist across service worker terminations
- Chrome guarantees alarms fire even if the service worker is terminated
- When an alarm fires, Chrome wakes up the service worker

### 2. Chrome Storage API (`chrome.storage.local`)
- Replaced in-memory variables with persistent storage
- State includes: `isRotating`, `interval`, `currentTabIndex`
- Storage persists across service worker restarts and browser restarts

### 3. State Restoration
- Added listeners for `chrome.runtime.onStartup` and `chrome.runtime.onInstalled`
- When service worker starts, it checks storage for active rotation state
- If rotation was active, it automatically restarts with saved interval

## Technical Changes

### manifest.json
- Added `"alarms"` permission

### background.js
- Removed global variables: `rotationInterval`, `isRotating`, `currentTabIndex`, `allTabs`
- Added `restoreRotationState()` function to restore rotation on service worker startup
- Modified `startRotation()` to:
  - Save state to `chrome.storage.local`
  - Use `chrome.alarms.create()` instead of `setInterval()`
- Modified `rotateToNextTab()` to:
  - Read state from storage
  - Save updated state to storage
- Modified `stopRotation()` to:
  - Clear alarm with `chrome.alarms.clear()`
  - Update storage state
- Modified `getRotationStatus()` to read from storage
- Converted all functions to async/await for proper storage handling

### popup.js
- No changes needed - continues to work with the new background implementation

## Benefits
1. **Reliability**: Rotation continues indefinitely, even after service worker terminations
2. **Persistence**: Rotation state survives browser restarts
3. **Resource Efficiency**: Service worker can terminate when idle, saving resources
4. **Chrome Best Practices**: Uses recommended Manifest V3 patterns

## Testing
See TESTING.md for comprehensive manual testing guide, including:
- Basic rotation test
- Service worker persistence test (verifying the fix)
- Browser restart persistence test
- Edge case handling
