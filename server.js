import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import express from "express";
import "dotenv/config";

const port = process.env.PORT;
const apiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt =
  "My girlfriend's name is Arushi. Write a paragraph to let her know that I love her. Also wish her happy valentine. My name is Punit";

const chat = model.startChat({
  history: [],
});

async function getresponse(inputForOutput) {
  try {
    console.log("Calling Gemini API...");
    console.log("inputForOuptut", inputForOutput);
    const result = await model.generateContent(prompt);
    if (!result) {
      throw new Error("No response from Gemini");
    }
    return result;
  } catch (error) {
    console.error("Error in getresponse:", error);
    throw error;
  }
}

const app = express();

// Routes
app.get("/api/users", (req, res) => {
  res.json(users);
  //   console.log(users.log);
});

const mode = "eli5";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  // const { prevHistory } = req.body;
  // console.log("prompt is: ", prompt);
  // chat._history = prevHistory;

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

app.post("/test", async (req, res) => {
  try {
    console.log("test called");
    console.log("here's the req: ", req);
    const { text } = req.body;
    const prompt = text;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ explanation: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/gemini", async (req, res) => {
  try {
    console.log("Starting Gemini request...");
    const answer = await getresponse("Write a love letter to my girlfriend");

    if (!answer || !answer.response) {
      throw new Error("Invalid response from Gemini API");
    }

    const text = answer.response.text();
    console.log("Gemini response:", text);
    res.json({ response: text });
    // return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).send(`Error: ${error.message}`);
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
