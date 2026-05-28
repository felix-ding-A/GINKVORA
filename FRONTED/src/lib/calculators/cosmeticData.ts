/**
 * Cosmetic formulation HLB database, regulatory limits, and classical recipe templates (English Optimized)
 */

export interface CosmeticIngredientLimit {
  nameCn: string;
  nameEn: string;
  maxUsagePct: number; // Regulatory maximum usage percentage (%)
  ref: string; // Reference rule
}

// Common active ingredients and preservative limits
export const REGULATORY_LIMITS: Record<string, CosmeticIngredientLimit> = {
  'Phenoxyethanol': { nameCn: 'Phenoxyethanol', nameEn: 'Phenoxyethanol', maxUsagePct: 1.0, ref: 'Safety Technical Standards for Cosmetics (2015) Preservatives Table' },
  'Salicylic Acid': { nameCn: 'Salicylic Acid', nameEn: 'Salicylic Acid', maxUsagePct: 2.0, ref: 'Maximum limit for leave-on and rinse-off products (2.0%)' },
  'Niacinamide': { nameCn: 'Niacinamide', nameEn: 'Niacinamide', maxUsagePct: 5.0, ref: 'Industry standard for mild skin barrier repair limit (5.0%)' },
  'Retinol': { nameCn: 'Retinol', nameEn: 'Retinol', maxUsagePct: 1.0, ref: 'Maximum limit for high-activity anti-aging' },
  'Dipotassium Glycyrrhizinate': { nameCn: 'Dipotassium Glycyrrhizinate', nameEn: 'Dipotassium Glycyrrhizinate', maxUsagePct: 0.5, ref: 'Recommended limit for soothing/anti-inflammation (0.5%)' },
  'Methylisothiazolinone': { nameCn: 'Methylisothiazolinone', nameEn: 'Methylisothiazolinone', maxUsagePct: 0.01, ref: 'Prohibited in leave-on, maximum 0.01% in rinse-off' }
};

// Required HLB values of common oils
export const OIL_HLB_VALUES: Record<string, number> = {
  'GTCC (Caprylic/Capric Triglyceride)': 5.0,
  'Squalane': 11.0,
  'Cetyl/Cetearyl Alcohol': 15.5,
  'Shea Butter': 8.0,
  'Mineral Oil': 10.5,
  'Beeswax': 12.0,
  'Jojoba Oil': 6.5,
  'Sweet Almond Oil': 7.0,
  'Olive Oil': 7.0,
  'Isohexadecane': 7.5,
  'Dimethicone / D5': 7.5
};

// HLB values of common emulsifiers
export const EMULSIFIER_HLB: Record<string, number> = {
  'Tween 80': 15.0,
  'Span 80': 4.3,
  'Tween 60': 14.9,
  'Span 60': 4.7,
  'Tween 20': 16.7,
  'Span 20': 8.6,
  'Glyceryl Monostearate (GMS)': 3.8,
  'PEG-100 Stearate': 18.8,
  'Montanov 68': 8.0,
  'Montanov 202': 9.0
};

export interface CosmeticIngredientPreset {
  name: string;
  percentage: number;
  type: 'solvent' | 'humectant' | 'thickener' | 'emollient' | 'emulsifier' | 'active' | 'preservative' | 'fragrance' | 'pH_adjuster' | 'chelator';
}

export interface CosmeticTemplate {
  name: string;
  nameCn: string;
  phases: Record<string, CosmeticIngredientPreset[]>;
  targetWeight: number; // Default sample weight (g)
  desc: string;
}

// Classical cosmetic formulation templates
export const COSMETIC_TEMPLATES: Record<string, CosmeticTemplate> = {
  serum: {
    name: 'Standard Hyaluronic & Niacinamide Serum',
    nameCn: 'Hyaluronic & Niacinamide Serum Template',
    targetWeight: 100, // 100g
    desc: 'O/W water-soluble system. Niacinamide brightens skin, multi-molecular weight sodium hyaluronate moisturizes, providing a fresh skin feel.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 86.35, type: 'solvent' },
        { name: 'Glycerin', percentage: 5.0, type: 'humectant' },
        { name: 'Butylene Glycol', percentage: 3.0, type: 'humectant' },
        { name: 'Xanthan Gum', percentage: 0.15, type: 'thickener' },
        { name: 'EDTA-2Na', percentage: 0.05, type: 'chelator' }
      ],
      'Phase B (Oil Phase / Emulsification)': [], // Serums typically have no oil phase
      'Phase C (Active Ingredients)': [
        { name: 'Niacinamide', percentage: 3.0, type: 'active' },
        { name: 'Sodium Hyaluronate', percentage: 0.1, type: 'active' },
        { name: '1,2-Hexanediol', percentage: 0.8, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 0.9, type: 'preservative' }
      ]
    }
  },
  cream: {
    name: 'O/W Moisturising Face Cream',
    nameCn: 'O/W Soothing & Moisturising Cream Template',
    targetWeight: 50, // 50g
    desc: 'Classic O/W face cream emulsion. GTCC + Squalane as emollients with compound emulsifiers.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 73.8, type: 'solvent' },
        { name: 'Glycerin', percentage: 5.0, type: 'humectant' },
        { name: 'Carbomer', percentage: 0.2, type: 'thickener' }
      ],
      'Phase B (Oil Phase / Emulsification)': [
        { name: 'GTCC (Caprylic/Capric Triglyceride)', percentage: 8.0, type: 'emollient' },
        { name: 'Squalane', percentage: 5.0, type: 'emollient' },
        { name: 'Cetearyl Alcohol', percentage: 2.0, type: 'emollient' },
        { name: 'Tween 80', percentage: 2.5, type: 'emulsifier' },
        { name: 'Span 80', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (Active Ingredients)': [
        { name: 'Vitamin E (Tocopherol)', percentage: 1.0, type: 'active' },
        { name: 'Dipotassium Glycyrrhizinate', percentage: 0.2, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 0.6, type: 'preservative' },
        { name: 'Fragrance', percentage: 0.2, type: 'fragrance' }
      ]
    }
  },
  lotion: {
    name: 'O/W Lightweight Body Lotion',
    nameCn: 'O/W Lightweight Body Lotion Template',
    targetWeight: 200, // 200g
    desc: 'Oil-in-water lightweight body lotion with excellent spreadability, suitable for large area application.',
    phases: {
      'Phase A (Water Phase)': [
        { name: 'Deionized Water', percentage: 76.5, type: 'solvent' },
        { name: 'Propylene Glycol', percentage: 4.0, type: 'humectant' },
        { name: 'Xanthan Gum', percentage: 0.1, type: 'thickener' }
      ],
      'Phase B (Oil Phase / Emulsification)': [
        { name: 'Mineral Oil', percentage: 10.0, type: 'emollient' },
        { name: 'Cetearyl Alcohol', percentage: 3.0, type: 'emollient' },
        { name: 'Tween 60', percentage: 3.5, type: 'emulsifier' },
        { name: 'Span 60', percentage: 1.5, type: 'emulsifier' }
      ],
      'Phase C (Active Ingredients)': [
        { name: 'Allantoin', percentage: 0.5, type: 'active' },
        { name: 'Panthenol', percentage: 0.5, type: 'active' }
      ],
      'Phase D (Preservative & Fragrance)': [
        { name: 'Phenoxyethanol', percentage: 0.4, type: 'preservative' }
      ]
    }
  }
};
