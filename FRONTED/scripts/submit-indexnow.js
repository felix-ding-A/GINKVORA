import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY = '75f84d6b9a8c4c1e8f237b60a2b5e0c2';
const HOST = 'ginkvora.com';
const SITEMAP_PATH = path.join(__dirname, '../dist/client/sitemap-0.xml');

async function main() {
  console.log('🚀 Starting IndexNow URL submission...');
  
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`❌ Sitemap file not found at ${SITEMAP_PATH}. Ensure build ran first.`);
    process.exit(0);
  }

  try {
    const xmlContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const urlRegex = /<loc>(https:\/\/ginkvora\.com[^<]*)<\/loc>/g;
    const urls = [];
    let match;
    
    while ((match = urlRegex.exec(xmlContent)) !== null) {
      urls.push(match[1]);
    }

    if (urls.length === 0) {
      console.log('⚠️ No URLs found in sitemap.');
      return;
    }

    console.log(`🔍 Found ${urls.length} URLs in sitemap. Submitting to IndexNow...`);

    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ IndexNow submission successful! Status: ${response.status}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ IndexNow submission failed. Status: ${response.status}, Error: ${errorText}`);
    }
  } catch (err) {
    console.error('❌ Error submitting to IndexNow:', err);
  }
}

main();
