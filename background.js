const ALARM_NAME = 'tabRotation';

// Restore rotation state when service worker starts
chrome.runtime.onStartup.addListener(async () => {
  await restoreRotationState();
});

// Also restore on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  await restoreRotationState();
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    startRotation(request.interval).then(() => {
      sendResponse({ status: 'started' });
    });
  } else if (request.action === 'stop') {
    stopRotation().then(() => {
      sendResponse({ status: 'stopped' });
    });
  } else if (request.action === 'getStatus') {
    getRotationStatus().then((isRotating) => {
      sendResponse({ isRotating: isRotating });
    });
  }
  return true; // Keep message channel open for async response
});

// Listen for alarm to rotate tabs
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await rotateToNextTab();
  }
});

async function restoreRotationState() {
  const state = await chrome.storage.local.get(['isRotating', 'interval']);
  if (state.isRotating && state.interval) {
    // Restart rotation with saved interval
    await startRotation(state.interval);
  }
}

async function getRotationStatus() {
  const state = await chrome.storage.local.get(['isRotating']);
  return state.isRotating || false;
}

async function startRotation(interval) {
  // Stop any existing rotation
  await stopRotation();

  // Save rotation state
  await chrome.storage.local.set({
    isRotating: true,
    interval: interval,
    currentTabIndex: 0
  });

  // Create an alarm that fires at the specified interval
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: interval / 60
  });

  // Immediately rotate to the next tab
  await rotateToNextTab();
}

async function rotateToNextTab() {
  try {
    // Get current state
    const state = await chrome.storage.local.get(['currentTabIndex', 'isRotating']);
    
    if (!state.isRotating) {
      return;
    }

    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });

    if (tabs.length === 0) {
      await stopRotation();
      return;
    }

    // Calculate next tab index
    let currentTabIndex = state.currentTabIndex || 0;
    currentTabIndex = (currentTabIndex + 1) % tabs.length;

    // Save updated index
    await chrome.storage.local.set({ currentTabIndex: currentTabIndex });

    // Activate the next tab
    await chrome.tabs.update(tabs[currentTabIndex].id, { active: true });
  } catch (error) {
    console.error('Error rotating tabs:', error);
    // Reset index on error
    await chrome.storage.local.set({ currentTabIndex: 0 });
  }
}

async function stopRotation() {
  // Clear the alarm
  await chrome.alarms.clear(ALARM_NAME);
  
  // Update state
  await chrome.storage.local.set({
    isRotating: false,
    currentTabIndex: 0
  });
}
