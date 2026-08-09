import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY = '75f84d6b9a8c4c1e8f237b60a2b5e0c2';
const HOST = 'ginkvora.com';
const SITEMAP_PATH = path.join(__dirname, '../dist/client/sitemap-0.xml');

// IndexNow Endpoints: Bing directly and central IndexNow gateway
const ENDPOINTS = [
  'https://www.bing.com/indexnow',
  'https://api.indexnow.org/indexnow'
];

async function main() {
  console.log('🚀 Starting IndexNow URL submission...');
  
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.warn(`⚠️ Sitemap file not found at ${SITEMAP_PATH}. Skipping IndexNow submission.`);
    return;
  }

  try {
    const xmlContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const urlRegex = /<loc>(https?:\/\/[^<]*)<\/loc>/g;
    const rawUrls = [];
    let match;
    
    while ((match = urlRegex.exec(xmlContent)) !== null) {
      rawUrls.push(match[1]);
    }

    if (rawUrls.length === 0) {
      console.log('⚠️ No URLs found in sitemap. Skipping IndexNow submission.');
      return;
    }

    // 1. Normalize all URLs so their domain strictly matches HOST (ginkvora.com)
    const normalizedUrls = Array.from(new Set(
      rawUrls.map(u => {
        try {
          const parsed = new URL(u);
          parsed.host = HOST;
          parsed.protocol = 'https:';
          return parsed.toString();
        } catch (e) {
          return u;
        }
      })
    ));

    console.log(`🔍 Found ${normalizedUrls.length} normalized URLs in sitemap. Submitting to IndexNow...`);

    // 2. Pre-flight check: ensure the verification key file is publicly reachable
    const keyUrl = `https://${HOST}/${KEY}.txt`;
    try {
      const keyCheck = await fetch(keyUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (!keyCheck.ok) {
        console.warn(`⚠️ IndexNow key file not reachable at ${keyUrl} (status ${keyCheck.status}).`);
        console.warn('   Skipping IndexNow submission for this build — key file must be deployed first.');
        return;
      }
    } catch (e) {
      console.warn(`⚠️ Could not reach key file at ${keyUrl}: ${e.message}`);
      console.warn('   Skipping IndexNow submission.');
      return;
    }

    // 3. Batch submit in chunks of 50 URLs
    const BATCH_SIZE = 50;
    for (let i = 0; i < normalizedUrls.length; i += BATCH_SIZE) {
      const batch = normalizedUrls.slice(i, i + BATCH_SIZE);
      const payload = {
        host: HOST,
        key: KEY,
        keyLocation: keyUrl,
        urlList: batch
      };

      for (const endpoint of ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            console.log(`✅ IndexNow batch (${batch.length} URLs) successfully sent to ${endpoint}! Status: ${response.status}`);
          } else if (response.status === 403) {
            // 403 means site ownership not verified in Bing Webmaster Tools yet — abort early to avoid log spam
            const errorBody = await response.text();
            let reason = 'Site not verified';
            try { reason = JSON.parse(errorBody)?.message ?? reason; } catch {}
            console.warn(`⚠️ IndexNow skipped: Bing returned 403 — "${reason}"`);
            console.warn('   ➜ Complete site verification at https://www.bing.com/webmasters and ensure the IndexNow key matches your verified site.');
            return; // Exit entirely — no point retrying other batches or endpoints
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ IndexNow batch sent to ${endpoint} returned status ${response.status}: ${errorText}`);
          }
        } catch (endpointErr) {
          console.warn(`⚠️ Failed to send IndexNow batch to ${endpoint}: ${endpointErr.message}`);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ IndexNow submission encountered an error (non-fatal):', err.message);
  }
}

main();

