import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import { config } from "./config.js";

const geminiAPIkey = config.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiAPIkey);

const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
let responseText = "nothing yet";
let responseReceivedFromAPI = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true; // Indicate asynchronous response
  } else if (message.action === "saveCroppedImage") {
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
      "Explain the content of the image. If it involves code or complex terms then break them down into simpler terms. Explain in easy and simple language. Use examples if needed. If the image has a text ina language other than english then translate it to english.",
    ]);

    responseText = imageResult.response.text();
    responseReceivedFromAPI = true;

    chrome.downloads.download({ url: dataUrl, filename: "screenshot.png" });

    return responseText; // Return the response
  } catch (error) {
    console.error("Failed to generate content:", error);
    throw error; // Propagate the error
  }
}
