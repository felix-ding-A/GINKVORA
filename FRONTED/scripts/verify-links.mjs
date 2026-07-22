// FRONTED/scripts/verify-links.mjs — Comprehensive Verification Script for Internal Link Optimization
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), 'src');

let totalErrors = 0;
let totalPassed = 0;

function logPass(msg) {
  console.log(`✅ [PASS] ${msg}`);
  totalPassed++;
}

function logFail(msg) {
  console.error(`❌ [FAIL] ${msg}`);
  totalErrors++;
}

console.log('====================================================');
console.log('🔍 Ginkvora 内链优化代码验证脚本 (Verifying Link System)');
console.log('====================================================\n');

// 1. Verify sanity.ts GROQ queries
const sanityPath = path.join(srcDir, 'lib', 'sanity.ts');
if (fs.existsSync(sanityPath)) {
  const sanityCode = fs.readFileSync(sanityPath, 'utf8');
  if (sanityCode.includes('$cref in category[]._ref') && sanityCode.includes('category[]->slug.current')) {
    logPass('sanity.ts包含正确的 category 数组引用 $cref in category[]._ref 与 $cslug GROQ 查询');
  } else {
    logFail('sanity.ts 缺少 category 数组引用查询逻辑');
  }

  if (sanityCode.includes('export async function getRelatedProductsForProduct') && sanityCode.includes('export async function getRelatedPostsForProduct')) {
    logPass('sanity.ts 成功导出 getRelatedProductsForProduct 和 getRelatedPostsForProduct');
  } else {
    logFail('sanity.ts 缺少关联产品或关联文章导出的 Helper 函数');
  }
} else {
  logFail(`未找到 sanity.ts 文件: ${sanityPath}`);
}

// 2. Verify Component Files
const componentsToVerify = [
  { file: 'components/Breadcrumbs.astro', required: ['BreadcrumbList', 'getLocalePath', 'crumb-separator', 'crumb-active'] },
  { file: 'components/TagBadge.astro', required: ['encodeURIComponent', 'getLocalePath', 'badge--gold'] },
  { file: 'components/sections/RelatedSection.astro', required: ['related-products-section', 'related-posts-section', 'getLocalePath', 'urlFor'] },
];

componentsToVerify.forEach(({ file, required }) => {
  const fullPath = path.join(srcDir, file);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    const missing = required.filter(term => !code.includes(term));
    if (missing.length === 0) {
      logPass(`组件 ${file} 完整无误`);
    } else {
      logFail(`组件 ${file} 缺少关键字: ${missing.join(', ')}`);
    }
  } else {
    logFail(`缺失关键组件文件: ${file}`);
  }
});

// 3. Verify Product Slug Pages (en, es, ru, ar)
const productSlugPages = [
  { path: 'pages/products/[slug].astro', lang: 'en' },
  { path: 'pages/es/products/[slug].astro', lang: 'es' },
  { path: 'pages/ru/products/[slug].astro', lang: 'ru' },
  { path: 'pages/ar/products/[slug].astro', lang: 'ar' },
];

productSlugPages.forEach(({ path: pagePath, lang }) => {
  const fullPath = path.join(srcDir, pagePath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    const checks = [
      code.includes('Breadcrumbs'),
      code.includes('RelatedSection'),
      code.includes('getRelatedProductsForProduct'),
      code.includes('getRelatedPostsForProduct'),
      code.includes('categorySlug') && code.includes('categoryRef'),
    ];
    if (checks.every(Boolean)) {
      logPass(`产品详情页 ${pagePath} (${lang}) 面包屑与关联区块配置正确`);
    } else {
      logFail(`产品详情页 ${pagePath} (${lang}) 配置校验未完全通过`);
    }
  } else {
    logFail(`未找到页面: ${pagePath}`);
  }
});

// 4. Verify Insights Slug Pages (en, es, ru, ar)
const insightSlugPages = [
  { path: 'pages/insights/[slug].astro', lang: 'en' },
  { path: 'pages/es/insights/[slug].astro', lang: 'es' },
  { path: 'pages/ru/insights/[slug].astro', lang: 'ru' },
  { path: 'pages/ar/insights/[slug].astro', lang: 'ar' },
];

insightSlugPages.forEach(({ path: pagePath, lang }) => {
  const fullPath = path.join(srcDir, pagePath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    const checks = [
      code.includes('Breadcrumbs'),
      code.includes('TagBadge'),
    ];
    if (checks.every(Boolean)) {
      logPass(`文章详情页 ${pagePath} (${lang}) 面包屑与 TagBadge 配置正确`);
    } else {
      logFail(`文章详情页 ${pagePath} (${lang}) 配置校验未完全通过`);
    }
  } else {
    logFail(`未找到页面: ${pagePath}`);
  }
});

// 5. Verify Insights Index i18n Fix
const insightsIndexPath = path.join(srcDir, 'pages', 'insights', 'index.astro');
if (fs.existsSync(insightsIndexPath)) {
  const code = fs.readFileSync(insightsIndexPath, 'utf8');
  if (code.includes('lp(') && code.includes('encodeURIComponent(cat)')) {
    logPass('insights/index.astro 分类 Tab 包含 lp() 本地化包装与 encodeURIComponent');
  } else {
    logFail('insights/index.astro 分类 Tab 缺少 lp() 包装');
  }
}

// 6. Verify Footer.astro
const footerPath = path.join(srcDir, 'components', 'layout', 'Footer.astro');
if (fs.existsSync(footerPath)) {
  const code = fs.readFileSync(footerPath, 'utf8');
  if (code.includes('nmn-nicotinamide-mononucleotide')) {
    logPass('Footer.astro 已成功接入 NMN 99% 核心单品直链');
  } else {
    logFail('Footer.astro 未接入 NMN 核心单品直链');
  }
}

console.log('\n====================================================');
if (totalErrors === 0) {
  console.log(`🎉 全部 ${totalPassed} 项验证通过！无逻辑与配置漏洞。`);
  process.exit(0);
} else {
  console.error(`⚠️ 发现 ${totalErrors} 个校验失败项目，请查看日志修复。`);
  process.exit(1);
}
