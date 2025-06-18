const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// ✅ CHANGE MODEL HERE
const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 1000,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

function buildPrompt(taskType, userInput) {
  if (taskType === 'translate') {
    return `
You are a deeply trained linguist and philosopher. Before translating, you must:
- Internally analyze the input across 10 dimensions (language, structure, verbs, tone, purpose, layers of meaning, polysemy, contrast, emphasis, and impact of emphasis)
- Reflect on philosophical, metaphorical, and contextual layers

However, in the **output**, provide ONLY the most natural, spiritually deep, and emotionally faithful English translation of the following sentence. 

Do **not** include:
- Explanations
- Headings like "Translation:"
- Options or variants
- Literal meanings or word-by-word notes

Just return the best **single**, complete English translation.

Input:
"${userInput}"`;
  }

  if (taskType === 'improve') {
    if (userInput.trim() === "मैं कौन हूँ") {
      return `The user has entered "मैं कौन हूँ", which literally translates to "Who am I?". 
This is an introspective question with philosophical depth. 
Generate a nuanced English rendering that captures both literal and figurative meaning.
Give 2 versions: 
1. Plain translation
2. Philosophical interpretation`;
    }

    return `Improve the grammar, clarity, and tone of the following sentence. If the sentence has deeper meaning (figurative, emotional, or philosophical), reflect that in the improved output:
"${userInput}"`;
  }

  if (taskType === 'analyze') {
    return `Perform a detailed linguistic analysis of the following sentence:
"${userInput}"

Answer the following 10 points clearly and concisely:

1. Identify the language.
2. Describe the sentence structure (e.g., SVO/SOV, tense, subject/object).
3. List the types of verbs/words used (e.g., auxiliary, modal, noun phrases).
4. Specify whether the language is formal or informal.
5. Describe the purpose of the sentence (e.g., question, statement, philosophical).
6. Explain if there are multiple layers of meaning (literal and figurative).
7. Check if any word appears multiple times with different meanings.
8. If yes, provide contrasted examples showing the deeper meanings.
9. Identify which words are emphasized (emotionally or grammatically).
10. Analyze if emphasis changes the meaning, even slightly.`;
  }

  throw new Error("Invalid taskType. Use 'translate', 'improve', or 'analyze'.");
}



async function processText(taskType, userInput) {
  const prompt = buildPrompt(taskType, userInput);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const { userInput, taskType } = req.body;
    console.log('Incoming /chat request:', { userInput, taskType });

    if (!userInput || !taskType) {
      return res.status(400).json({ error: 'userInput and taskType are required' });
    }

    const response = await processText(taskType, userInput);
    res.json({ response });

  } catch (error) {
    console.error('Error in /chat endpoint:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});