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
    msdsFile: { asset: { url: '#' } }
  },
  {
    _id: 'prod-2',
    name: 'NMN Beta-Nicotinamide Mononucleotide',
    slug: 'nmn-beta-nicotinamide-mononucleotide',
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
    applications: ['Dietary Supplements', 'Anti-Aging Formulas', 'Nutraceuticals'],
    certifications: ['GMP', 'ISO 9001:2015', 'Vegan', 'Non-GMO'],
    specifications: [
      { label: 'Appearance', value: 'White crystalline powder' },
      { label: 'Assay (HPLC)', value: '≥ 99.5%' },
      { label: 'Loss on Drying', value: '≤ 1.0%' },
      { label: 'Tap Density', value: '≥ 0.35 g/ml' }
    ]
  },
  {
    _id: 'prod-3',
    name: 'Glabridin 40%',
    slug: 'glabridin-40',
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
    applications: ['Cosmetics & Skincare', 'Creams & Serums', 'Skin Brightening'],
    certifications: ['Organic', 'ISO 9001:2015', 'Vegan'],
    specifications: [
      { label: 'Appearance', value: 'Light yellow-brown powder' },
      { label: 'Assay (HPLC)', value: '≥ 40.0% Glabridin' },
      { label: 'Loss on Drying', value: '≤ 5.0%' },
      { label: 'Residue on Ignition', value: '≤ 1.0%' }
    ]
  },
  {
    _id: 'prod-4',
    name: 'EGCG 98%',
    slug: 'egcg-98',
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
    ]
  },
  {
    _id: 'prod-5',
    name: 'Luteolin 98%',
    slug: 'luteolin-98',
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
    ]
  },
  {
    _id: 'prod-6',
    name: 'Flavone 99%',
    slug: 'flavone-99',
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
    ]
  }
];

export const MOCK_POSTS: SanityPost[] = [
  {
    _id: 'post-1',
    title: 'Mitochondrial Health: The Science Behind PQQ and Healthy Aging',
    slug: 'mitochondrial-health-pqq-science',
    excerpt: 'Explore how Pyrroloquinoline Quinone (PQQ) triggers mitochondrial biogenesis and its potential as a cornerstone ingredient for longevity formulas.',
    coverImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80' as any,
    publishedAt: '2026-05-15T12:00:00Z',
    tags: ['Ingredient Spotlight', 'Research', 'Market Trends'],
    readTime: 5
  },
  {
    _id: 'post-2',
    title: 'Global Nutraceutical Regulatory Trends: What Brands Need to Know',
    slug: 'global-nutraceutical-regulatory-trends',
    excerpt: 'An overview of shifting import regulations, purity certifications, and compliance standards for botanicals in USA, EU, and China markets.',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' as any,
    publishedAt: '2026-05-10T12:00:00Z',
    tags: ['Regulatory', 'Industry News'],
    readTime: 7
  },
  {
    _id: 'post-3',
    title: 'Why Glabridin is Leading the Natural Skin Brightening Market',
    slug: 'why-glabridin-leads-natural-skin-brightening',
    excerpt: 'Often called "the gold of whitening", Glabridin has become the preferred active for premium clean cosmetics. Here is why.',
    coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80' as any,
    publishedAt: '2026-05-02T12:00:00Z',
    tags: ['Ingredient Spotlight', 'Formulation Tips'],
    readTime: 4
  }
];

export const MOCK_SITE_SETTINGS = {
  siteName: 'GINKVORA',
  tagline: 'Pure Nature, Proven Science',
  contactEmail: 'inquiry@ginkvora.com',
  phone: '+86 (0571) 8888-8888',
  address: {
    street: '188 Botanical Extract Boulevard, Technology District',
    city: 'Hangzhou, Zhejiang',
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
