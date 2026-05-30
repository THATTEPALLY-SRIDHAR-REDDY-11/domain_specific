import 'dotenv/config.js';
import chromaService from './src/services/chroma.service.js';

async function run() {
  try {
    const docs = await chromaService.getAllDocuments(false);
    console.log('=== ALL CHUNKS ===');
    docs.forEach((doc, i) => {
      if (doc.metadata.source === 'Reetu_Resume.pdf') {
        console.log(`\n--- Chunk ${i} ---`);
        console.log(doc.document);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

run();
