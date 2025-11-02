
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the frontend directory
dotenv.config({ path: path.resolve(process.cwd(), 'frontend', '.env') });

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.GOOGLE_API_KEY) {
  throw new Error(
    'Missing required environment variables. Please check your .env file.'
  );
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to chunk text
function chunkText(text: string, chunkSize = 1500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to generate embeddings using Google AI API directly
async function generateEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text }]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

async function main() {
  const filePaths = [
    '/Users/diyakote/Downloads/dataset/train.pr_commits_20_400_100_0.5_nltk.csv',
    '/Users/diyakote/Downloads/dataset/test.pr_commits_20_400_100_0.5_nltk.csv',
    '/Users/diyakote/Downloads/dataset/valid.pr_commits_20_400_100_0.5_nltk.csv',
  ];

  const MAX_ROWS = 10000; // Limit total rows to process
  let totalProcessed = 0;
  let totalRows = 0;

  for (const filePath of filePaths) {
    if (totalRows >= MAX_ROWS) {
      console.log(`\nReached maximum of ${MAX_ROWS} rows. Stopping.`);
      break;
    }

    console.log(`\nProcessing ${filePath}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as { abstract: string; article: string }[];
    const rowsToProcess = Math.min(rows.length, MAX_ROWS - totalRows);
    console.log(`Found ${rows.length} rows in file. Processing ${rowsToProcess} rows.`);

    for (let i = 0; i < rowsToProcess; i++) {
      const row = rows[i];
      if (!row.abstract || !row.article) continue;
      
      const content = `${row.abstract}\n${row.article}`;
      const chunks = chunkText(content);

      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        try {
          const embedding = await generateEmbedding(chunk);

          const { error } = await supabase.from('documents').insert({
            content: chunk,
            embedding: embedding,
          });

          if (error) {
            console.error('Error inserting data:', error);
          } else {
            totalProcessed++;
            if (totalProcessed % 10 === 0) {
              console.log(`Processed ${totalProcessed} chunks so far...`);
            }
          }
        } catch (e) {
          console.error('Error generating embedding or inserting data:', e);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      totalRows++;
    }
  }

  console.log(`\nAll files processed! Total rows: ${totalRows}, Total chunks embedded: ${totalProcessed}`);
}

main().catch(console.error);

