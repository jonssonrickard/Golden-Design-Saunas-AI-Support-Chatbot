import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read vector store
const vectorStorePath = path.join(__dirname, "vectorStore.json");
const vectorStore = JSON.parse(fs.readFileSync(vectorStorePath, "utf-8"));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findRelevantChunks(question) {
  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const questionEmbedding = embeddingResponse.data[0].embedding;

  const rankedChunks = vectorStore
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  return rankedChunks.map(chunk => chunk.text).join("\n\n");
}

app.get("/", (req, res) => {
  res.send("Golden Design chatbot backend is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const relevantKnowledge = await findRelevantChunks(message);

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
You are a customer support assistant for Golden Design Saunas.

Your task is to answer customer questions using only the uploaded knowledge files.

The website operates independently by Highland Sources LLC as an authorized reseller of Golden Designs Inc. products. 
Do not claim that the website itself is Golden Designs Inc.

You can help customers with:
- Company information
- Product categories
- Infrared saunas
- Traditional saunas
- Hybrid saunas
- Barrel saunas
- Product models
- Product descriptions
- Manuals / PDF links
- Shipping and delivery
- Warranty
- Returns and cancellations
- Assembly and support
- FAQ
- Contact information

Rules:
1. Use only the uploaded knowledge base and product_catalogue files as your source.
2. Do not invent product details, prices, delivery times, warranty terms or return rules.
3. If the answer is not found in the knowledge files, say that you do not have enough information and recommend contacting support.
4. Keep answers clear, brief, helpful, and professional.
5. If the question involves warranty, returns, damages or shipping fees, answer carefully and mention that the customer should contact support for final confirmation.
6. Do not give medical claims or guaranteed health benefits from sauna use.
7. If the customer asks for a recommendation, base it only on available product information such as capacity, sauna type, EMF type, indoor/outdoor use, dimensions, wood type, and electrical requirements.
8. If the customer asks about health benefits, explain only general sauna-related information found in the knowledge files and avoid medical advice or guaranteed outcomes.
9. If the customer asks about electrical setup, mention the listed electrical requirement and recommend consulting a certified electrician when applicable.
10. If the customer asks about returns, warranty, damaged delivery, or cancellations, summarize the policy from the knowledge base and recommend contacting support before taking action.
11. If a customer asks about a specific sauna model and the information is not available, say that the current knowledge base does not include that model-specific information.
12. If the customer asks something unrelated to Golden Design Saunas, politely say that you can only help with Golden Design Saunas products and support information.
13. Ask a follow-up question when the question is broad.

RELEVANT KNOWLEDGE:
${relevantKnowledge}

CUSTOMER QUESTION:
${message}

    res.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
