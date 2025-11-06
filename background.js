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
    startRotation(request.interval)
      .then(() => {
        sendResponse({ status: 'started' });
      })
      .catch((error) => {
        console.error('Error starting rotation:', error);
        sendResponse({ status: 'error', error: error.message });
      });
  } else if (request.action === 'stop') {
    stopRotation()
      .then(() => {
        sendResponse({ status: 'stopped' });
      })
      .catch((error) => {
        console.error('Error stopping rotation:', error);
        sendResponse({ status: 'error', error: error.message });
      });
  } else if (request.action === 'getStatus') {
    getRotationStatus()
      .then((isRotating) => {
        sendResponse({ isRotating: isRotating });
      })
      .catch((error) => {
        console.error('Error getting status:', error);
        sendResponse({ isRotating: false });
      });
  }
  return true; // Keep message channel open for async response
});

// Listen for alarm to rotate tabs
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await rotateToNextTab();
    
    // For short intervals (< 60 seconds), we need to recreate the single-fire alarm
    const state = await chrome.storage.local.get(['interval', 'isRotating']);
    if (state.isRotating && state.interval < 60) {
      await createAlarmForInterval(state.interval);
    }
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

  // Get all tabs and find the current active tab index
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  const activeTab = allTabs.find(tab => tab.active);
  const currentTabIndex = activeTab ? allTabs.indexOf(activeTab) : 0;

  // Save rotation state
  await chrome.storage.local.set({
    isRotating: true,
    interval: interval,
    currentTabIndex: currentTabIndex
  });

  // Create an alarm for the next rotation
  await createAlarmForInterval(interval);
}

// Helper function to create an alarm based on interval duration
async function createAlarmForInterval(interval) {
  // Chrome alarms have a minimum period of 1 minute, so for shorter intervals
  // we use delayInMinutes to create single-fire alarms that we recreate after each fire
  if (interval < 60) {
    // For intervals less than 60 seconds, use a single-fire alarm
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: interval / 60
    });
  } else {
    // For intervals >= 60 seconds, use a periodic alarm
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: interval / 60
    });
  }
}

async function rotateToNextTab() {
  try {
    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });

    if (tabs.length === 0) {
      await stopRotation();
      return;
    }

    // Get current state
    const state = await chrome.storage.local.get(['currentTabIndex', 'isRotating']);
    
    if (!state.isRotating) {
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
