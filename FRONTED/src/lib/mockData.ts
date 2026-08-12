// src/lib/mockData.ts — High quality B2B mock data fallback
import type { SanityProduct, SanityPost } from './sanity';

export const MOCK_CATEGORIES = [
  { _id: 'cat-1', name: 'Health Supplements', slug: 'health-supplements', description: 'Active pharmaceutical and nutraceutical ingredients.', icon: '💊', color: '#d4a654' },
  { _id: 'cat-2', name: 'Cosmetic Actives', slug: 'cosmetic-actives', description: 'Bioactive compounds for anti-aging and whitening formulas.', icon: '✨', color: '#e07830' },
  { _id: 'cat-3', name: 'Pet Health', slug: 'pet-health', description: 'High-purity ingredients for animal wellness and feeds.', icon: '🐾', color: '#f0c878' },
  { _id: 'cat-4', name: 'Custom Formulation', slug: 'custom-formulation', description: 'Tailored purity levels and custom botanical blends.', icon: '🧪', color: '#c8965a' }
];

export const MOCK_PRODUCTS: (SanityProduct & { description?: any; specifications?: any; coaFile?: any; msdsFile?: any; seo?: any; gallery?: any })[] = [
  {
    _id: 'prod-1',
    name: 'PQQ Disodium Salt',
    slug: 'pqq-disodium-salt',
    category: { name: 'Health Supplements', slug: 'health-supplements' },
    botanicalName: 'Pyrroloquinoline Quinone Disodium Salt',
    purity: '≥ 99%',
    activeIngredient: 'Pyrroloquinoline Quinone',
    casNumber: '122628-50-6',
    shortDescription: 'Premium mitochondrial biogenesis promoter that enhances cognitive function, cardiovascular health, and cellular longevity.',
    description: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Pyrroloquinoline quinone (PQQ) is a novel vitamin-like compound that plays a critical role in cellular energy production, mitochondrial growth, and antioxidant protection. It is widely used in high-end anti-aging supplements, cognitive enhancers, and general longevity formulations.' }] },
      { _type: 'block', style: 'h3', children: [{ _type: 'span', text: 'Key Mechanism of Action' }] },
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'PQQ stimulates the activation of CREB and PGC-1α, key regulators of mitochondrial biogenesis. This results in the growth of new mitochondria within aging cells, effectively reversing mitochondrial decline.' }] }
    ],
    featured: true,
    weight: 9999,
    applications: ['Dietary Supplements', 'Sports Nutrition', 'Longevity Formulations'],
    certifications: ['GMP', 'ISO 9001:2015', 'Halal', 'Kosher'],
    specifications: [
      { label: 'Appearance', value: 'Reddish brown powder' },
      { label: 'Assay (HPLC)', value: '≥ 99.0%' },
      { label: 'Water Content', value: '≤ 12.0%' },
      { label: 'Heavy Metals', value: '≤ 10 ppm' },
      { label: 'Lead (Pb)', value: '≤ 0.5 ppm' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['topical', 'oral'],
    inciName: 'Pyrroloquinoline Quinone Disodium Salt',
    complianceNote: 'REACH registered (cosmetic grade). FDA NDI accepted (food grade).',
    complianceNote_ru: 'Зарегистрировано в REACH (косметический класс). FDA NDI одобрено (пищевой класс).',
    mainCategories: ['liposomal', 'superfood'],
    antiAgingMechanisms: ['collagen-stimulant'],
    applicationDisplay: 'dual',
    faqItems: [
      {
        question: "Is GINKVORA's PQQ Disodium Salt suitable for vegans?",
        answer: "Yes, our PQQ Disodium Salt is produced via microbial fermentation and contains no animal-derived raw materials, making it 100% suitable for vegan formulations."
      },
      {
        question: "What is the shelf life of this product?",
        answer: "The shelf life is 24 months when stored in the original unopened container in a cool, dry place away from direct sunlight."
      }
    ],
    faqItems_ru: [
      {
        question: "Подходит ли PQQ двунатриевая соль от GINKVORA для веганов?",
        answer: "Да, наша двунатриевая соль PQQ производится путем микробной ферментации и не содержит сырья животного происхождения, что делает ее на 100% пригодной для веганских рецептур."
      },
      {
        question: "Каков срок годности этого продукта?",
        answer: "Срок годности составляет 24 месяца при хранении в оригинальной закрытой упаковке в прохладном, сухом месте, защищенном от прямых солнечных лучей."
      }
    ]
  },
  {
    _id: 'prod-2',
    name: 'NMN Beta-Nicotinamide Mononucleotide',
    slug: 'nmn-nicotinamide-mononucleotide',
    category: { name: 'Health Supplements', slug: 'health-supplements' },
    botanicalName: 'Beta-Nicotinamide Mononucleotide',
    purity: '≥ 99.5%',
    activeIngredient: 'NMN',
    casNumber: '1094-61-7',
    shortDescription: 'Direct NAD+ precursor that boosts cellular energy levels, enhances DNA repair mechanisms, and supports healthy aging pathways.',
    description: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'NMN is the direct precursor to NAD+, the vital coenzyme required for sirtuin activation, DNA repair, and energy metabolism. As we age, cellular NAD+ levels decline drastically, leading to age-associated physiological decline.' }] }
    ],
    featured: true,
    weight: 9900,
    applications: ['Dietary Supplements', 'Anti-Aging Formulas', 'Nutraceuticals'],
    certifications: ['GMP', 'ISO 9001:2015', 'Vegan', 'Non-GMO'],
    specifications: [
      { label: 'Appearance', value: 'White crystalline powder' },
      { label: 'Assay (HPLC)', value: '≥ 99.5%' },
      { label: 'Loss on Drying', value: '≤ 1.0%' },
      { label: 'Tap Density', value: '≥ 0.35 g/ml' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['topical', 'oral'],
    inciName: 'Nicotinamide Mononucleotide',
    complianceNote: 'REACH pre-registered. Safe for cosmetic formulations & dietary supplements.',
    complianceNote_ru: 'Предварительно зарегистрировано в REACH. Безопасно для косметики и пищевых добавок.',
    mainCategories: ['liposomal'],
    antiAgingMechanisms: ['collagen-stimulant'],
    applicationDisplay: 'dual',
    faqItems: [
      {
        question: "What is the recommended storage temperature for NMN powder?",
        answer: "For long-term storage, we recommend keeping NMN powder at 2-8°C (refrigerated) in a tightly sealed container, protected from moisture and light, to ensure maximum stability."
      },
      {
        question: "Can GINKVORA supply NMN in bulk quantities?",
        answer: "Yes, we support commercial orders from 1kg trials up to multi-ton container shipments. Packaging options include standard 25kg fiber drums."
      }
    ],
    faqItems_ru: [
      {
        question: "Какова рекомендуемая температура хранения порошка NMN?",
        answer: "Для длительного хранения мы рекомендуем хранить порошок NMN при температуре 2-8°C (в холодильнике) в герметично закрытом контейнере, защищенном от влаги и света, для обеспечения максимальной стабильности."
      },
      {
        question: "Может ли GINKVORA поставлять NMN оптом?",
        answer: "Да, мы поддерживаем коммерческие заказы от пробных партий в 1 кг до контейнерных перевозок весом в несколько тонн. Варианты упаковки включают стандартные фибровые барабаны по 25 кг."
      }
    ]
  },
  {
    _id: 'prod-3',
    name: 'Glabridin 40%',
    slug: 'glabridin',
    category: { name: 'Cosmetic Actives', slug: 'cosmetic-actives' },
    botanicalName: 'Glycyrrhiza glabra extract',
    purity: '40% Glabridin',
    activeIngredient: 'Glabridin',
    casNumber: '59870-68-7',
    shortDescription: 'Premium natural skin whitening agent extracted from Licorice Root. Highly effective at inhibiting tyrosinase and reducing melanin.',
    description: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Glabridin is a premium cosmetic active renowned as "the gold of whitening". It is extracted from the roots of Glycyrrhiza glabra and provides powerful melanin inhibition, skin lightening, and anti-inflammatory properties.' }] }
    ],
    featured: true,
    weight: 9000,
    applications: ['Cosmetics & Skincare', 'Creams & Serums', 'Skin Brightening'],
    certifications: ['Organic', 'ISO 9001:2015', 'Vegan'],
    specifications: [
      { label: 'Appearance', value: 'Light yellow-brown powder' },
      { label: 'Assay (HPLC)', value: '≥ 40.0% Glabridin' },
      { label: 'Loss on Drying', value: '≤ 5.0%' },
      { label: 'Residue on Ignition', value: '≤ 1.0%' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['topical'],
    inciName: 'Glycyrrhiza Glabra (Licorice) Root Extract',
    complianceNote: 'Fully REACH compliant cosmetic active ingredient. ECOCERT certified organic source.',
    complianceNote_ru: 'Полностью соответствует REACH. Органический источник, сертифицированный ECOCERT.',
    mainCategories: ['cosmetic-ingredients'],
    antiAgingMechanisms: ['mmp-inhibitor', 'anti-glycation'],
    applicationDisplay: 'topical'
  },
  {
    _id: 'prod-4',
    name: 'EGCG 98%',
    slug: 'egcg-epigallocatechin-gallate',
    category: { name: 'Dual-Use', slug: 'cosmetic-actives' },
    botanicalName: 'Epigallocatechin Gallate',
    purity: '≥ 98%',
    activeIngredient: 'Green Tea Catechins',
    casNumber: '989-51-5',
    shortDescription: 'The most active antioxidant catechin in Green Tea. Promotes fat oxidation, supports cardiovascular health, and protects cells.',
    description: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Epigallocatechin Gallate (EGCG) is the dominant catechin found in green tea. It is a powerful natural antioxidant used extensively in fat burner formulas, cardioprotective supplements, and premium cosmetic formulations.' }] }
    ],
    featured: false,
    applications: ['Dietary Supplements', 'Cosmetics & Skincare', 'Functional Beverages'],
    certifications: ['GMP', 'ISO 9001:2015', 'Halal', 'Kosher'],
    specifications: [
      { label: 'Appearance', value: 'White to off-white powder' },
      { label: 'Assay (HPLC)', value: '≥ 98.0%' },
      { label: 'Loss on Drying', value: '≤ 5.0%' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['topical', 'oral'],
    inciName: 'Epigallocatechin Gallate',
    complianceNote: 'REACH pre-registered for cosmetics. Non-GMO food grade certified.',
    complianceNote_ru: 'Предварительно зарегистрировано в REACH. Сертифицировано без ГМО (пищевой класс).',
    mainCategories: ['superfood'],
    antiAgingMechanisms: ['anti-glycation'],
    applicationDisplay: 'dual'
  },
  {
    _id: 'prod-5',
    name: 'Luteolin 98%',
    slug: 'luteolin',
    category: { name: 'Health Supplements', slug: 'health-supplements' },
    botanicalName: 'Luteolin',
    purity: '≥ 98%',
    activeIngredient: 'Luteolin',
    casNumber: '491-70-3',
    shortDescription: 'Natural flavonoid with powerful antioxidant, anti-inflammatory, and neuroprotective qualities. Ideal for longevity supplements.',
    featured: false,
    applications: ['Dietary Supplements', 'Cognitive Support', 'Anti-Inflammatory Products'],
    certifications: ['GMP', 'ISO 9001:2015'],
    specifications: [
      { label: 'Appearance', value: 'Light yellow crystalline powder' },
      { label: 'Assay (HPLC)', value: '≥ 98.0%' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['topical', 'oral'],
    inciName: 'Luteolin',
    complianceNote: '98%+ high purity. Certified food grade & cosmetic active.',
    complianceNote_ru: 'Высокая чистота 98%+. Сертифицировано как пищевой класс и косметический актив.',
    mainCategories: ['superfood'],
    antiAgingMechanisms: ['mmp-inhibitor'],
    applicationDisplay: 'dual'
  },
  {
    _id: 'prod-6',
    name: 'Flavone 99%',
    slug: 'flavone',
    category: { name: 'Health Supplements', slug: 'health-supplements' },
    botanicalName: '2-Phenyl-4H-chromen-4-one',
    purity: '≥ 99%',
    activeIngredient: 'Flavone',
    casNumber: '525-82-6',
    shortDescription: 'Core flavonoid skeleton compound, utilized heavily in scientific research, pharmaceutical development, and specialized supplements.',
    featured: false,
    applications: ['Pharmaceuticals', 'Nutraceuticals', 'Scientific Research'],
    certifications: ['GMP', 'ISO 9001:2015'],
    specifications: [
      { label: 'Appearance', value: 'White or off-white needle crystals' },
      { label: 'Assay (HPLC)', value: '≥ 99.0%' }
    ],
    coaFile: { asset: { url: '#' } },
    msdsFile: { asset: { url: '#' } },
    application: ['oral'],
    inciName: 'Flavone',
    complianceNote: 'Research & formulation grade. B2B bulk standard.',
    complianceNote_ru: 'Для исследовательских и рецептурных целей. B2B стандарт.',
    mainCategories: ['superfood'],
    antiAgingMechanisms: ['anti-glycation'],
    applicationDisplay: 'oral'
  }
];

export const MOCK_POSTS: SanityPost[] = [
  {
    _id: '6a54175c-2ba3-40e9-8482-0907920d4a48',
    title: 'NMN, NMNH, NAD+: Navigating the Global NAD Precursor Market',
    slug: 'nmn-nmnh-nad-global-market-trends',
    excerpt: 'The global NMN market earned about $380M in 2025, but the real story is regulatory fragmentation reshaping supply chains. My market analysis across the US, China, Japan, and EU, and where NMNH fits into the next cycle.',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2026-06-09T05:41:00.000Z',
    updatedAt: '2026-06-09T05:41:00.000Z',
    tags: ['Market Trends', 'Research', 'Regulatory'],
    readTime: 17,
    author: {
      name: 'Zhang Zhilin',
      credentials: 'B.S.'
    },
    meta_title: 'NMN NMNH NAD+ Market: NR vs NMN, Purity & Strategy',
    meta_description: 'NMN global market $380M. NR vs NMN comparison, purity benchmarks (HPLC, heavy metals, endotoxin), NMNH next-gen NAD+ precursor, resveratrol synergy.'
  },
  {
    _id: '78115189-c9c5-4b3b-ba42-cd494048d5e5',
    title: "PQQ: The Market's Most Underrated Mitochondrial Molecule",
    slug: 'pqq-mitochondrial-health-market-trend',
    excerpt: 'PQQ is rare among mitochondrial actives — it both protects existing mitochondria and triggers new mitochondrial biogenesis. At $47.7M, the PQQ market is 1/16th the size of CoQ10. That ratio is not a failure — it is a timing signal.',
    coverImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2026-06-05T01:21:00.000Z',
    updatedAt: '2026-06-05T01:25:00.000Z',
    tags: ['Market Trends', 'Ingredient Spotlight'],
    readTime: 14,
    author: {
      name: 'Zhang Zhilin',
      credentials: 'B.S.'
    },
    meta_title: 'PQQ Mitochondrial Health: Market Opportunity Analysis | GINKVORA',
    meta_description: 'PQQ triggers mitochondrial biogenesis via PGC-1α and protects via Nrf2. Market analysis with verified data: $47.7M PQQ vs $760M CoQ10. Strategy for brand owners.'
  },
  {
    _id: '55dfc21f-4df2-4237-a440-052d8026ec73',
    title: 'Glabridin Before and After: A 12-Week Transformation Timeline',
    slug: 'glabridin-12-week-timeline',
    excerpt: "Glabridin doesn't work overnight — that's exactly why it's effective. Week-by-week timeline of melanin, inflammation, and collagen changes, so you can set accurate customer expectations and keep them using your product past week 3.",
    coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2025-12-04T04:45:00.000Z',
    updatedAt: '2025-12-04T04:45:00.000Z',
    tags: ['Industry News', 'Ingredient Spotlight', 'Research', 'Quality & Testing', 'Formulation Tips'],
    readTime: 12,
    author: {
      name: 'Clara Wang',
      credentials: 'M.S.'
    },
    meta_title: 'Glabridin Before and After: 12-Week Brightening Timeline',
    meta_description: 'What happens to melanin, inflammation, and collagen each week when glabridin enters a formula. Week-by-week biological timeline for cosmetic formulators.'
  },
  {
    _id: '9e03963f-b30e-47b7-a409-de2ffb4dd554',
    title: "GHK-Cu Copper Peptide: A Formulator's Technical Guide",
    slug: 'ghk-cu-formulation-technical-guide',
    excerpt: 'GHK-Cu looks simple — until you formulate it. My lab-level guide to keeping this copper peptide stable across serums, creams, gels, eye creams, and scalp products.',
    coverImage: 'https://images.unsplash.com/photo-1512290900676-26c2a4d0b5ae?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2026-06-08T02:32:00.000Z',
    updatedAt: '2026-06-08T02:32:00.000Z',
    tags: ['Ingredient Spotlight', 'Formulation Tips', 'Research'],
    readTime: 17,
    author: {
      name: 'Clara Wang',
      credentials: 'M.S.'
    },
    meta_title: "GHK-Cu Copper Peptide: Formulator's Technical Guide",
    meta_description: 'GHK-Cu formulation: serums, creams, gels, eye creams, hair growth products. pH control, ingredient compatibility, copper verification, sourcing checklist.'
  },
  {
    _id: '05f06e32-255c-41e9-a430-83decd96add8',
    title: 'Free Radicals vs. Quercetin: The Antioxidant Mechanism Explained for Non-Scientists',
    slug: 'quercetin-antioxidant-free-radicals',
    excerpt: 'Free radicals cause 10,000+ daily oxidative strikes, accelerating aging. Quercetin combats this by directly scavenging reactive molecules and activating the Nrf2 pathway—outperforming Vitamin C and E in ORAC capacity.',
    coverImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2026-05-14T01:18:00.000Z',
    updatedAt: '2026-07-02T01:12:43.000Z',
    tags: ['Ingredient Spotlight', 'Research', 'Formulation Tips'],
    readTime: 8,
    author: {
      name: 'Clara Wang',
      credentials: 'M.S.'
    },
    meta_title: 'Quercetin Antioxidant Benefits: Free Radical & Nrf2 Defense…',
    meta_description: 'Quercetin combats oxidative stress by scavenging free radicals and activating the Nrf2 pathway. Outperforms Vitamins C and E in ORAC capacity.'
  },
  {
    _id: '08fa644d-8c46-42a5-9e85-0dbde5147508',
    title: 'What Is NMN? A Raw-Material Scientist Breaks Down the Mechanism',
    slug: 'nmn-mechanism',
    excerpt: "NMN is a direct NAD+ precursor with real mechanism but honest limits. A raw-material scientist explains what it is, how it's absorbed, what the data prove, and how to buy it well.",
    coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80' as any,
    featured: true,
    publishedAt: '2026-07-08T01:59:00.000Z',
    updatedAt: '2026-07-08T01:59:00.000Z',
    tags: ['Ingredient Spotlight', 'Research', 'Longevity', 'NAD+', 'Formulation Tips'],
    readTime: 8,
    author: {
      name: 'Clara Wang',
      credentials: 'M.S.'
    },
    meta_title: 'What Is NMN? The Mechanism, Honestly',
    meta_description: "NMN is a direct NAD+ precursor. A raw-material scientist explains how it's absorbed, what human trials prove, and how to choose raw material."
  }
];

export const MOCK_SITE_SETTINGS = {
  siteName: 'GINKVORA',
  tagline: 'Pure Nature, Proven Science',
  contactEmail: 'inquiry@ginkvora.com',
  phone: '+86 13201818603',
  address: {
    street: 'Xi\'an International Trade & Logistics Park',
    city: 'Xi\'an',
    country: 'China'
  },
  certifications: [
    { name: 'ISO 9001:2015', href: '#' },
    { name: 'GMP', href: '#' },
    { name: 'Halal', href: '#' },
    { name: 'Kosher', href: '#' },
    { name: 'Organic', href: '#' }
  ],
  stats: [
    { value: '500', suffix: '+', label: 'Active Ingredients' },
    { value: '3', suffix: '+', label: 'Years of Expertise' },
    { value: '50', suffix: '+', label: 'Countries Served' },
    { value: '99', suffix: '%', label: 'Purity Standard' }
  ]
};

export const MOCK_AUTHORS = [
  {
    _id: 'author-1',
    name: 'Clara Wang',
    title: 'Lead Scientific Formulation Specialist',
    title_ru: 'Ведущий специалист по научным рецептурам',
    credentials: 'M.S.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    bio: 'Specializing in bioactive extraction, cellular delivery mechanisms, and anti-aging ingredient formulation.',
    bio_ru: 'Специализируется на экстракции биоактивных веществ, механизмах клеточной доставки и рецептурах антивозрастных ингредиентов.'
  },
  {
    _id: 'author-2',
    name: 'Zhang Zhilin',
    title: 'Senior Ingredient & Market Analyst',
    title_ru: 'Старший аналитик ингредиентов и рынка',
    credentials: 'B.S.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Focusing on global botanical ingredient supply chains, market trends, and regulatory compliance.',
    bio_ru: 'Фокусируется на глобальных цепочках поставок растительных ингредиентов, рыночных тенденциях и нормативном соответствии.'
  },
  {
    _id: 'author-3',
    name: 'Atwood Wang',
    title: 'Global Regulatory & Compliance Director',
    title_ru: 'Директор по глобальному регулированию и комплаенсу',
    credentials: 'RAC, MS in Global Regulatory Affairs',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Expert in FDA GRAS, EU Novel Food, REACH compliance, and global supplement regulations.',
    bio_ru: 'Эксперт в области FDA GRAS, EU Novel Food, соответствия REACH и глобального регулирования пищевых добавок.'
  },
  {
    _id: 'author-4',
    name: 'Dr. Mia Chen',
    title: 'Head of Quality Assurance & Purity Validation',
    title_ru: 'Руководитель отдела контроля качества и валидации чистоты',
    credentials: 'PhD in Analytical Chemistry, CQE',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    bio: 'Specializing in HPLC chromatography, heavy metal testing, and cGMP quality control standards.',
    bio_ru: 'Специализируется на ВЭЖХ хроматографии, тестировании тяжелых металлов и стандартах контроля качества cGMP.'
  }
];

