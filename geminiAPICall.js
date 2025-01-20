// Import Statment to import the GoogleGenerativeAI package into my file folder. This took a lot of time to figure out properly because I couldn't provide the proper import statement.
import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import { config } from "./config.js";

chrome.action.onClicked.addListener((tab) => {
  // inject(tab);
  console.log("clicked");
  console.log("tab", tab);
  console.log("tab id", tab.id);
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

const chat = model.startChat({
  history: [],
});

// Base Text that goes along with the prompt to the API. Base Text will define what kind of response will the API give with respect to the given prompt
let firstBaseText =
  "Explain the selected text or word in simple terms. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't knwo something, simply say that you dont know instead of making things up. ";
const laterBaseText =
  "Use all the text in the history as context and answer what's asked in very simple terms. Explain in complex terms in simple terms. If you don't know something, simply say that you don't know instead of making things up. Here's the question: ";
let prompt = "nothing yet";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // to send the selected text to the API
  if (message.action === "textSelected") {
    // Handle the async operation properly
    (async () => {
      try {
        let response;
        prompt = firstBaseText + message.text;
        response = await run(prompt);

        // console.log("textSelected response ===>>>", response); //this works

        addToHistory(message.text, response);

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
  } // ... existing code ...
  else if (message.action === "getExplanationOfInputText") {
      (async () => {
        try {
          console.log("Processing question:", message.question || message.text);
          prompt = laterBaseText + (message.question || message.text);
          let result = await chat.sendMessage(prompt);
          let modelAnswer = result.response.text();
  
          console.log("getExplanationOfInputText response:", modelAnswer);
  
          addToHistory(message.text, modelAnswer);
          sendResponse({
            modelResponse: modelAnswer,
            responseReceived: true
          });
        } catch (error) {
          console.error("Error processing message:", error);
          sendResponse({
            error: error.message,
            responseReceived: false
          });
        }
      })();
      return true; // Important: indicates we will send response asynchronously
  }
  // ... existing code ...

  //tocapture the visible tab
  else if (message.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "areaCaptured",
            dataUrl: dataUrl,
          });
        }
      });
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

        addToHistory(
          "Explain the contents of the purple color box in image",
          result
        );

        sendResponse(result);
      } catch (error) {
        console.error("Error processing image:", error);
        sendResponse({ error: "Failed to process image" });
      }
    })();
    return true; // Important: indicates we will send response asynchronously
  }
});

async function addToHistory(UserMessage, ModelResponse) {
  try {
    const historyUserObject = {
      role: "user",
      parts: [{ text: UserMessage }],
    };

    const historyModelObject = {
      role: "model",
      parts: [{ text: ModelResponse }], // result is the explanation text of the image received from the API
    };

    chat._history.push(historyUserObject);
    chat._history.push(historyModelObject);
  } catch (error) {
    console.log("Error adding to history", error);
  }
}

async function run(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    text = response.text();
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
