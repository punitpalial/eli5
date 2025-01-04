import { text } from "./test2.js";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { 
  
    console.log(request);
    console.log(sender);
    console.log(sendResponse);
    sendResponse({ farewell: text });
    
  });

