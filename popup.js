const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const intervalInput = document.getElementById('interval');
const statusDiv = document.getElementById('status');

// Load saved interval from storage
chrome.storage.local.get(['interval'], (result) => {
  if (result.interval) {
    intervalInput.value = result.interval;
  }
});

// Check current rotation status from storage (more reliable than message for initial state)
chrome.storage.local.get(['isRotating'], (result) => {
  if (result.isRotating) {
    updateUIState(true);
  } else {
    updateUIState(false);
  }
});

startBtn.addEventListener('click', () => {
  const interval = parseInt(intervalInput.value);

  if (isNaN(interval) || interval < 1) {
    alert('Please enter a valid interval (minimum 1 second)');
    return;
  }

  // Save interval to storage
  chrome.storage.local.set({ interval: interval });

  // Send message to background script to start rotation
  chrome.runtime.sendMessage(
    { action: 'start', interval: interval },
    (response) => {
      if (response && response.status === 'started') {
        updateUIState(true);
      }
    }
  );
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
    if (response && response.status === 'stopped') {
      updateUIState(false);
    }
  });
});

function updateUIState(isRotating) {
  if (isRotating) {
    statusDiv.textContent = 'Running';
    statusDiv.classList.add('running');
    statusDiv.classList.remove('stopped');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intervalInput.disabled = true;
  } else {
    statusDiv.textContent = 'Stopped';
    statusDiv.classList.add('stopped');
    statusDiv.classList.remove('running');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    intervalInput.disabled = false;
  }
}
