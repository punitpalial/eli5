// Import Statment to import the GoogleGenerativeAI package into my file folder. This took a lot of time to figure out properly because I couldn't provide the proper import statement.

let text = "empty";
let responseText = "empty";
let responseReceivedFromAPI = false;
let mode;

chrome.storage.sync.get(["responseMode"], function (result) {
  mode = result.responseMode;
});

chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(["responseMode"], function (result) {
    mode = result.responseMode;
  });
});

// Base Text that goes along with the prompt to the API. Base Text will define what kind of response will the API give with respect to the given prompt
let firstBaseText =
  "Explain the selected text or word in simple terms. If there are any complex technical terms then explain them simply after giving a short explanation of the selected text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't knwo something, simply say that you dont know instead of making things up. ";
let laterBaseText =
  "Use all the text in the history as context and answer what's asked in very simple terms. Explain in complex terms in simple terms. If you don't know something, simply say that you don't know instead of making things up. Ise your existing knowledge to answer the question if the context provided in the chat history is not sufficient. Here's the question: ";
let prompt = "nothing yet";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // to send the selected text to the API
  if (message.action === "textSelected") {
    // Handle the async operation properly
    (async () => {
      try {
        firstBaseText =
          mode === "eli5"
            ? "Explain the text or word in simple terms as if you are explaining to a 5 year old. If there are any complex technical terms then explain them simply after giving a short explanation of the text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't know something, simply say that you dont know instead of making things up. "
            : "Explain the text or word in simple language. If there are any complex technical terms then explain them simply after giving a short explanation of the text first. If you detect any other language apart from English then translate it into English. Don't hallucinate. If you don't know something, simply say that you dont know instead of making things up. ";
        prompt = firstBaseText + message.text;
        // console.log("mode: ", mode);
        const response = await fetch(
          "https://eli5-production-46b4.up.railway.app/selectedTextExplanation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: firstBaseText,
              selectedText: message.text,
            }),
          }
        );

        const data = await response.json();
        const explanation = await data.explanation;

        await addToHistory(message.text, explanation);

        sendResponse({
          sendResponseBackToContentScript: explanation,
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
  } else if (message.action === "getExplanationOfInputText") {
    (async () => {
      try {
        laterBaseText =
          mode === "eli5"
            ? "Answer and Explain what's asked as if you are explaining to a 5 year old. Explain the  complex terms in simple terms as if you are explaining to a 5 year old. If you don't know something, simply say that you don't know instead of making things up. Use the previous chat history as additional context to answer the question if the previous context is available. Here's the question: "
            : "Answer and Explain what's asked in very simple terms. Explain the complex terms in simple terms. If you don't know something, simply say that you don't know instead of making things up. Use the previous chat history as additional context to answer the question if the previous context is available. Here's the question: ";

        // console.log("textinput mode: ", laterBaseText);
        prompt = laterBaseText + (message.question || message.text);
        const userQuestion = message.question || message.text;

        const result = await fetch(
          "https://eli5-production-46b4.up.railway.app/inputTextExplanation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: laterBaseText,
              inputQuestion: userQuestion,
              chathistory: chat,
            }),
          }
        );

        const data = await result.json();
        let modelAnswer = data.modelAnswer;

        addToHistory(userQuestion, modelAnswer);

        sendResponse({
          modelResponse: modelAnswer,
          responseReceived: true,
        });
      } catch (error) {
        console.error("Error processing message:", error);
        sendResponse({
          error: error.message,
          responseReceived: false,
        });
      }
    })();
    return true; // Important: indicates we will send response asynchronously
  }

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
        sendResponse(result);
      } catch (error) {
        console.error("Error processing image:", error);
        sendResponse({ error: "Failed to process image" });
      }
    })();
    return true; // Important: indicates we will send response asynchronously
  } else if (message.action === "connection1") {
    sendResponse("from gemini connection1")();
  } else if (message.action === "connection2") {
    sendResponse("from gemini connection2")();
  }
});

async function sendToAPI(dataUrl) {
  try {
    let base64Image = dataUrl.split(",")[1];

    let promptPrefix =
      mode === "eli5"
        ? "Find the BOX WITH PURPLE BORDER in the image. If you can't see the BOX WITH PURPLE BORDER or if you are not 100% confident about the location of the BOX WITH PURPLE BORDER or if the BOX WITH PURPLE BORDER is empty and has nothing in it then strictly don't answer this question and simply reply with - 'Selected area is too small, please select a larger area'. Only when you have accurately located the BOX WITH PURPLE BORDER and made sure that the box is not empty, look inside only the BOX WITH PURPLE BORDER. Explain everything inside that BOX WITH PURPLE BORDER as if you are explaining to a 5 year old. If there are complex terms, complex words or any code inside that BOX WITH PURPLE BORDER, then explain them all using simple language as if you are explaining to a 5 year old. If there is an abbrevation, then tell its fullform based on the context inside the BOX WITH PURPLE BORDER. If you don't know something, simply say that you don't know instead of making things up. Use the context of the image to explain the content inside the BOX WITH PURPLE BORDER but the main context is only the PURPLE boc. In your answer don't use the words 'BOX WITH PURPLE BORDER'. Don't start your answer with 'Here's a summary' etc. simply start with the explanation."
        : "Find the BOX WITH PURPLE BORDER in the image. If you can't see the BOX WITH PURPLE BORDER or if you are not 100% confident about the location of the BOX WITH PURPLE BORDER or if the BOX WITH PURPLE BORDER is empty and has nothing in it then strictly don't answer this question and simply reply with - 'Selected area is too small, please select a larger area'. Only when you have accurately located the BOX WITH PURPLE BORDER and made sure that the box is not empty, look inside only the BOX WITH PURPLE BORDER. Explain everything inside that BOX WITH PURPLE BORDER in simple terms. If there are complex terms, complex words or any code inside that BOX WITH PURPLE BORDER, then explain them all using simple language. If there is an abbrevation, then tell its fullform based on the context inside the BOX WITH PURPLE BORDER. If you don't know something, simply say that you don't know instead of making things up. Use the context of the image to explain the content inside the BOX WITH PURPLE BORDER but the main context is only the PURPLE boc. In your answer don't use the words 'BOX WITH PURPLE BORDER'. Don't start your answer with 'Here's a summary' etc. simply start with the explanation.";

    const imageResult = await fetch(
      "https://eli5-production-46b4.up.railway.app/imageExplanation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: promptPrefix,
          imgData: base64Image,
        }),
      }
    );

    // https://eli5-production-46b4.up.railway.app

    const data = await imageResult.json();

    responseText = data.modelAnswer;
    const completeImageDescription = data.imageDescription;

    await addToHistory(completeImageDescription, responseText);

    responseReceivedFromAPI = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "imageExplanationResponseReceived",
          text: responseText,
        });
      }
    });

    return responseText; // Return the response
  } catch (error) {
    console.error("Failed to generate content:", error);
    throw error; // Propagate the error
  }
}

let chat = [];

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

    chat.push(historyUserObject);
    chat.push(historyModelObject);

    // console.log("chat hai ji: ", chat);
  } catch (error) {
    console.log("Error adding to history", error);
  }
}
