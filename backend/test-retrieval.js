import 'dotenv/config.js';
import hybridSearchService from './src/services/hybrid.service.js';

async function test(query, filters = null) {
  console.log(`\n========================================`);
  console.log(`Testing query: "${query}"`);
  if (filters) {
    console.log(`Filters:`, JSON.stringify(filters));
  } else {
    console.log(`Filters: None`);
  }
  console.log(`========================================`);

  try {
    const results = await hybridSearchService.search(query, 5, filters);
    console.log(`Retrieved ${results.length} documents:`);
    results.forEach((res, idx) => {
      console.log(`  [${idx + 1}] Source: ${res.metadata.source} | Method: ${res.retrievalMethod} | RRF Score: ${res.rrfScore}`);
      console.log(`      Content snippet: "${res.document.substring(0, 80).replace(/\n/g, ' ')}..."`);
    });
  } catch (err) {
    console.error('Test Failed with error:', err);
  }
}

async function main() {
  // Test 1: Insurance claims query without filters
  await test('How to handle insurance claims?');

  // Test 2: Insurance claims query with multiple file filters (using $in)
  await test('How to handle insurance claims?', {
    source: { "$in": ["46-Health-Insurance-Claims-Guide.md", "47-Insurance-Coverage-Policies.md"] }
  });
}

main();