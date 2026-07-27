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
    console.warn(`⚠️ Sitemap file not found at ${SITEMAP_PATH}. Skipping IndexNow submission.`);
    return;
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
      console.log('⚠️ No URLs found in sitemap. Skipping IndexNow submission.');
      return;
    }

    console.log(`🔍 Found ${urls.length} URLs in sitemap. Submitting to IndexNow...`);

    // First verify the key file is reachable (it may not be during build since
    // the new deployment is not yet live when postbuild runs on Vercel)
    const keyUrl = `https://${HOST}/${KEY}.txt`;
    try {
      const keyCheck = await fetch(keyUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (!keyCheck.ok) {
        console.warn(`⚠️ IndexNow key file not reachable at ${keyUrl} (status ${keyCheck.status}).`);
        console.warn('   This is expected during the FIRST deploy. Skipping IndexNow — will submit on next deploy.');
        return;
      }
    } catch (e) {
      console.warn(`⚠️ Could not reach key file at ${keyUrl}: ${e.message}`);
      console.warn('   Skipping IndexNow submission to avoid a 403 error.');
      return;
    }

    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: keyUrl,
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
      // Treat as a warning — a failed IndexNow ping must never break the deployment
      console.warn(`⚠️ IndexNow submission returned ${response.status}: ${errorText}`);
      console.warn('   Deployment will continue. The sitemap will be crawled normally.');
    }
  } catch (err) {
    console.warn('⚠️ IndexNow submission encountered an error (non-fatal):', err.message);
  }
}

main();
