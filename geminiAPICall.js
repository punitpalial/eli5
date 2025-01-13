// Import Statment to import the GoogleGenerativeAI package into my file folder. This took a lot of time to figure out properly because I couldn't provide the proper import statement.
import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import { config } from "./config.js";

let currentTabId;
// getCurrentTab().then((tab) => {
//   console.log("tab", tab);
// });

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  currentTabId = tab;
  console.log("current tab id", currentTabId.id);
  return tab;
}
console.log(typeof currentTabId);
console.log("current tab id", currentTabId);
// console.log("current currentTabId", currentTabId.id);

// try {
//   getCurrentTab().then((tab) => {
//     chrome.scripting.executeScript({
//       files: ["areaScreenShotExplanation/testpopupwalifile.js"],
//       target: { tabId: tab.id },
//     });

//     console.log("tab", tab);
//     console.log("tab id", tab.id);
//   });
// } catch (error) {
//   console.log("error", error);
// }

// chrome.scripting.executeScript({
//   files: ["areaScreenShotExplanation\testpopupwalifile.js"],
//   target: { tabId: currentTabId.id },
// });
// chrome.scripting.executeScript({
//   files: ["selectedTextExplanationcontent.js"],
//   // target: { tabId: tab.id },
// });

chrome.action.onClicked.addListener((tab) => {
  // inject(tab);
  console.log("clicked");
  console.log("tab", tab);
  console.log("tab id", tab.id);

  // try {
  //   getCurrentTab().then((tab) => {
  //     chrome.scripting.executeScript({
  //       files: ["areaScreenShotExplanation/testpopupwalifile.js"],
  //       target: { tabId: tab.id },
  //     });

  //     console.log("tab", tab);
  //     console.log("tab id", tab.id);
  //   });
  // } catch (error) {
  //   console.log("error", error);
  // }
});

//////////////////////////////////////////////

export let text = "nothing yet";

let responseText = "nothing yet";
let responseReceivedFromAPI = false;

const apiKeyOfGemini = config.GEMINI_API_KEY;

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(apiKeyOfGemini);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Base Text that goes along with the prompt to the API. Base Text will define what kind of response will the API give with respect to the given prompt
let baseText =
  "Explain the selected text or word in simple terms. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't knwo something, simply say that you dont know instead of making things up.";
let prompt = "nothing yet";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "textSelected") {
    // Handle the async operation properly
    (async () => {
      try {
        prompt = baseText + message.text;
        const response = await run(prompt);

        sendResponse({
          sendResponseBackToContentScript: response,
          responseReceived: true,
        });
      } catch (error) {
        console.error("Error processing message:", error);
        sendResponse({
          sendResponseBackToContentScript:
            "An error occurred while processing your request.",
          responseReceived: false,
          error: error.message,
        });
      }
    })();

    return true; // Indicates we will send response asynchronously
  }

  //tocapture the visible tab
  else if (message.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true; // Indicate asynchronous response
  }

  //to crop the captured image and send it to the API
  else if (message.action === "saveCroppedImage") {
    // Handle the async operation and send response
    (async () => {
      try {
        const result = await sendToAPI(message.dataUrl);
        sendResponse(result);
      } catch (error) {
        console.error("Error processing image:", error);
        sendResponse({ error: "Failed to process image" });
      }
    })();
    return true; // Important: indicates we will send response asynchronously
  }
});

async function run(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    text = response.text();
    console.log("response received", response);
    return text;
  } catch (error) {
    console.log("this is the error => ", error);
  }
}

async function sendToAPI(dataUrl) {
  console.log("Sending to API...");

  try {
    let base64Image = dataUrl.split(",")[1];

    const imageResult = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png",
        },
      },
      "Explain the content of the image. If it involves code or complex terms then break them down into simpler terms. Explain in easy and simple language. Use examples if needed. If the image has a text in a language other than english then translate it to english. If there's a question in the image then answer the question with logical explanation as well. Don't hallucinate.",
    ]);

    responseText = imageResult.response.text();
    responseReceivedFromAPI = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "imageExplanationResponseReceived",
          text: responseText,
        });
      }
    });

    // chrome.downloads.download({ url: dataUrl, filename: "screenshot.png" });

    return responseText; // Return the response
  } catch (error) {
    console.error("Failed to generate content:", error);
    throw error; // Propagate the error
  }
}
