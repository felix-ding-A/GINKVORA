import fs from 'fs';
import path from 'path';
import { createClient } from '@sanity/client';

// Read .env file manually
const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
});

async function main() {
  console.log("Fetching products...");
  const products = await client.fetch(`*[_type == "product"] {
    _id,
    name,
    "slug": slug.current,
    meta_title,
    meta_description,
    meta_title_ru,
    meta_description_ru,
    meta_title_es,
    meta_description_es,
    meta_title_ar,
    meta_description_ar
  }`);

  console.log("Fetching posts...");
  const posts = await client.fetch(`*[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    meta_title,
    meta_description,
    meta_title_ru,
    meta_description_ru,
    meta_title_es,
    meta_description_es,
    meta_title_ar,
    meta_description_ar
  }`);

  const dump = { products, posts };
  fs.writeFileSync('scripts/sanity_dump.json', JSON.stringify(dump, null, 2), 'utf8');
  console.log("Dumped to scripts/sanity_dump.json successfully in UTF-8!");
}

main().catch(console.error);
