const ALARM_NAME = 'tab-rotation-alarm';

// Initialize state from storage on startup
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['isRotating', 'interval']);
  if (data.isRotating && data.interval) {
    startRotation(data.interval);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    startRotation(request.interval);
    sendResponse({ status: 'started' });
  } else if (request.action === 'stop') {
    stopRotation();
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'getStatus') {
    // Check storage for the source of truth
    chrome.storage.local.get(['isRotating'], (data) => {
      sendResponse({ isRotating: !!data.isRotating });
    });
    return true; // Keep channel open for async response
  }
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    rotateToNextTab();
  }
});

async function startRotation(interval) {
  // Save state
  await chrome.storage.local.set({ isRotating: true, interval: interval });

  // Create alarm
  // Note: In strict mode (unpacked extension), alarms can fire more often than 1 minute.
  // For production, the minimum is 1 minute unless using 'when' for one-off.
  // However, for this use case, we want a repeating interval.
  // Chrome limits repeating alarms to 1 minute minimum in released extensions.
  // For development/unpacked, it allows shorter.
  // If the user wants < 1 minute, we might need a different approach or accept the limitation.
  // Given the "half an hour" comment, long running is the goal.
  
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: interval / 60
  });
}

async function rotateToNextTab() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    if (tabs.length === 0) {
      stopRotation();
      return;
    }

    // Find current active tab
    const activeTab = tabs.find(tab => tab.active);
    let nextIndex = 0;

    if (activeTab) {
      const currentIndex = tabs.indexOf(activeTab);
      nextIndex = (currentIndex + 1) % tabs.length;
    }

    // Activate the next tab
    await chrome.tabs.update(tabs[nextIndex].id, { active: true });
  } catch (error) {
    console.error('Error rotating tabs:', error);
  }
}

function stopRotation() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.set({ isRotating: false });
}
