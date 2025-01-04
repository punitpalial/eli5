// OLD CODE
let selectedText = "nothing yet";
let textInPopup = "nothing yet";
let popupOpen = false;

let toggle = false;

document.addEventListener("mouseup", () => {
  let selection = window.getSelection();
  selectedText = selection.toString();
  if (selectedText && toggle) {
    console.log(selectedText);
    // console.log('bool responseReceived: ', responseReceived);
    // const responseElement = document.getElementById('responseDiv');
    // responseElement.innerHTML = selectedText;
    //chrome.action.openPopup();
    // chrome.runtime.sendMessage({ action: "textSelected", text: selectedText });
    sendSelectedTextToBackground(selectedText);
  }
});

//checking the keys

let keyE = false;
let key5 = false;

document.addEventListener("keydown", (event) => {
  if (event.key === "e") {
    keyE = true;
  } else if (event.key === "5") {
    if (keyE) {
      if (toggle) {
        toggle = false;
        console.log("toggle is false");
      } else {
        toggle = true;
        enabled();
        console.log("toggle is true");
      }
    }

    keyE = false;
  } else {
    keyE = false;
  }
});

//to show the popup that eli5 has been enabled
function enabled() {
  console.log("enabled function called");
  // alert('eli5 enabled');

  //define the popup in div
  // const popup = document.createElement("div");
  // popup.className = 'keyboard-popup';
  const popup = document.createElement("div");

  // Set text content for the popup
  popup.textContent = "Keyboard Popup";

  // Apply initial styles for the popup
  popup.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  background-color: #333;
  color: white;
  border-radius: 5px;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  opacity: 1;
  animation: slide-in 0.3s ease-out, fade-out 0.3s ease-out 3s forwards;
`;

  // Create and append the keyframes for the popup
  const style = document.createElement("style");
  style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

  // Append the keyframes to the document head
  document.head.appendChild(style);

  // Append the popup to the document body
  document.body.appendChild(popup);

  // Ensure the popup is removed after fade-out completes
  setTimeout(() => {
    popup.remove();
  }, 3300); // Matches animation duration (3s + 0.3s fade-out)

  // Append the keyframes to the document head
  document.head.appendChild(style);

  // Append the popup to the document body
  document.body.appendChild(popup);

  popup.textContent = "eli5 Enabled";

  console.log("displaying the popup");
  //Add to page
  document.body.appendChild(popup);

  // Remove after delay
  // setTimeout(() => {
  //   popup.classList.add("fade-out");
  //   setTimeout(() => {
  //     popup.remove();
  //   }, 300); // Match fade-out animation duration
  // }, 2000);
}

document.addEventListener("click", () => {
  console.log("click event happened");
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
        // console.log('this is the response => ', response);
        // console.log('this is response[0] => ', response[0]);
        console.log(
          "this is response.sendResponseBackToContentScript => ",
          response.sendResponseBackToContentScript
        );
        // console.log('this is response.sendResponseBackToContentScript.text => ', response.sendResponseBackToContentScript.text);
        // console.log('this is the response.sendSelectedTextToBackground => ', response.text);
        // console.log('this is the response.sendSelectedTextToBackground => ', response.str);
        // console.log('type of response.response => ', JSON.stringify(response));

        textInPopup = response.sendResponseBackToContentScript;

        //console.log('popupOpen: ', popupOpen);

        //console.log('this is the responseReceived => ', response.responseReceived);
        if (response.responseReceived) {
          console.log("responseReceived is true");
          //const responseElement = document.getElementById('responseDiv');
          //responseElement.innerHTML = response.response;
          showPopup();
          popupOpen = true;
          //chrome.action.openPopup();
        }
      }
    );
  } catch (error) {
    console.log("this is the error caught in sendMessage => ", error);
  }
}
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "openPopup") {
//         //sendResponse({ displayText: selectedText });
//         console.log('ready to display the response');
//         chrome.action.openPopup();
//     }
//     return true;
// });

// // content.js - Claude 4-8-24
// document.addEventListener('mouseup', () => {
//     const selectedText = window.getSelection().toString().trim();
//     if (selectedText) {
//       showPopup(selectedText);
//     }
//   });

//let popup = document.getElementById('selection-popup');

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
      color: #f0f0f0f0;
      font-size: 20px;
      cursor: pointer;
    `;
  crossButton.textContent = "X";
  //document.body.appendChild(crossButton);

  if (!popupOpen) {
    popup = document.createElement("div");
    popup.id = "selection-popup";
    // popup.className = 'popup-style';
    popup.style.cssText = `
        position: fixed;
        font-family: 'Roboto', sans-serif; 
        top: 10px;
        right: 10px;
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        max-width: 350px;
        word-wrap: break-word;
        white-space: pre-wrap;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        /* all: initial; /* Reset all properties */
        /* * { all: unset; } /* Reset for all child elements */
      `;

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
    document.body.appendChild(popup);
    scrollableContainer.textContent = `${textInPopup}`;
  }
}
