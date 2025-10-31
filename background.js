let rotationInterval = null;
let currentTabIndex = 0;
let isRotating = false;
let allTabs = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    startRotation(request.interval);
    sendResponse({ status: 'started' });
  } else if (request.action === 'stop') {
    stopRotation();
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'getStatus') {
    sendResponse({ isRotating: isRotating });
  }
  return true;
});

async function startRotation(interval) {
  if (isRotating) {
    stopRotation();
  }

  isRotating = true;

  // Get all tabs in the current window
  const tabs = await chrome.tabs.query({ currentWindow: true });
  allTabs = tabs;

  if (allTabs.length === 0) {
    stopRotation();
    return;
  }

  // Find the current active tab index
  const activeTab = allTabs.find(tab => tab.active);
  currentTabIndex = activeTab ? allTabs.indexOf(activeTab) : 0;

  // Start the rotation
  rotationInterval = setInterval(async () => {
    await rotateToNextTab();
  }, interval * 1000);
}

async function rotateToNextTab() {
  try {
    // Refresh the tab list to account for any closed tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    allTabs = tabs;

    if (allTabs.length === 0) {
      stopRotation();
      return;
    }

    // Move to the next tab (wrap around to 0 if at the end)
    currentTabIndex = (currentTabIndex + 1) % allTabs.length;

    // Activate the next tab
    await chrome.tabs.update(allTabs[currentTabIndex].id, { active: true });
  } catch (error) {
    console.error('Error rotating tabs:', error);
    // If there's an error (e.g., tab was closed), reset and try again
    currentTabIndex = 0;
  }
}

function stopRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
  isRotating = false;
  currentTabIndex = 0;
  allTabs = [];
}

// Stop rotation when the extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  stopRotation();
});
