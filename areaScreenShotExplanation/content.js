let isSelecting = false;
let selectionDiv;
let startSelection = false;
// let responseMode = 'eli5'; // Add this line to track response mode
let isAreaScreenshotEnabled = true;

// Load saved states when content script initializes
chrome.storage.sync.get(
  ["areaScreenshotEnabled", "responseMode"],
  function (result) {
    isAreaScreenshotEnabled = result.areaScreenshotEnabled ?? true;
    responseMode = result.responseMode ?? "eli5";
  }
);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAreaScreenshot") {
    isAreaScreenshotEnabled = message.enabled;
  } else if (message.action === "toggleResponseMode") {
    responseMode = message.mode;
  } else if (
    message.action === "initiateScreenshot" &&
    isAreaScreenshotEnabled
  ) {
    startSelection = true;
  }
});

// Modify your existing screenshot handling code to include response mode
document.addEventListener("mouseup", async (e) => {
  if (!isSelecting || !startSelection || !isAreaScreenshotEnabled) return;
  isSelecting = false;

  // ... your existing screenshot capture code ...

  chrome.runtime.sendMessage(
    {
      action: "fetchExplanation",
      dataUrl: dataUrl,
      mode: responseMode, // Add this line to send mode
    },
    (response) => {
      console.log("Screenshot explanation:", response);
    }
  );
});

// ... rest of your existing code ...

document.addEventListener("keydown", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = true;
  }
});

document.addEventListener("keyup", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = false;
  }
});

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !startSelection) return;

  isSelecting = true;

  // Get the exact pixel position
  startX = Math.round(e.pageX);
  startY = Math.round(e.pageY);

  console.log("startX:", startX, "startY:", startY);

  selectionDiv = document.createElement("div");
  selectionDiv.style.position = "absolute";
  selectionDiv.style.border = "2px dashed transparent";
  selectionDiv.style.backgroundImage =
    "linear-gradient(90deg, #6600ff #800080)";
  selectionDiv.style.backgroundClip = "padding-box";
  selectionDiv.style.borderRadius = "4px";
  selectionDiv.style.boxShadow = `
    0 0 0 2px transparent,
    0 0 8px 2px rgba(255, 0, 0, 0.3),
    0 0 8px 2px rgba(128, 0, 128, 0.3)
  `;
  selectionDiv.style.background = `
    linear-gradient(90deg, #6600ff, #800080) border-box,
    linear-gradient(90deg, transparent, transparent) padding-box
  `;
  selectionDiv.style.WebkitMask =
    "linear-gradient(black 0 0) padding-box, linear-gradient(black 0 0)";
  selectionDiv.style.WebkitMaskComposite = "xor";
  selectionDiv.style.zIndex = "9999";
  // Add 2px offset to account for border width
  selectionDiv.style.left = `${startX - 2}px`;
  selectionDiv.style.top = `${startY - 2}px`;
  document.body.appendChild(selectionDiv);
});

document.addEventListener("mousemove", (e) => {
  if (!isSelecting || !startSelection) return;

  // Get the exact pixel position
  endX = Math.round(e.pageX);
  endY = Math.round(e.pageY);

  // Calculate dimensions including border
  let width = Math.abs(endX - startX);
  let height = Math.abs(endY - startY);

  // Update selection div position and size, accounting for border
  selectionDiv.style.width = `${width}px`;
  selectionDiv.style.height = `${height}px`;
  selectionDiv.style.left = `${Math.min(startX, endX) - 2}px`;
  selectionDiv.style.top = `${Math.min(startY, endY) - 2}px`;
});

function fadeOutAndRemove(element, duration) {
  let opacity = 1; // Initial opacity
  const interval = 50; // Interval in milliseconds
  const decrement = interval / duration; // Amount to decrease opacity per interval

  const fade = setInterval(() => {
    opacity -= decrement; // Reduce opacity
    if (opacity <= 0) {
      opacity = 0;
      clearInterval(fade); // Stop the interval
      element.remove(); // Hide the element (optional)
    } else {
      element.style.opacity = opacity; // Update element opacity
    }
  }, interval);
}

document.addEventListener("mouseup", async (e) => {
  if (!isSelecting || !startSelection) return;
  isSelecting = false;

  console.log("endX:", endX, "endY:", endY);

  // Get the final dimensions including border adjustment
  let finalDimensions = {
    x: Math.min(startX, endX) - 2, // Adjust for border
    y: Math.min(startY, endY) - 2,
    width: Math.abs(endX - startX), // Add border width
    height: Math.abs(endY - startY),
  };

  if (selectionDiv) {
    // Store the computed styles before removing
    let computedStyle = window.getComputedStyle(selectionDiv);
    let actualLeft = parseInt(computedStyle.left);
    let actualTop = parseInt(computedStyle.top);
    let actualWidth = parseInt(computedStyle.width);
    let actualHeight = parseInt(computedStyle.height);

    // Update dimensions based on actual computed values
    finalDimensions.x = actualLeft;
    finalDimensions.y = actualTop;
    finalDimensions.width = actualWidth + 10;
    finalDimensions.height = actualHeight + 10;

    fadeOutAndRemove(selectionDiv, 500);
    selectionDiv = null;
  }

  if (finalDimensions.width > 0 && finalDimensions.height > 0) {
    console.log("Selection dimensions:", finalDimensions);

    chrome.runtime.sendMessage(
      {
        action: "captureVisibleTab",
      },
      (dataUrl) => {
        console.log("Tab Captured:", dataUrl);

        chrome.runtime.sendMessage(
          {
            action: "fetchExplanation",
            dataUrl: dataUrl,
          },
          (response) => {
            console.log("response:", response);
          }
        );

        if (!dataUrl) {
          console.error("Failed to capture tab.");
          return;
        }
      }
    );
  }
});
