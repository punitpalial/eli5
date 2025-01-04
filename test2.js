// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
//     if (request.greeting === "hello") {
//         sendResponse({ farewell: "goodbye" });
//     }
// });


// API_KEY = 'AIzaSyBovbyKOhCDO2M1XZMbGepSBprBBs_K9ng';

// const { GoogleGenerativeAI } = require("@google/generative-ai");
import { GoogleGenerativeAI } from './node_modules/@google/generative-ai/dist/index.mjs';

// require('dotenv').config();
// import dotenv from './node_modules/dotenv/lib/main.d.js';
// dotenv.config();

export let text  = 'nothing yet';

const apiKeyOfGemini = 'AIzaSyBovbyKOhCDO2M1XZMbGepSBprBBs_K9ng';

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(apiKeyOfGemini);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// let prompt = "explain the selected text in short and in simplest terms as if I'm a 5 year old : ";



async function run() {
   const prompt = "tell a simple joke";


  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text();
    console.log('response received');
    return text
  } catch (error) {
    console.log('this is the error => ', error);
  }

}

run().then(response => {
  console.log(response);
  //alert('the joke is supposed to be:');
  const responseElement = document.getElementById('responseDiv');
  responseElement.innerHTML = response;
});


// document.addEventListener('mouseup', () => {
//     let selection = window.getSelection();
//     let selectedText = selection.toString();
//     if (selectedText) {
//         //console.log('Selected text:', selectedText);

//     }
// });

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { 
  
//   console.log(request);
//   console.log(sender);
//   console.log(sendResponse);
//   sendResponse({ farewell: "goodbye" });
  
// });

//console.log('the key is', apiKeyOfGemini);
