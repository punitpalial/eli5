let isSelecting = false;
let purpleSelectionBox = null;
let endX = 0;
let endY = 0;
let startX = 0;
let startY = 0;
let intiateScreenshot = false;
let isAreaScreenshotEnabled = true;
let transparentDiv = document.createElement("div");

// Load saved states when content script initializes
chrome.storage.sync.get(
  ["areaScreenshotEnabled", "responseMode"],
  function (result) {
    isAreaScreenshotEnabled = result.areaScreenshotEnabled ?? true;
    responseMode = result.responseMode ?? "eli5";

    console.log("responseMode is: ", responseMode);
    console.log("isAreaScreenshotEnabled: ", isAreaScreenshotEnabled);
  }
);

chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(
    ["areaScreenshotEnabled", "responseMode"],
    function (result) {
      isAreaScreenshotEnabled = result.areaScreenshotEnabled ?? true;
      responseMode = result.responseMode ?? "eli5";

      console.log("responseMode is: ", responseMode);
      console.log("isAreaScreenshotEnabled: ", isAreaScreenshotEnabled);
    }
  );
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAreaScreenshot") {
    isAreaScreenshotEnabled = message.enabled;
  } else if (message.action === "toggleResponseMode") {
    console.log("sajjan razi ho javi fir vi");
    responseMode = message.mode;
  } else if (message.action === "initiateScreenshot") {
    console.log("received the message from popup.js veere");

    intiateScreenshot = true;
    console.log("from listener => initiate screenshot: ", intiateScreenshot);
    changeCursor(true);

    isSelecting = true;
  }
});

// Add window blur event listener to reset selection state when window loses focus
window.addEventListener("blur", () => {
  isSelecting = false;
  document.body.style.cursor = "default";
  if (purpleSelectionBox) {
    purpleSelectionBox.remove();
    purpleSelectionBox = null;
  }
});

function changeCursor(change) {
  console.log("initiate screenshot: ", intiateScreenshot);

  if (change === true) {
    console.log("Changing Cursor");
    document.body.style.cursor = "crosshair";

    console.log("ADDING THE PURPLE DIV");

    // transparentDiv.style.backgroundColor = "gray"; // Background color instead of text color
    transparentDiv.style.zIndex = "9999"; // Fixed zIndex property
    transparentDiv.style.height = "100%"; // Added units
    transparentDiv.style.width = "100%"; // Added units
    transparentDiv.style.position = "absolute"; // Valid position value
    transparentDiv.style.top = "0"; // Center vertically
    transparentDiv.style.left = "0"; // Center horizontally
    // transparentDiv.style.transform = "translate(-50%, -50%)"; // Proper centering
    document.body.appendChild(transparentDiv);
  } else {
    console.log("BHAI KUCH TOH RESPOND KARDE");
  }
}

document.addEventListener("keydown", (keyPressed) => {
  if (keyPressed.key === "Alt" && isAreaScreenshotEnabled) {
    document.body.style.cursor = "crosshair";
    isSelecting = true;
  }
});

document.addEventListener("keyup", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    document.body.style.cursor = "default";

    //Reset screenshot related state
    isSelecting = false;

    // Remove selection div if it exists
    if (purpleSelectionBox) {
      purpleSelectionBox.remove();
      purpleSelectionBox = null;
    }
  }
});

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !isSelecting || !isAreaScreenshotEnabled) {
    if (!intiateScreenshot) return;
  }
  isSelecting = true;

  // Get the exact pixel position
  startX = Math.round(e.pageX);
  startY = Math.round(e.pageY);

  console.log("startX:", startX, "startY:", startY);

  purpleSelectionBox = document.createElement("div");
  purpleSelectionBox.style.position = "absolute";
  purpleSelectionBox.style.border = "2px dashed transparent";
  purpleSelectionBox.style.backgroundImage =
    "linear-gradient(90deg, #6600ff #800080)";
  purpleSelectionBox.style.backgroundClip = "padding-box";
  purpleSelectionBox.style.borderRadius = "4px";
  purpleSelectionBox.style.boxShadow = `
    0 0 0 2px transparent,
    0 0 8px 2px rgba(255, 0, 0, 0.3),
    0 0 8px 2px rgba(128, 0, 128, 0.3)
  `;
  purpleSelectionBox.style.background = `
    linear-gradient(90deg, #6600ff, #800080) border-box,
    linear-gradient(90deg, transparent, transparent) padding-box
  `;
  purpleSelectionBox.style.WebkitMask =
    "linear-gradient(black 0 0) padding-box, linear-gradient(black 0 0)";
  purpleSelectionBox.style.WebkitMaskComposite = "xor";
  purpleSelectionBox.style.zIndex = "9999";
  // Add 2px offset to account for border width
  purpleSelectionBox.style.left = `${startX - 2}px`;
  purpleSelectionBox.style.top = `${startY - 2}px`;
  document.body.appendChild(purpleSelectionBox);
});

document.addEventListener("mousemove", (e) => {
  if (!isSelecting || !isAreaScreenshotEnabled) {
    return;
  }

  // Get the exact pixel position
  endX = Math.round(e.pageX);
  endY = Math.round(e.pageY);

  // Calculate dimensions including border
  let width = Math.abs(endX - startX);
  let height = Math.abs(endY - startY);

  // Update selection div position and size, accounting for border

  if (purpleSelectionBox != null) {
    purpleSelectionBox.style.width = `${width}px`;
    purpleSelectionBox.style.height = `${height}px`;
    purpleSelectionBox.style.left = `${Math.min(startX, endX) - 2}px`;
    purpleSelectionBox.style.top = `${Math.min(startY, endY) - 2}px`;
  }
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
  if (!isSelecting || !isAreaScreenshotEnabled) {
    if (!intiateScreenshot) return;
  }

  document.body.style.cursor = "default";

  if (intiateScreenshot) {
    intiateScreenshot = false;
    document.body.removeChild(transparentDiv);
  }

  console.log("Mouseup => Initiate Screenshot", intiateScreenshot);

  isSelecting = false;

  console.log("endX:", endX, "endY:", endY);

  // Get the final dimensions including border adjustment
  let finalDimensions = {
    x: Math.min(startX, endX) - 2, // Adjust for border
    y: Math.min(startY, endY) - 2,
    width: Math.abs(endX - startX), // Add border width
    height: Math.abs(endY - startY),
  };

  if (purpleSelectionBox) {
    // Store the computed styles before removing
    let computedStyle = window.getComputedStyle(purpleSelectionBox);
    let actualLeft = parseInt(computedStyle.left);
    let actualTop = parseInt(computedStyle.top);
    let actualWidth = parseInt(computedStyle.width);
    let actualHeight = parseInt(computedStyle.height);

    // Update dimensions based on actual computed values
    finalDimensions.x = actualLeft;
    finalDimensions.y = actualTop;
    finalDimensions.width = actualWidth + 10;
    finalDimensions.height = actualHeight + 10;

    fadeOutAndRemove(purpleSelectionBox, 500);
    purpleSelectionBox = null;
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
            mode: responseMode,
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
