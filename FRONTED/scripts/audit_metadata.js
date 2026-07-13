import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('scripts/sanity_dump.json', 'utf8'));

const langs = ['en', 'ru', 'es', 'ar'];

let out = "";
const log = (msg) => { out += msg + "\n"; };

log("=== AUDITING PRODUCTS ===");
dump.products.forEach(p => {
  const missing = [];
  langs.forEach(l => {
    const titleKey = l === 'en' ? 'meta_title' : `meta_title_${l}`;
    const descKey = l === 'en' ? 'meta_description' : `meta_description_${l}`;
    if (!p[titleKey] || !p[titleKey].trim()) {
      missing.push(`title_${l}`);
    }
    if (!p[descKey] || !p[descKey].trim()) {
      missing.push(`desc_${l}`);
    }
  });
  if (missing.length > 0) {
    log(`Product: ${p.name} (${p.slug}) - Missing: ${missing.join(', ')}`);
  }
});

log("\n=== AUDITING POSTS ===");
dump.posts.forEach(p => {
  const missing = [];
  langs.forEach(l => {
    const titleKey = l === 'en' ? 'meta_title' : `meta_title_${l}`;
    const descKey = l === 'en' ? 'meta_description' : `meta_description_${l}`;
    if (!p[titleKey] || !p[titleKey].trim()) {
      missing.push(`title_${l}`);
    }
    if (!p[descKey] || !p[descKey].trim()) {
      missing.push(`desc_${l}`);
    }
  });
  if (missing.length > 0) {
    log(`Post: ${p.title} (${p.slug}) - Missing: ${missing.join(', ')}`);
  }
});

log("\n=== SEARCHING FOR RUSSIAN GLABRIDIN / QUERCETIN POSTS ===");
const ruGlabridin = [];
const ruQuercetin = [];
dump.posts.forEach(p => {
  const slug = p.slug || '';
  const title = p.title || '';
  const titleRu = p.meta_title_ru || '';
  const descRu = p.meta_description_ru || '';
  
  const isGlabridin = slug.includes('glabridin') || title.toLowerCase().includes('glabridin') || (titleRu && titleRu.toLowerCase().includes('глабридин')) || (descRu && descRu.toLowerCase().includes('глабридин'));
  const isQuercetin = slug.includes('quercetin') || title.toLowerCase().includes('quercetin') || (titleRu && titleRu.toLowerCase().includes('кверцетин')) || (descRu && descRu.toLowerCase().includes('кверцетин'));

  if (isGlabridin) {
    ruGlabridin.push({ slug, title, titleRu, descRu });
  }
  if (isQuercetin) {
    ruQuercetin.push({ slug, title, titleRu, descRu });
  }
});

log(`\nGlabridin related posts (${ruGlabridin.length}):`);
ruGlabridin.forEach(item => {
  log(`- Slug: ${item.slug}\n  Title: ${item.title}\n  Title (RU): ${item.titleRu}\n  Desc (RU): ${item.descRu}`);
});

log(`\nQuercetin related posts (${ruQuercetin.length}):`);
ruQuercetin.forEach(item => {
  log(`- Slug: ${item.slug}\n  Title: ${item.title}\n  Title (RU): ${item.titleRu}\n  Desc (RU): ${item.descRu}`);
});

fs.writeFileSync('scripts/audit_metadata_result.txt', out, 'utf8');
console.log("Written audit to scripts/audit_metadata_result.txt!");
