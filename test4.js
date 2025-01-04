
import { GoogleGenerativeAI } from './node_modules/@google/generative-ai/dist/index.mjs';

export let text = 'nothing yet';

// export let responseReceived = false;

const apiKeyOfGemini = 'AIzaSyBovbyKOhCDO2M1XZMbGepSBprBBs_K9ng';

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(apiKeyOfGemini);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//let baseText = "explain this selected text in short. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first. if there is any currency used instead of inr, then convert the prices to inr as well. Omit writing anything about currency if no currency is mentioned in the selected text:";
let baseText = "Explain the selected text or word in simple terms. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first - ";
let prompt = 'nothig yet';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { 
    // message/message aek hi baat hai (message is the title you have given to the message)
    // sender is the tab from where the message is coming
    if (message.action === "textSelected") {
        prompt = baseText + message.text;
        // console.log(prompt);
        run(prompt).then(response => {
            //console.log('this is message => ', message);
            //console.log('this is message.text => ', message.text);
            //console.log('this is sender => ', sender);
            // console.log('this is sendResponse => ', sendResponse);

            console.log(response);
            //const responseElement = document.getElementById('responseDiv');
            // responseElement.innerHTML = response;
            // chrome.action.openPopup();
            // letresponseReceived = true;
            sendResponse({
                sendResponseBackToContentScript: response,
                responseReceived : true }); // sendResponseBackToContentScript is the title of the what we send back. and jo wapas bhej rahey hai woh 'response' hai. uss object ka value.
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
        console.log('response received', response);
        return text;
    } catch (error) {
        console.log('this is the error => ', error);
    }

}




// document.addEventListener('mouseup', () => {
//     let selection = window.getSelection();
//     let selectedText = selection.toString();
//     if (selectedText) {
        
//         prompt = baseText + selectedText;
//         console.log(prompt);

//         run(prompt).then(response => {
//             console.log(response);
//             const responseElement = document.getElementById('responseDiv');
//             responseElement.innerHTML = response;
//         });
//     }
// });


