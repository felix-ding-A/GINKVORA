import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY = 'c906fef8759c414e8c55c7393fa38f35';
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

    console.log(`🔍 Found ${normalizedUrls.length} normalized URLs in sitemap. Submitting to IndexNow & Bing API...`);

    // 2. Pre-flight check: ensure key file exists locally in public/ or dist/client/
    const localKeyPath = path.join(__dirname, `../public/${KEY}.txt`);
    const distKeyPath = path.join(__dirname, `../dist/client/${KEY}.txt`);
    const keyUrl = `https://${HOST}/${KEY}.txt`;

    if (!fs.existsSync(localKeyPath) && !fs.existsSync(distKeyPath)) {
      console.warn(`⚠️ IndexNow key file not found locally at ${localKeyPath}. Skipping IndexNow submission.`);
      return;
    }

    // 3. Batch submit via IndexNow (chunks of 50)
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
            const errorBody = await response.text();
            let reason = 'Site not verified';
            try { reason = JSON.parse(errorBody)?.message ?? reason; } catch {}
            console.warn(`⚠️ IndexNow skipped: Bing returned 403 — "${reason}"`);
            return;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ IndexNow batch sent to ${endpoint} returned status ${response.status}: ${errorText}`);
          }
        } catch (endpointErr) {
          console.warn(`⚠️ Failed to send IndexNow batch to ${endpoint}: ${endpointErr.message}`);
        }
      }
    }

    // 4. Direct Bing Webmaster API Batch Submission
    try {
      const bingApiUrl = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${KEY}`;
      const bingPayload = {
        siteUrl: `https://${HOST}/`,
        urlList: normalizedUrls.slice(0, 100) // Submit top URLs within quota
      };
      const bingRes = await fetch(bingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(bingPayload)
      });
      if (bingRes.ok) {
        console.log(`✅ Direct Bing Webmaster API submission successful! Submitting ${bingPayload.urlList.length} URLs.`);
      }
    } catch (bingErr) {
      console.warn(`⚠️ Bing Webmaster Direct API submission note: ${bingErr.message}`);
    }

  } catch (err) {
    console.warn('⚠️ IndexNow submission encountered an error (non-fatal):', err.message);
  }
}

main();

