document.addEventListener("DOMContentLoaded", function () {
  const textSelectionToggle = document.getElementById("textSelectionToggle");
  const areaScreenshotToggle = document.getElementById("areaScreenshotToggle");
  const responseModeToggle = document.getElementById("responseModeToggle");
  const screenshotButton = document.getElementById("screenshotButton");
  const standardLabel = document.getElementById("standardLabel");
  const eli5Label = document.getElementById("eli5Label");

  // Load saved states
  chrome.storage.sync.get(
    ["textSelectionEnabled", "areaScreenshotEnabled", "responseMode"],
    function (result) {
      textSelectionToggle.checked = result.textSelectionEnabled ?? true;
      areaScreenshotToggle.checked = result.areaScreenshotEnabled ?? true;
      responseModeToggle.checked = result.responseMode === "eli5";
      updateResponseModeLabels(responseModeToggle.checked);
    }
  );

  // Response Mode Toggle
  responseModeToggle.addEventListener("change", function () {
    const isEli5Mode = this.checked;
    const mode = isEli5Mode ? "eli5" : "standard";
    chrome.storage.sync.set({ responseMode: mode });

    // console.log("Response mode changed in popup");

    updateResponseModeLabels(isEli5Mode);

    // Notify content scripts about the change
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "responseModeChanged",
        mode: mode,
      });
    });
  });

  //Update the Response Mode toggle in the popup
  function updateResponseModeLabels(isEli5Mode) {
    if (isEli5Mode) {
      eli5Label.classList.add("active");
      standardLabel.classList.remove("active");
    } else {
      standardLabel.classList.add("active");
      eli5Label.classList.remove("active");
    }
  }

  // If textSelectionToggle is changed
  textSelectionToggle.addEventListener("change", function () {
    const isEnabled = this.checked;

    // console.log("textSelectionToggle changed in popup");

    chrome.storage.sync.set({ textSelectionEnabled: isEnabled });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleTextSelection",
        enabled: isEnabled,
      });
    });
  });

  // If areaScreenshotToggle is changed
  areaScreenshotToggle.addEventListener("change", function () {
    const isAreaScreenShotEnabled = this.checked;
    chrome.storage.sync.set({ areaScreenshotEnabled: isAreaScreenShotEnabled });

    // console.log("areaScreenshotToggle changed in popup");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleAreaScreenshot",
        enabled: isAreaScreenShotEnabled,
      });
    });
  });

  screenshotButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "initiateScreenshot",
      });
    });
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "updateTextSelectionToggle") {
    document.getElementById("textSelectionToggle").checked = message.enabled;
    chrome.storage.sync.set({ textSelectionEnabled: message.enabled });
  } else if (message.action === "updateAreaScreenshotToggle") {
    document.getElementById("areaScreenshotToggle").checked = message.enabled;
    chrome.storage.sync.set({ areaScreenshotEnabled: message.enabled });
  } else if (message.action === "updateResponseMode") {
    const responseModeToggle = document.getElementById("responseModeToggle");
    responseModeToggle.checked = message.mode === "eli5";
    updateResponseModeLabels(responseModeToggle.checked);
    chrome.storage.sync.set({ responseMode: message.mode });
  }
});
