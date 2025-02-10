import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
import express from "express";
import "dotenv/config";

const port = process.env.PORT;
const apiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt =
  "My girlfriend's name is Arushi. Write a paragraph to let her know that I love her. Also wish her happy valentine. My name is Punit";

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
// const text = "indian democracy";

app.use(express.json());

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

// setTimeout(async () => {
//   try {
//     const response = await fetch(
//       "learningexpress-production-76da.up.railway.app/test",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           text: "elephants of africa",
//         }),
//       }
//     );
//     const data = await response.json();
//     console.log(data);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }, 5000);

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

app.get("/users", (req, res) => {
  const html = `
    <ul>
       ${users.map((user) => `<li>${user.first_name}</li>`).join("")}
    </ul>
    `;

  res.send(html);
});

app.get("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  console.log(id);
  const userinfo = users.find((user) => users.id === id);
  //   console.log(userinfo);
  const temp = users.find((pit) => pit.id === id);
  console.log("temp is", temp);
  res.json(temp);
});

app
  .route("/api/users/:name")
  .get((req, res) => {
    const name = req.params.name;
    console.log(name);
    const userinfo = users.find((user) => user.first_name === name);
    //   console.log(userinfo);
    const temp = users.find((pit) => pit.first_name === name);
    console.log("temp is", temp);
    res.json(temp);
  })
  .put((req, res) => {
    res.json({ status: "Coming soon" });
  })
  .patch((req, res) => {
    res.json({ status: "Coming soon" });
  });

app.listen(port, () => console.log("Server Started"));
