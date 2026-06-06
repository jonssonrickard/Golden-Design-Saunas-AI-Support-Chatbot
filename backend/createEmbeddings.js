import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const generalKnowledgePath = path.join(
  __dirname,
  "../data/golden_design_knowledge_base.md"
);

const productCataloguePath = path.join(
  __dirname,
  "../data/golden_design_product_catalogue.md"
);

const vectorStorePath = path.join(__dirname, "vectorStore.json");

// Read files
const generalKnowledge = fs.readFileSync(generalKnowledgePath, "utf-8");
const productCatalogue = fs.readFileSync(productCataloguePath, "utf-8");

// Simple chunk function
function createChunks(text, sourceName) {
  const sections = text
    .split(/\n\s*\n/)
    .map(section => section.trim())
    .filter(section => section.length > 50);

  return sections.map((section, index) => ({
    id: `${sourceName}-${index + 1}`,
    source: sourceName,
    text: section,
  }));
}

// Create chunks from both files
const chunks = [
  ...createChunks(generalKnowledge, "general_knowledge"),
  ...createChunks(productCatalogue, "product_catalogue"),
];

console.log(`Created ${chunks.length} chunks.`);

// Create embeddings
async function createEmbeddings() {
  const vectorStore = [];

  for (const chunk of chunks) {
    console.log(`Embedding chunk: ${chunk.id}`);

    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk.text,
    });

    vectorStore.push({
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      embedding: embeddingResponse.data[0].embedding,
    });
  }

  fs.writeFileSync(vectorStorePath, JSON.stringify(vectorStore, null, 2));

  console.log("Vector store created successfully.");
  console.log(`Saved to: ${vectorStorePath}`);
}

createEmbeddings();