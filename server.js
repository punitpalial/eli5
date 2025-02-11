import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import express from "express";
import "dotenv/config";

const port = process.env.PORT;
const apiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const chat = model.startChat({
  history: [],
});

app.post("/selectedTextExplanation", async (req, res) => {
  const { text } = req.body;
  const prompt = text;
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  chat._history = [];

  await addToHistory(prompt, response);

  console.log("after adding selected text", chat._history);

  res.json({ explanation: response });
});

app.post("/inputTextExplanation", async (req, res) => {
  console.log(chat._history);
  const { text } = req.body;
  const prompt = text;

  const result = await chat.sendMessage(prompt);
  const response = await result.response.text();

  await addToHistory(prompt, response);

  console.log("here is input ka output", response);

  res.json({ modelAnswer: response });
});

app.post("/imageExplanation", async (req, res) => {
  const { text } = req.body;
  const { imgData } = req.body;

  console.log("Text is", text);

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
  console.log("responseText ", responseText);
  res.json({ modelAnswer: responseText });
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
