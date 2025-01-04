import MistralClient from '@mistralai/mistralai';
import { APIkey } from "./APIkey.js";

const client = new MistralClient(APIkey);
const PREDEFINED_PROMPT = "tell me about lion";

async function getMistralResponse() {
  try {
    const chatResponse = await client.chat({
      model: 'mistral-tiny',
      messages: [{ role: 'user', content: PREDEFINED_PROMPT }]
    });
    return chatResponse.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    return 'Error occurred while fetching response';
  }
}

getMistralResponse().then(respone2 => {
  console.log('response is', respone2);
})

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'getMistralResponse') {
//     getMistralResponse().then(response => {
//       sendResponse({ response: response });
//     });
//     return true; // Indicates we will send a response asynchronously
//   }
// });

// --------------------------
// import MistralClient from '@mistralai/mistralai';
// import { APIkey } from "./APIkey.js";

// export let answer = 'nothing yet';

// const apiKey = process.env.MISTRAL_API_KEY || APIkey;

// const client = new MistralClient(apiKey);


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'getMistralResponse') {
//     client.chat({
//       model: 'mistral-large-latest',
//       messages: [{ role: 'user', content: request.prompt }]
//     }).then(chatResponse => {
//       sendResponse({ response: chatResponse.choices[0].message.content });
//     }).catch(error => {
//       console.error('Error calling Mistral API:', error);
//       sendResponse({ error: 'Error occurred while fetching response' });
//     });
//     return true; // Indicates we will send a response asynchronously
//   }
// });

// ------------------


// async function chatRequest() {
//   try {
//     const chatResponse = await client.chat({
//       model: 'mistral-large-latest',
//       messages: [{ role: 'user', content: 'tell me a what you know aout paneer lababdar in 2 lines' }],
//     });

//     answer = await chatResponse.choices[0].message.content;

//     return answer;
//   } catch (error) {
//     console.error('Error calling Mistral API:', error);
//     return 'Error occured while fetching response'
//   }
// }

// chatRequest().then(response => {
//   console.log('response is => ', response);
// })









// -------------------------------------------------------------------

// let answerFromChat = 'loading';


// async function chatResponseFunction() {
//   let chatResponse2 = await client.chat({
//     model: 'mistral-large-latest',
//     messages: [{role: 'user', content: 'tell in brief how can i become great at Retriveal Augmented Generation & Machine Learning'}],
//   });

//   let answerFromChat = chatResponse2.choices[0].message.content;

//   return answerFromChat;

//   //console.log('answerFromChat says = ', answerFromChat);
// }

// chatResponseFunction().then(answerFromChat => {
//     console.log(answerFromChat);
//     const jokeElement = document.getElementById('jokeElement');
//     jokeElement.innerHTML = answerFromChat;
// })
