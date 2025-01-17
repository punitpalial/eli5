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

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstructions:
    "You are an assistant whose task is to simply the input text or the image sent to you and explain it in simple terms so that an average person can understand the text or the image. Keep the result short and sweet without compromising on explaning relevant details",
});

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

        // for await (const chunk of response.stream) {
        //   const chunkText = chunk.text();
        //   sendResponse({
        //     sendResponseBackToContentScript: response,
        //     responseReceived: true,
        //   });
        // }

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
  else if (message.action === "fetchExplanation") {
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
      "You have been tasked to find the BOX WITH PURPLE BORDER in the image. If you can't see the BOX WITH PURPLE BORDER or if you are not 100% confident about the location of the BOX WITH PURPLE BORDER or if the BOX WITH PURPLE BORDER is empty and has nothing in it then strictly don't answer this question and simply reply with - 'Selected area is too small, please select a larger area' and IGNORE THE REST OF THE PROMPT. Only when you have accurately located the BOX WITH PURPLE BORDER and made sure that the box is not empty, look inside only the BOX WITH PURPLE BORDER. Explain everything inside that BOX WITH PURPLE BORDER in simple terms. If there are complex terms, complex words or any code inside that BOX WITH PURPLE BORDER, then explain them all using simple language. If there is an abbrevation, then tell its fullform based on the context inside the BOX WITH PURPLE BORDER. If you don't know something, simply say that you don't know instead of making things up. Use the context of the image to explain the content inside the BOX WITH PURPLE BORDER but the main context is only the PURPLE boc. In your answer don't use the words 'BOX WITH PURPLE BORDER'. Don't start your answer with 'Here's a summary' etc. simply start with the explanation.",
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
