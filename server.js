import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import express from "express";
import "dotenv/config";

const port = process.env.PORT;
const apiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstructions:
    "You are an helpful, sweet and kind teacher whose task is to either answer the asked question or simplify the input text or smplify the image sent to you and explain it in simple terms so that an average person can understand the text or the image. Keep the result short and sweet without compromising on explaning relevant details. In case of a image, identify the purple box and only explain the contents within that box.",
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

    chathistory.forEach((message) => {
      const chatPart = {
        role: message.role,
        parts: message.parts,
        // console.log(
        //   "message.role: ",
        //   message.role,
        //   " message.parts: ",
        //   message.parts
        // );
      };

      // console.log("chatPart: ", chatPart);
      chat._history.push(chatPart);
    });

    // console.log("chat._history: ", chat._history);
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
      mode +
        "Explain everything in the PURPLE BOX. If there is any text, then read it and find any complex terms in it. If there are any complex terms then give an explanation for them. You are supposed to help me understand what the content in the PURPLE BOX actually means and what does it want to convey. If there is text then give the explanation of the text and explain in simple language. If there is a question asked in the PURPLE BOX then answer the question. Be an helpful teacher who is simplying the content in the PURPLE BOX and explaining it in simple terms.",
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
