// import { responseText } from "../geminiAPICall.js";
// import { responseReceivedFromAPI } from "../geminiAPICall.js";

let selectedText = "nothing yet";
let textInPopup = "nothing yet";
let popupOpen = false;
let toggle = false;

document.addEventListener("mouseup", () => {
  let selection = window.getSelection();
  selectedText = selection.toString();
  if (selectedText && isEli5Enabled) {
    console.log(selectedText);
    sendSelectedTextToBackground(selectedText);
  }
});

/// Toggle state management
let isEli5Enabled = false;
let lastKeyPressed = null;
const TOGGLE_TIMEOUT = 500; // ms to wait for the next key

document.addEventListener("keydown", (event) => {
  const currentTime = Date.now();

  if (
    lastKeyPressed?.key === "e" &&
    event.key === "5" &&
    currentTime - lastKeyPressed.time < TOGGLE_TIMEOUT
  ) {
    // Toggle state
    console.log("pressed");
    isEli5Enabled = !isEli5Enabled;
    showToggleMessage(`Eli5 ${isEli5Enabled ? "Enabled" : "Disabled"}`);
    // testpopup();
    lastKeyPressed = null;
  } else {
    lastKeyPressed = {
      key: event.key,
      time: currentTime,
    };
  }
});

function showToggleMessage(message) {
  console.log("showToggleMessage called", message);

  // Add styles if not already present
  if (!document.querySelector("#toggle-message-styles")) {
    const style = document.createElement("style");
    style.id = "toggle-message-styles";
    style.classList.add("toggle-message");
    document.head.appendChild(style);
  }

  const toggleMessage = document.createElement("div");
  toggleMessage.id = "toggle-message";
  toggleMessage.textContent = message;
  toggleMessage.classList.add("toggle-message");

  document.body.appendChild(toggleMessage);

  // Trigger entrance animation
  setTimeout(() => {
    toggleMessage.classList.add("show");
  }, 10);

  // Trigger exit animation
  setTimeout(() => {
    toggleMessage.classList.add("hide");
  }, 2700);

  // Remove element after animation completes
  setTimeout(() => {
    toggleMessage?.remove();
  }, 4000);
}
document.addEventListener("click", () => {
  // console.log("click event happened");
  if (popupOpen) {
    popup.remove();
    popupOpen = false;
  }
});

function sendSelectedTextToBackground(incomingText) {
  try {
    chrome.runtime.sendMessage(
      { action: "textSelected", text: incomingText },
      function (response) {
        console.log(
          "this is response.sendResponseBackToContentScript => ",
          response.sendResponseBackToContentScript
        );

        textInPopup = response.sendResponseBackToContentScript;

        if (response.responseReceived) {
          console.log("responseReceived is true");
          showPopup();
          popupOpen = true;
        }
      }
    );
  } catch (error) {
    console.log("this is the error caught in sendMessage => ", error);
  }
}

let popup;

function showPopup() {
  //let popup = document.getElementById('selection-popup');
  let crossButton = document.createElement("button");
  crossButton.id = "cross-button";
  crossButton.addEventListener("click", () => {
    popup.remove();
  });
  crossButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background-color: transparent;
      border: none;
      color:rgba(255, 0, 0, 0.94);
      font-size: 20px;
      cursor: pointer;
    `;
  crossButton.textContent = "X";

  if (!popupOpen) {
    popup = document.createElement("div");
    popup.id = "selection-popup";
    // popup.className = 'popup-style';
    popup.classList.add("explanation-popup");

    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "custom-scrollbar"; // Add a class for targeting

    scrollableContainer.style.cssText = `
      max-height: 400px;  /* Set the desired height for the scrollable area */
      overflow: auto;     /* Enable scrolling */
      margin-top: 10px;   /* Optional: Add some margin at the top */
      `;

    const style = document.createElement("style");
    style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `;

    document.head.appendChild(style);

    popup.appendChild(scrollableContainer);
    // popup.appendChild(crossButton);
    document.body.appendChild(popup);

    let messageReceived = false;

    scrollableContainer.textContent = `${textInPopup}`;
  }
}

// ... existing code ...

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated");
    }

    console.log("Message received in content.js:", message);

    if (message.action === "imageExplanationResponseReceived") {
      textInPopup = message.text;
      showPopup();
      popupOpen = true;
      sendResponse({ received: true });
    }
  } catch (error) {
    console.error("Message handling error:", error);
    // Reload the page or show an error message to the user
    alert(
      "The extension needs to be reloaded. Please refresh the page and try again."
    );
  }
  return true;
});
