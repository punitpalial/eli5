let selectedText = "nothing";
let textInPopup = "Loading...";
let popup;
let popupOpen = false;
let toggle = false;
let intputText = "nothing";
let responseMode = "eli5"; // Add this line to track response mode
let isEli5Enabled = false;
let isAreaScreenShotEnabled = false;
let lastKeyPressed = null;
let previousEli5ToggleState = isEli5Enabled;

// Load saved states when content script initializes
chrome.storage.sync.get(
  ["textSelectionEnabled", "responseMode", "areaScreenshotEnabled"],
  function (result) {
    isTextSelectionEnabled = result.textSelectionEnabled ?? true; // if result.textSelectionEnabled is undefined or null, then its value will be true. Else it will store whatever value it has
    responseMode = result.responseMode ?? "eli5";
    isEli5Enabled = isTextSelectionEnabled;
    isAreaScreenShotEnabled = result.areaScreenshotEnabled;
  }
);

// If the storage changes, show the
chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(
    ["textSelectionEnabled", "areaScreenshotEnabled"],
    function (result) {
      if (result.textSelectionEnabled != isEli5Enabled) {
        isEli5Enabled = result.textSelectionEnabled;
        showToggleMessage(`Eli5 ${isEli5Enabled ? "Enabled" : "Disabled"}`);
      }

      if (result.areaScreenshotEnabled != isAreaScreenShotEnabled) {
        isAreaScreenShotEnabled = result.areaScreenshotEnabled;
        showToggleMessage(
          `Area Screenshot ${isAreaScreenShotEnabled ? "Enabled" : "Disabled"}`
        );
      }
    }
  );
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleTextSelection") {
    isTextSelectionEnabled = message.enabled;
  } else if (message.action === "toggleResponseMode") {
    responseMode = message.mode;
  }
});

// Modify your sendSelectedTextToBackground function to include response mode
function sendSelectedTextToBackground(incomingText) {
  try {
    chrome.runtime.sendMessage(
      {
        action: "textSelected",
        text: incomingText,
        mode: responseMode, // Add this line to send mode
      },
      function (response) {
        textInPopup = response.sendResponseBackToContentScript;

        if (response.responseReceived) {
          addGeminiResponseToChat(textInPopup, false);
          popupOpen = true;
        }
      }
    );
  } catch (error) {
    console.log("Error in sendMessage:", error);
  }
}

/// Toggle state management

const TOGGLE_TIMEOUT = 500; // ms to wait for the next key

// Listen for keydown events to toggle state
document.addEventListener("keydown", (event) => {
  const currentTime = Date.now();

  if (
    lastKeyPressed?.key === "e" &&
    event.key === "5" &&
    currentTime - lastKeyPressed.time < TOGGLE_TIMEOUT
  ) {
    // Toggle state
    chrome.runtime.sendMessage({
      action: "updateTextSelectionToggle",
    });

    isEli5Enabled = !isEli5Enabled;

    showToggleMessage(`Eli5 ${isEli5Enabled ? "Enabled" : "Disabled"}`);

    chrome.storage.sync.set({ textSelectionEnabled: isEli5Enabled });

    lastKeyPressed = null;
  } else {
    lastKeyPressed = {
      key: event.key,
      time: currentTime,
    };
  }
});

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // tabs[0] contains information about the active tab
    const currentUrl = tabs[0].url;
  });
});

// Show a message when the toggle state changes
function showToggleMessage(message) {
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
  }, 5000);
}

// Mouseup event listener to get selected text
document.addEventListener("mouseup", () => {
  // Regular webpage selection
  selection = window.getSelection();
  selectedText = selection.toString().trim();

  console.log("selectedText: ", selectedText);
  console.log("isEli5enabled: ", isEli5Enabled);
  console.log("popup open: ", popupOpen);

  if (selectedText && isEli5Enabled) {
    console.log("textselected & eli5enabled");

    if (!popupOpen) {
      showPopup();
    }

    addUserMessageToChat(selectedText, true, null);
    addGeminiResponseToChat("Loading the explanation", false);
    sendSelectedTextToBackground(selectedText);
  }
});

function createMessage(message, isUser = false, dataUrl) {
  const newMessageDiv = document.createElement("div");
  newMessageDiv.className = isUser ? "chat-message-user" : "chat-message-ai"; // finding the element which last used the 'chat-message-ai' class

  // Format the message if it's from AI
  if (!isUser && message) {
    // First handle bold text with proper HTML tags
    message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle bullet points
    message = message.replace(/^\* /gm, "• ");

    // Convert markdown to HTML paragraphs
    const paragraphs = message.split(/\n\n+/);
    const formattedParagraphs = paragraphs.map((p) => {
      // If paragraph starts with a bullet point, wrap in list
      if (p.trim().startsWith("•")) {
        const listItems = p
          .split("\n")
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");
        return `<ul>${listItems}</ul>`;
      }
      // Regular paragraph
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    });

    newMessageDiv.innerHTML = formattedParagraphs.join("");
  } else {
    newMessageDiv.textContent = message;
  }

  if (dataUrl != null) {
    const main = document.createElement("div");
    main.className = "chat-message-user-screenshot";
    const img = document.createElement("img");
    img.src = dataUrl;
    img.className = "chat-message-user-screenshot-img";
    main.appendChild(img);
    newMessageDiv.appendChild(main);
  }

  return newMessageDiv;
}

// Add function to add new messages
function addUserMessageToChat(message, isUser = false, dataUrl) {
  if (!popupOpen) return;

  const chatContainer = popup.querySelector(".chat-container");
  if (!chatContainer) return;

  let userMessage;

  if (message === "Image captured") userMessage = null;
  else userMessage = message;

  const messageDiv = createMessage(userMessage, isUser, dataUrl);

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addGeminiResponseToChat(message) {
  if (!popupOpen || !popup) return;

  const chatContainer = popup.querySelector(".chat-container");
  if (!chatContainer) return;

  try {
    // Find the last AI message in the chat container
    const lastAiMessage = chatContainer.querySelector(
      ".chat-message-ai:last-of-type"
    );

    if (lastAiMessage) {
      // If there's an existing AI message, update its content
      lastAiMessage.textContent = message;
    } else {
      // If no AI message exists, create a new one
      const messageDiv = createMessage("Loading......", false, null);
      chatContainer.appendChild(messageDiv);
    }
  } catch (error) {
    // If no AI message exists, create a new one
    const messageDiv = createMessage(message, false, null);
    chatContainer.appendChild(messageDiv);
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send selected text to background script
function sendSelectedTextToBackground(incomingText) {
  try {
    if (!popup) {
      showPopup();
    }

    chrome.runtime.sendMessage(
      { action: "textSelected", text: incomingText },
      function (response) {
        if (!popup) {
          popupOpen = false;
          return;
        }

        textInPopup = response.sendResponseBackToContentScript;

        if (response.responseReceived) {
          addGeminiResponseToChat(textInPopup, false);
          popupOpen = true;
        }
      }
    );
  } catch (error) {
    console.log("this is the error caught in sendMessage => ", error);
    if (popup) {
      addGeminiResponseToChat(
        "Error processing request. Please try again.",
        false
      );
    }
  }
}

// Show popup with selected text and AI explanation
function showPopup() {
  const existingPopup = document.getElementById("selection-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  if (popupOpen) {
    addUserMessageToChat(selectedText, true, null);
    addGeminiResponseToChat("Loading the explanation", false);
  }

  popup = document.createElement("div");
  popup.id = "selection-popup";
  popup.classList.add("explanation-popup");
  popupOpen = true;

  // Create header
  const header = document.createElement("div");
  header.className = "header";

  // Create title
  const title = document.createElement("span");
  title.textContent = "ELi5";

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  // Update the close button HTML to be more precise
  closeButton.innerHTML = `
<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.5 1.5L12.5 12.5M1.5 12.5L12.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`;
  closeButton.addEventListener("click", () => {
    popup.remove();
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    popup = null;
    popupOpen = false;
    textInPopup = "Loading...";
  });

  // Append elements to header
  header.appendChild(title);
  header.appendChild(closeButton);
  popup.appendChild(header);

  // Create chat container
  const chatContainer = document.createElement("div");
  chatContainer.className = "chat-container";

  // Add initial messages
  const userMessage = document.createElement("div");
  userMessage.className = "chat-message-user";

  // Add AI message
  const aiMessage = document.createElement("div");
  aiMessage.className = "chat-message-ai";

  popup.appendChild(chatContainer);

  // Create input container
  const inputContainer = document.createElement("div");
  inputContainer.className = "input-container";

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "input-wrapper";

  const textarea = document.createElement("textarea");
  textarea.className = "chat-input";
  textarea.placeholder = "Ask a follow-up question...";
  textarea.rows = 1;
  textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 200) + "px";
  });

  // Create send button
  const sendButton = document.createElement("button");
  sendButton.className = "send-button";
  sendButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  `;

  // Add event listeners for sending messages
  const sendMessage = () => {
    const question = textarea.value.trim();
    if (question) {
      handleNewQuestion(question);
      textarea.value = "";
      textarea.style.height = "auto";
    }
  };

  // Add event listeners for sending messages
  sendButton.addEventListener("click", sendMessage);
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Append elements to input container
  inputWrapper.appendChild(textarea);
  inputWrapper.appendChild(sendButton);
  inputContainer.appendChild(inputWrapper);
  popup.appendChild(inputContainer);

  // Focus input
  textarea.focus();

  // Add popup to page
  document.body.appendChild(popup);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated");
    }

    if (message.action === "imageExplanationResponseReceived") {
      textInPopup = message.text;
      addGeminiResponseToChat(textInPopup, false);
      responseReceived = true;
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

// Update handleNewQuestion to use the new classes
function handleNewQuestion(question) {
  if (!question.trim()) return;

  const userMessage = document.createElement("div");
  userMessage.className = "chat-message-user";
  userMessage.textContent = question;

  const chatContainer = document.querySelector(".chat-container");
  chatContainer.appendChild(userMessage);

  // Clear textarea and show loading
  const textarea = document.querySelector(".chat-input");
  textarea.value = "";
  textarea.style.height = "auto";
  addGeminiResponseToChat("Loading the explanation", false);

  // Send question to background script
  chrome.runtime.sendMessage(
    {
      action: "getExplanationOfInputText",
      text: question,
      question: question, // Add this line to match what's used in background script
    },
    function (response) {
      try {
        if (!chrome.runtime?.id) {
          throw new Error("Extension context invalidated");
        }

        if (!response) {
          throw new Error("No response received");
        }

        if (response.error) {
          console.error("Error from background script:", response.error);
          addGeminiResponseToChat(
            "Sorry, there was an error processing your request.",
            false
          );
          return;
        }

        textInPopup = response.modelResponse;
        addGeminiResponseToChat(textInPopup, false);
      } catch (error) {
        console.error("Error handling response:", error);
        addGeminiResponseToChat(
          "Sorry, something went wrong. Please try again.",
          false
        );
      }
    }
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "areaCaptured") {
    if (!popupOpen) {
      showPopup();

      popupOpen = true;
    }

    addUserMessageToChat("Image captured", true, message.dataUrl);
    addGeminiResponseToChat("Loading the explanation", false);

    sendResponse({ received: true });
  }
  return true;
});
