let selectedText = "nothing";
let textInPopup = "Loading...";
let popupOpen = false;
let toggle = false;
let intputText = "nothing";
let conversation = [];

/// Toggle state management
let isEli5Enabled = false;
let lastKeyPressed = null;
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

// Show a message when the toggle state changes
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
  }, 5000);
}

// Mouseup event listener to get selected text
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    let selection = window.getSelection();
    selectedText = selection.toString();
    if (selectedText && isEli5Enabled) {
      console.log(selectedText);

      window.getSelection().removeAllRanges();
      if (!popupOpen) {
        showPopup();
      }
      addUserMessageToChat(selectedText, true);
      addGeminiResponseToChat("Loading the explanation", false);

      sendSelectedTextToBackground(selectedText);
    }
  }, 100);
});

function createMessage(message, isUser = false) {
  const newMessageDiv = document.createElement("div");
  newMessageDiv.className = isUser ? "chat-message-user" : "chat-message-ai"; // finding the element which last used the 'chat-message-ai' class
  newMessageDiv.textContent = message;
  return newMessageDiv;
}

// Add function to add new messages
function addUserMessageToChat(message, isUser = false) {
  if (!popupOpen) return;

  const chatContainer = popup.querySelector(".chat-container");
  if (!chatContainer) return;

  const messageDiv = createMessage(message, isUser);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addGeminiResponseToChat(message) {
  if (!popupOpen) return;

  const chatContainer = popup.querySelector(".chat-container");
  if (!chatContainer) return;

  // Find the last AI message in the chat container
  const lastAiMessage = chatContainer.querySelector(
    ".chat-message-ai:last-of-type"
  );

  if (lastAiMessage) {
    // If there's an existing AI message, update its content
    lastAiMessage.textContent = message;
  } else {
    // If no AI message exists, create a new one
    const messageDiv = createMessage("Loading......", false);
    chatContainer.appendChild(messageDiv);
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send selected text to background script
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
          addGeminiResponseToChat(textInPopup, false);
          popupOpen = true;
        }
      }
    );
  } catch (error) {
    console.log("this is the error caught in sendMessage => ", error);
  }
}

let popup;

// Show popup with selected text and AI explanation
function showPopup() {
  if (popupOpen) {
    addUserMessageToChat(selectedText, true);
    addGeminiResponseToChat("Loading the explanation", false);
  }

  console.log("popupOpen is false so creating a new popup");

  popupOpen = true;

  popup = document.createElement("div");
  popup.id = "selection-popup";
  popup.classList.add("explanation-popup");

  // Styles for the popup
  const style = document.createElement("style");
  style.textContent = `
    .explanation-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      background: #1E1E1E;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 10000;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid #333;
    }
    .chat-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      max-height: 400px;
      padding-right: 8px;
    }
    .chat-container::-webkit-scrollbar {
      width: 6px;
    }
    .chat-container::-webkit-scrollbar-track {
      background: #2D2D2D;
      border-radius: 3px;
    }
    .chat-container::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }
    .chat-container::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    .chat-input {
      background-color: #2D2D2D;
      border: 1px solid rgb(75, 85, 99);
      border-radius: 0.5rem;
      padding: 0.5rem;
      color: white;
      width: 100%;
      resize: none;
      outline: none;
    }
    .chat-message-user {
      align-self: flex-end;
      background: #2B7FFF;
      color: white;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border-bottom-right-radius: 0;
      max-width: 80%;
      word-wrap: break-word;
    }
    .chat-message-ai {
      align-self: flex-start;
      background: #2D2D2D;
      color: white;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border-bottom-left-radius: 0;
      max-width: 80%;
      word-wrap: break-word;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    }
    .close-button {
      color: #888;
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      border-radius: 4px;
    }
    .close-button:hover {
      color: white;
      background: #333;
    }
    .input-container {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #333;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .send-button {
      position: absolute;
      right: 8px;
      color: rgb(156, 163, 175);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }
    .send-button:hover {
      color: white;
      background: #333;
    }
  `;
  document.head.appendChild(style);

  // Create header
  const header = document.createElement("div");
  header.className = "header";

  // Create title
  const title = document.createElement("span");
  title.textContent = "ELI5";

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = "✕";
  closeButton.addEventListener("click", () => {
    popup.remove();
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    popupOpen = false;
    console.log("popupOpen is false due to close button");
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
  // userMessage.textContent = selectedText;
  // chatContainer.appendChild(userMessage);

  // Add AI message
  const aiMessage = document.createElement("div");
  aiMessage.className = "chat-message-ai";
  // aiMessage.textContent = textInPopup;
  // chatContainer.appendChild(aiMessage);

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

// ... existing code ...

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!chrome.runtime?.id) {
      throw new Error("Extension context invalidated");
    }

    console.log("Message received in content.js:", message.text);

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
// ... existing code ...
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
// ... existing code ...

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "areaCaptured") {
    console.log("area captured");

    if (!popupOpen) {
      showPopup();

      popupOpen = true;
    }

    addUserMessageToChat("Image captured", true);
    addGeminiResponseToChat("Loading the explanation", false);

    sendResponse({ received: true });
  }
  return true;
});
