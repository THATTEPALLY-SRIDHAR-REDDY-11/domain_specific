import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
import { ChromaClient } from 'chromadb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chroma = new ChromaClient({
  path: process.env.CHROMA_URL,
  auth: {
    provider: "token",
    credentials: process.env.CHROMA_API_KEY,
    tokenHeaderType: "X_CHROMA_TOKEN",
  },
  tenant: process.env.CHROMA_TENANT || "default_tenant",
  database: process.env.CHROMA_DATABASE || "default_database",
});

const collectionName = process.env.COLLECTION_NAME;

async function checkCollection() {
  try {
    console.log("Connecting to ChromaDB...");
    console.log("Collection:", collectionName);
    const collections = await chroma.listCollections();
    console.log("Available collections:", collections.map(c => c.name));

    const collection = await chroma.getCollection({ name: collectionName });
    console.log("Collection found!");
    const count = await collection.count();
    console.log("Number of items in collection:", count);

    const items = await collection.get({ limit: 10, include: ['metadatas', 'documents'] });
    console.log("Sample items (first 10):");
    items.metadatas.forEach((meta, i) => {
      console.log(`  ${i+1}. Source: ${meta.source}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkCollection();
