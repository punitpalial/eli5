import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import express from "express";
import "dotenv/config";

const port = process.env.PORT;
const apiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstructions:
    "You are an assistant whose task is to simplify the input text or the image sent to you and explain it in simple terms so that an average person can understand the text or the image. Keep the result short and sweet without compromising on explaning relevant details. In case of a image, identify the purple box and only explain the contents within that box.",
});

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const chat = model.startChat({
  history: [],
});

app.post("/selectedTextExplanation", async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = text;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    chat._history = [];

    await addToHistory(prompt, response);

    res.json({ explanation: response });
  } catch (error) {
    console.log("Error in getting the explanation of the selected text", error);
  }
});

app.post("/inputTextExplanation", async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = text;

    const result = await chat.sendMessage(prompt);
    const response = await result.response.text();

    await addToHistory(prompt, response);

    res.json({ modelAnswer: response });
  } catch (error) {
    console.log("Error in getting the explanation of the input", error);
  }
});

app.post("/imageExplanation", async (req, res) => {
  try {
    const { text } = req.body;
    const { imgData } = req.body;

    const imageResult = await model.generateContent([
      {
        inlineData: {
          data: imgData,
          mimeType: "image/png",
        },
      },
      text,
    ]);

    const responseText = imageResult.response.text();

    await addToHistory(text, responseText);
    res.json({ modelAnswer: responseText });
  } catch (error) {
    console.log("Error in getting the explanation of the image", error);
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

app.listen(port, () => console.log("Server Started"));
