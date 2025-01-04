// function test1(text) {

//     console.log('this is the text from popup.js => ', text);
    
    
// }








// OLD CODE WHICH HAS NO USE NOW

// document.addEventListener('DOMContentLoaded', () => {
//     const responseDiv = document.getElementById('responseDiv');
//     responseDiv.textContent = 'Loading...';

//     chrome.runtime.sendMessage({ action: 'getExplanation' }, response => {
//       if (response && response.response) {
//         responseDiv.textContent = response.response;
//       } else {
//         responseDiv.textContent = 'Error: No response received';
//       }
//     });
//   });

//From Claude 3-8-24

// Listen to mouseup event
// document.addEventListener('mouseup', function() {
//   console.log('mouseup event happened');
//   let selectedText = window.getSelection().toString().trim();
//   if (selectedText) {
//     chrome.runtime.onMessage.addListener(function(details) {
//       console.log('message to background javascript: ' + selectedText);
//   });
//   }
// });



// document.addEventListener('selectionchange', function () {
//   const selectedText = window.getSelection().toString().trim();
//   // if (selectedText) {
//   //   alert('Text selected: ' + selectedText);
//   // }

//   console.log('selected text: ', selectedText);
//   chrome.runtime.sendMessage({ action: "getExplanation" }, function (response) {
//     document.getElementById('responseDiv').textContent = response.explanation; // response.explanation is the text from the LLM API
//   });


// });

// Send a request to the background script to get the explanation
// document.addEventListener('DOMContentLoaded', function() {
//   chrome.runtime.sendMessage({action: "getExplanation"}, function(response) {
//     document.getElementById('responseDiv').textContent = response.explanation; // response.explanation is the text from the LLM API
//   });
// });




















// import MistralClient from '@mistralai/mistralai';
// import { APIkey } from "./APIkey.js";

// export let answer = 'nothing yet';

// const apiKey = APIkey;

// const client = new MistralClient(apiKey);

// async function chatRequest() {

//     try {
//         const chatResponse = await client.chat({
//             model: 'mistral-large-latest',
//             messages: [{ role: 'user', content: 'tell me a what you know aout paneer lababdar in 2 lines' }],
//         });

//         answer = await chatResponse.choices[0].message.content;

//         return answer;
//     } catch (error) {
//         console.error('Error calling Mistral API:', error);
//         return 'Error occured while fetching response'
//     }
// }

// chatRequest().then(answer => {
//     console.log(answer);
//     const elementInExtension = document.getElementById('jokeElement');
//     elementInExtension.innerHTML = answer;
// })





//import { answer } from "./mistralAPI.js";


// const promptInput = document.getElementById('promptInput');
// const submitButton = document.getElementById('submitButton');
// const responseDiv = document.getElementById('responseDiv');

// submitButton.addEventListener('click', () => {
//     const prompt = promptInput.value;
//     responseDiv.textContent = 'Loading...';

// let prompt = 'tell me about lions';
// let textContent = 'nothing';


// chrome.runtime.sendMessage(
//     { action: 'getMistralResponse', prompt: prompt },
//     response => {
//         if (response && response.response) {
//             textContent = response.response;
//         } else if (response && response.error) {
//             textContent = 'Error: ' + response.error;
//         } else {
//             textContent = 'Error: No response received';
//         }
//     }
// );


// function updateTheExtension() {
//     console.log(textContent);
//     const elementInExtension = document.getElementById('jokeElement');
//     elementInExtension.innerHTML = textContent;
// }

// updateTheExtension();