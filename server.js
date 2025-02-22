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

app.post("/selectedTextExplanation", async (req, res) => {
  try {
    const { mode, selectedText } = req.body;
    const prompt = mode + selectedText;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ explanation: response });
  } catch (error) {
    console.log("Error in getting the explanation of the selected text", error);
  }
});

app.post("/inputTextExplanation", async (req, res) => {
  try {
    let chat = model.startChat({
      history: [],
    });

    const { mode, inputQuestion, chathistory } = req.body;
    const prompt = mode + inputQuestion;

    console.log("chat in server is: ", chathistory);

    chat._history = chathistory.map((message) => {
      role: message.role;
      parts: message.parts;
    });

    console.log("chat._history: ", chat._history);
    const result = await chat.sendMessage(prompt);
    const response = await result.response.text();

    chat._history = [];

    res.json({ modelAnswer: response });
  } catch (error) {
    console.log("Error in getting the explanation of the input", error);
  }
});

app.post("/imageExplanation", async (req, res) => {
  try {
    const { mode } = req.body;
    const { imgData } = req.body;

    const imageResult = await model.generateContent([
      {
        inlineData: {
          data: imgData,
          mimeType: "image/png",
        },
      },
      mode,
    ]);

    const fullImageResult = await model.generateContent([
      {
        inlineData: {
          data: imgData,
          mimeType: "image/png",
        },
      },
      "Describe everything in the image with great detail",
    ]);

    const responseText = await imageResult.response.text();
    const fullImageDescription = await fullImageResult.response.text();

    res.json({
      modelAnswer: responseText,
      imageDescription: fullImageDescription,
    });
  } catch (error) {
    console.log("Error in getting the explanation of the image", error);
  }
});

app.listen(port, () => console.log("Server Started"));
