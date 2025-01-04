// Import Statment to import the GoogleGenerativeAI package into my file folder. This took a lot of time to figure out properly because I couldn't provide the proper import statement.
import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
// import dotenv from "dotenv";
// dotenv.config();

export let text = "nothing yet";

// export let responseReceived = false;

// const apiKeyOfGemini = process.env.API_KEY;
const apiKeyOfGemini = "AIzaSyBovbyKOhCDO2M1XZMbGepSBprBBs_K9ng";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(apiKeyOfGemini);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Base Text that goes along with the prompt to the API. Base Text will define what kind of response will the API give with respect to the given prompt
let baseText =
  "Explain the selected text or word in simple terms. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't knwo something, simply say that you dont know instead of making things up.";
let prompt = "nothig yet";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // message/message aek hi baat hai (message is the title you have given to the message)
  // sender is the tab from where the message is coming
  if (message.action === "textSelected") {
    prompt = baseText + message.text;

    run(prompt).then((response) => {
      console.log("this is message => ", message);
      console.log("this is message.text => ", message.text);
      console.log("this is sender => ", sender);
      console.log("this is sendResponse => ", sendResponse);

      console.log(response);
      //const responseElement = document.getElementById('responseDiv');
      // responseElement.innerHTML = response;
      // chrome.action.openPopup();
      // letresponseReceived = true;
      sendResponse({
        sendResponseBackToContentScript: response,
        responseReceived: true,
      }); // sendResponseBackToContentScript is the title of the what we send back. and jo wapas bhej rahey hai woh 'response' hai. uss object ka value.
      //chrome.runtime.sendMessage({ action: "openPopup", displayText: response });

      // console.log('sendResponse.responseReceived => ', response.responseReceived);
    });
  }
  return true;
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
