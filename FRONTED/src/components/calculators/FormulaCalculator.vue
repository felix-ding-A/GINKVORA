<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { SUPPLEMENT_TEMPLATES, CAPSULE_SPECS } from '../../lib/calculators/supplementData';
import { COSMETIC_TEMPLATES, OIL_HLB_VALUES, EMULSIFIER_HLB, REGULATORY_LIMITS } from '../../lib/calculators/cosmeticData';

interface PrepStep {
  order: number;
  action: string;
  detail: string;
  volume?: number;
  unit?: string;
}

interface FormulaResult {
  workingConc: number;
  totalVolume: number;
  recommendedVolume: number;
  drugAmount: number;
  dmsoVolume: number;
  stockConc: number;
  solubilityWarning: boolean;
  steps: PrepStep[];
  precautions: string[];
}

interface ActiveIngredient {
  id: string;
  name: string;
  targetContent: string; // mg per unit
  overageRate: string; // %
}

interface CosmeticPhaseIngredient {
  id: string;
  name: string;
  percentage: string;
  type: string;
}

const activeTab = ref<'animal' | 'supplement' | 'cosmetic'>('animal');

// ==========================================
// STATE: ANIMAL FORMULATION
// ==========================================
const dose = ref('10'); // mg/kg
const weight = ref('20'); // g
const volumePer = ref('100'); // μL per animal
const count = ref('10'); // animal count
const solubilityLimit = ref('10'); // mg/mL in DMSO

// Solvent Percentages (Must sum to 100%)
const dmsoPct = ref('10');
const pegPct = ref('40');
const tweenPct = ref('5');
const waterPct = ref('45');
const cornOilPct = ref('0');

const animalResult = ref<FormulaResult | null>(null);
const pctError = ref('');

// ==========================================
// STATE: SUPPLEMENT FORMULATION
// ==========================================
const suppType = ref('tablet');
const suppTargetWeight = ref('500'); // mg
const suppBatchSize = ref('10000'); // units
const suppBulkDensity = ref('0.7'); // g/mL
const suppActives = ref<ActiveIngredient[]>([
  { id: '1', name: 'Vitamin C', targetContent: '100', overageRate: '5' },
  { id: '2', name: 'Zinc Gluconate', targetContent: '50', overageRate: '2' }
]);
const suppExcipientPcts = ref<Record<string, string>>({});

// ==========================================
// STATE: COSMETIC FORMULATION
// ==========================================
const cosmeticType = ref('cream');
const cosmeticWeight = ref('100'); // g
const cosmeticPhases = ref<Record<string, CosmeticPhaseIngredient[]>>({});

// ==========================================
// METHODS & CALCULATIONS: ANIMAL
// ==========================================
const calculateAnimalFormula = () => {
  pctError.value = '';
  
  const dVal = parseFloat(dose.value);
  const wVal = parseFloat(weight.value);
  const vPerVal = parseFloat(volumePer.value);
  const cVal = parseFloat(count.value);
  const limitVal = parseFloat(solubilityLimit.value);

  const dPct = parseFloat(dmsoPct.value) || 0;
  const pPct = parseFloat(pegPct.value) || 0;
  const tPct = parseFloat(tweenPct.value) || 0;
  const wPct = parseFloat(waterPct.value) || 0;
  const oPct = parseFloat(cornOilPct.value) || 0;

  const sumPct = dPct + pPct + tPct + wPct + oPct;
  if (Math.abs(sumPct - 100) > 0.01) {
    pctError.value = `Solvent percentages must sum up to exactly 100% (currently ${sumPct.toFixed(1)}%)`;
    animalResult.value = null;
    return;
  }

  if (isNaN(dVal) || isNaN(wVal) || isNaN(vPerVal) || isNaN(cVal) || dVal <= 0 || wVal <= 0 || vPerVal <= 0 || cVal <= 0) {
    animalResult.value = null;
    return;
  }

  const drugPerAnimal = (dVal * wVal) / 1000;
  const workingConc = (drugPerAnimal / vPerVal) * 1000;
  const recommendedVolume = vPerVal * (cVal + 1); // in μL
  const theoreticalVolume = vPerVal * cVal;

  const totalVolumeMl = recommendedVolume / 1000;
  const totalDrug = workingConc * totalVolumeMl; // in mg
  const dmsoVolume = recommendedVolume * (dPct / 100); // in μL
  const stockConc = totalDrug / (dmsoVolume / 1000); // in mg/mL

  const solubilityWarning = stockConc > limitVal;
  const steps: PrepStep[] = [];
  let stepOrder = 1;

  steps.push({
    order: stepOrder++,
    action: `Weigh ${totalDrug.toFixed(2)} mg of test compound, and add ${dmsoVolume.toFixed(1)} μL of DMSO.`,
    detail: `Vortex or shake thoroughly to ensure complete dissolution. The stock concentration is now ${stockConc.toFixed(2)} mg/mL.`,
    volume: dmsoVolume,
    unit: 'μL'
  });

  if (pPct > 0) {
    const vol = recommendedVolume * (pPct / 100);
    steps.push({
      order: stepOrder++,
      action: `Add ${vol.toFixed(1)} μL of PEG300.`,
      detail: `Mix until clear. If needed, use a warm water bath, sonication, or vortexing to assist dissolution.`,
      volume: vol,
      unit: 'μL'
    });
  }

  if (tPct > 0) {
    const vol = recommendedVolume * (tPct / 100);
    steps.push({
      order: stepOrder++,
      action: `Add ${vol.toFixed(1)} μL of Tween 80.`,
      detail: `Mix thoroughly to ensure complete solubilization without oil droplets on the tube wall.`,
      volume: vol,
      unit: 'μL'
    });
  }

  if (wPct > 0) {
    const vol = recommendedVolume * (wPct / 100);
    steps.push({
      order: stepOrder++,
      action: `Slowly add ${vol.toFixed(1)} μL of ddH₂O (sterile water).`,
      detail: `Mix continuously while adding water to ensure complete hydration. If precipitation/turbidity occurs, consider increasing solubilizers.`,
      volume: vol,
      unit: 'μL'
    });
  }

  if (oPct > 0) {
    const vol = recommendedVolume * (oPct / 100);
    steps.push({
      order: stepOrder++,
      action: `Add ${vol.toFixed(1)} μL of Corn oil.`,
      detail: `Vortex or shake vigorously to prepare a uniform oil-phase formulation.`,
      volume: vol,
      unit: 'μL'
    });
  }

  animalResult.value = {
    workingConc: parseFloat(workingConc.toFixed(4)),
    totalVolume: theoreticalVolume,
    recommendedVolume,
    drugAmount: parseFloat(totalDrug.toFixed(3)),
    dmsoVolume: parseFloat(dmsoVolume.toFixed(1)),
    stockConc: parseFloat(stockConc.toFixed(2)),
    solubilityWarning,
    steps,
    precautions: [
      'Strictly follow the exact order of steps (1, 2, 3...) when adding solvents, otherwise the compound will precipitate.',
      'Ensure the solution is completely clear and mixed after each solvent addition before adding the next one.',
      'It is highly recommended to prepare the formulation fresh before use to avoid degradation or crystallisation.',
      solubilityWarning ? 'Warning: The calculated stock concentration exceeds the specified solubility limit. Increase DMSO percentage or decrease dosage volume.' : 'The calculated stock concentration is within the safe solubility limit.'
    ]
  };
};

const setFormulationMode = (mode: 'water' | 'oil') => {
  if (mode === 'water') {
    dmsoPct.value = '10';
    pegPct.value = '40';
    tweenPct.value = '5';
    waterPct.value = '45';
    cornOilPct.value = '0';
  } else {
    dmsoPct.value = '10';
    pegPct.value = '0';
    tweenPct.value = '0';
    waterPct.value = '0';
    cornOilPct.value = '90';
  }
};

const handleResetAnimal = () => {
  dose.value = '10';
  weight.value = '20';
  volumePer.value = '100';
  count.value = '10';
  solubilityLimit.value = '10';
  setFormulationMode('water');
};

// ==========================================
// METHODS & CALCULATIONS: SUPPLEMENT
// ==========================================
const initSupplementExcipients = () => {
  const template = SUPPLEMENT_TEMPLATES[suppType.value];
  if (template) {
    suppTargetWeight.value = template.targetWeight.toString();
    const initialPcts: Record<string, string> = {};
    template.excipients.forEach(exc => {
      initialPcts[exc.nameCn] = exc.defaultPct.toString();
    });
    suppExcipientPcts.value = initialPcts;
  }
};

const addSuppActive = () => {
  const nextId = (Math.max(...suppActives.value.map(a => parseInt(a.id) || 0), 0) + 1).toString();
  suppActives.value.push({ id: nextId, name: 'New Active', targetContent: '50', overageRate: '5' });
};

const removeSuppActive = (id: string) => {
  suppActives.value = suppActives.value.filter(a => a.id !== id);
};

// Real-time Supplement Report Generator
const suppReport = computed(() => {
  const warnings: string[] = [];
  const targetW = parseFloat(suppTargetWeight.value) || 500;
  const batchU = parseFloat(suppBatchSize.value) || 10000;
  const density = parseFloat(suppBulkDensity.value) || 0.7;

  // 1. Actives actual
  let totalActivesActualW = 0;
  const calculatedActives = suppActives.value.map(a => {
    const targetC = parseFloat(a.targetContent) || 0;
    const overage = parseFloat(a.overageRate) || 0;
    const actualC = targetC * (1 + overage / 100);
    const totalBatchWeightG = (actualC * batchU) / 1000;
    totalActivesActualW += actualC;

    return {
      ...a,
      actualContent: parseFloat(actualC.toFixed(2)),
      totalBatchWeightG: parseFloat(totalBatchWeightG.toFixed(2))
    };
  });

  // 2. Budget validation
  const excipientsBudget = targetW - totalActivesActualW;
  let excipientsList: any[] = [];

  if (excipientsBudget < 0) {
    warnings.push(`[Formulation Overload Warning] Total active ingredient content is ${totalActivesActualW.toFixed(1)}mg, which exceeds the target unit weight of ${targetW}mg. Please increase target unit weight or reduce active content.`);
  } else {
    const template = SUPPLEMENT_TEMPLATES[suppType.value];
    if (template) {
      const rawPcts = template.excipients.map(e => parseFloat(suppExcipientPcts.value[e.nameCn]) || 0);
      const sumRawPcts = rawPcts.reduce((a, b) => a + b, 0);

      excipientsList = template.excipients.map(e => {
        const rawPct = parseFloat(suppExcipientPcts.value[e.nameCn]) || 0;
        const relativeShare = sumRawPcts > 0 ? rawPct / sumRawPcts : 1 / template.excipients.length;
        
        const contentPerUnit = excipientsBudget * relativeShare;
        const pctOfTotal = (contentPerUnit / targetW) * 100;
        const totalBatchWeightG = (contentPerUnit * batchU) / 1000;

        return {
          nameCn: e.nameCn,
          nameEn: e.nameEn,
          type: e.type,
          pctOfTotal: parseFloat(pctOfTotal.toFixed(2)),
          contentPerUnit: parseFloat(contentPerUnit.toFixed(2)),
          totalBatchWeightG: parseFloat(totalBatchWeightG.toFixed(2))
        };
      });
    }
  }

  // 3. Capsule shell advice
  let capsuleAdvice = '';
  if (suppType.value === 'capsule') {
    const fillVolumeMl = (targetW / density) / 1000;
    const recommendedCapsule = CAPSULE_SPECS.find(spec => fillVolumeMl <= spec.volume);
    if (recommendedCapsule) {
      capsuleAdvice = `Based on bulk density ${density} g/mL and unit target weight ${targetW} mg, the calculated filling volume is ${fillVolumeMl.toFixed(3)} mL. Recommended capsule shell size: ${recommendedCapsule.size} (volume ${recommendedCapsule.volume} mL, range: ${recommendedCapsule.typicalCapacityMin}-${recommendedCapsule.typicalCapacityMax} mg).`;
    } else {
      capsuleAdvice = `Calculated filling volume is ${fillVolumeMl.toFixed(3)} mL, which exceeds the capacity of the largest capsule shell size #00 (0.95 mL). Consider dividing the dosage into two capsules or reducing the unit target weight.`;
    }
  }

  // 4. Tablet disintegration prediction
  let tabletAdvice = '';
  if (suppType.value === 'tablet') {
    const disintegrantItem = excipientsList.find(e => e.type === 'disintegrant');
    const disintegrantPct = disintegrantItem ? disintegrantItem.pctOfTotal : 0;
    
    const estDisintegrationTime = Math.max(5, Math.min(60, parseFloat((45 - disintegrantPct * 8).toFixed(1))));
    tabletAdvice = `Tablet Disintegration Prediction: Disintegrant content is ${disintegrantPct.toFixed(1)}%. Estimated disintegration time is ${estDisintegrationTime} minutes (standard threshold is within 30 minutes).`;
  }

  return {
    calculatedActives,
    excipientsList,
    excipientsBudget: parseFloat(excipientsBudget.toFixed(2)),
    capsuleAdvice,
    tabletAdvice,
    warnings,
    totalWeightPerUnit: targetW,
    totalBatchWeightKg: parseFloat(((targetW * batchU) / 1e6).toFixed(3))
  };
});

// ==========================================
// METHODS & CALCULATIONS: COSMETIC
// ==========================================
const loadCosmeticTemplate = (templateKey: string) => {
  const template = COSMETIC_TEMPLATES[templateKey];
  if (template) {
    cosmeticWeight.value = template.targetWeight.toString();
    
    const mappedPhases: Record<string, CosmeticPhaseIngredient[]> = {};
    Object.entries(template.phases).forEach(([phaseName, ingredients]) => {
      mappedPhases[phaseName] = ingredients.map((ing, idx) => ({
        id: `${phaseName}-${idx}`,
        name: ing.name,
        percentage: ing.percentage.toString(),
        type: ing.type
      }));
    });
    
    ['Phase A (Water Phase)', 'Phase B (Oil Phase / Emulsification)', 'Phase C (Active Ingredients)', 'Phase D (Preservative & Fragrance)'].forEach(p => {
      if (!mappedPhases[p]) mappedPhases[p] = [];
    });

    cosmeticPhases.value = mappedPhases;
  }
};

const addCosmeticIngredient = (phaseName: string) => {
  const phaseList = cosmeticPhases.value[phaseName] || [];
  const nextId = `${phaseName}-${Date.now()}`;
  phaseList.push({ id: nextId, name: 'New Component', percentage: '0', type: 'active' });
  cosmeticPhases.value[phaseName] = phaseList;
};

const removeCosmeticIngredient = (phaseName: string, id: string) => {
  const phaseList = cosmeticPhases.value[phaseName] || [];
  cosmeticPhases.value[phaseName] = phaseList.filter(ing => ing.id !== id);
};

// Real-time Cosmetic Formula Evaluator
const cosmeticReport = computed(() => {
  const warnings: string[] = [];
  let totalPct = 0;
  
  const allIngredients: CosmeticPhaseIngredient[] = [];
  Object.values(cosmeticPhases.value).forEach(list => {
    list.forEach(ing => {
      totalPct += parseFloat(ing.percentage) || 0;
      allIngredients.push(ing);
    });
  });

  // 1. Regulatory Limit checks
  allIngredients.forEach(ing => {
    const pct = parseFloat(ing.percentage) || 0;
    const ingNameLower = ing.name.toLowerCase();
    
    const limitKey = Object.keys(REGULATORY_LIMITS).find(
      key => ingNameLower.includes(key.toLowerCase()) || ingNameLower.includes(REGULATORY_LIMITS[key].nameCn.toLowerCase())
    );

    if (limitKey) {
      const limitInfo = REGULATORY_LIMITS[limitKey];
      if (pct > limitInfo.maxUsagePct) {
        warnings.push(`[Regulatory Limit Warning] Ingredient [${ing.name}] at ${pct}% exceeds the safety limit of ${limitInfo.maxUsagePct}% (${limitInfo.ref}).`);
      }
    }
  });

  // 2. HLB Required Calculation for Oil Phase
  const oilPhaseIngredients = cosmeticPhases.value['Phase B (Oil Phase / Emulsification)'] || [];
  let totalOilWeightPct = 0;
  let weightedHlbSum = 0;
  
  oilPhaseIngredients.forEach(ing => {
    const pct = parseFloat(ing.percentage) || 0;
    if (ing.type === 'emollient') {
      const matchedOilKey = Object.keys(OIL_HLB_VALUES).find(
        oilKey => ing.name.toLowerCase().includes(oilKey.toLowerCase().split(' ')[0])
      );
      if (matchedOilKey) {
        const reqHlb = OIL_HLB_VALUES[matchedOilKey];
        weightedHlbSum += reqHlb * pct;
        totalOilWeightPct += pct;
      }
    }
  });

  const requiredHlb = totalOilWeightPct > 0 ? weightedHlbSum / totalOilWeightPct : 0;

  // 3. Emulsifier Blending Solver Advice
  let emulsifierAdvice = '';
  const emulsifiersInPhase = oilPhaseIngredients.filter(ing => ing.type === 'emulsifier');
  
  if (requiredHlb > 0 && emulsifiersInPhase.length >= 2) {
    const highEmulsifier = emulsifiersInPhase.find(ing => {
      const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
      return key && EMULSIFIER_HLB[key] >= 10;
    });
    const lowEmulsifier = emulsifiersInPhase.find(ing => {
      const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
      return key && EMULSIFIER_HLB[key] < 10;
    });

    if (highEmulsifier && lowEmulsifier) {
      const keyHigh = Object.keys(EMULSIFIER_HLB).find(k => highEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
      const keyLow = Object.keys(EMULSIFIER_HLB).find(k => lowEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
      
      const hlbHigh = EMULSIFIER_HLB[keyHigh];
      const hlbLow = EMULSIFIER_HLB[keyLow];
      const totalEmulsifierPct = (parseFloat(highEmulsifier.percentage) || 0) + (parseFloat(lowEmulsifier.percentage) || 0);

      if (hlbHigh > hlbLow) {
        const ratioHigh = (requiredHlb - hlbLow) / (hlbHigh - hlbLow);
        const ratioLow = 1 - ratioHigh;

        if (ratioHigh >= 0 && ratioHigh <= 1) {
          emulsifierAdvice = `Oil phase required HLB value is ${requiredHlb.toFixed(2)}. Blending system detected emulsifiers: ${highEmulsifier.name.split(' ')[0]} (HLB ${hlbHigh}) and ${lowEmulsifier.name.split(' ')[0]} (HLB ${hlbLow}). At the current total dosage of ${totalEmulsifierPct}%, the optimal ratio is: high-HLB emulsifier ${(ratioHigh*100).toFixed(1)}%, low-HLB emulsifier ${(ratioLow*100).toFixed(1)}%.`;
        } else {
          emulsifierAdvice = `Oil phase required HLB (${requiredHlb.toFixed(2)}) is outside the range of the current emulsifiers (${hlbLow}-${hlbHigh}). Replace with higher or lower HLB emulsifiers.`;
        }
      }
    }
  }

  // 4. SOP steps generation based on type
  const sopSteps: PrepStep[] = [];
  let orderNum = 1;

  sopSteps.push({
    order: orderNum++,
    action: 'Prepare Tank and Homogenizer',
    detail: 'Clean and sterilize the homogenizer vessel and reactor. Turn on the heating jacket to preheat phases.'
  });

  if ((cosmeticPhases.value['Phase A (Water Phase)'] || []).length > 0) {
    sopSteps.push({
      order: orderNum++,
      action: 'Preheat and Disperse Phase A (Water Phase)',
      detail: `Add water phase materials into the vessel, heat to 75-80°C, and stir until polymers like Xanthan Gum and Carbomer are fully hydrated and dispersed.`
    });
  }

  if ((cosmeticPhases.value['Phase B (Oil Phase / Emulsification)'] || []).length > 0) {
    sopSteps.push({
      order: orderNum++,
      action: 'Melt and Preheat Phase B (Oil Phase)',
      detail: `Add lipids and emulsifiers into the oil pot, heat to 75-80°C, and stir until completely melted into a uniform and clear liquid.`
    });

    sopSteps.push({
      order: orderNum++,
      action: 'High-Shear Homogenization & Emulsification',
      detail: `At 75-80°C, rapidly pour the Oil Phase (Phase B) into the Water Phase (Phase A). Start the high-shear homogenizer at 3000 rpm for 5-10 minutes to form a fine and stable emulsion.`
    });
  }

  sopSteps.push({
    order: orderNum++,
    action: 'Cooling Process',
    detail: 'Stop homogenization and switch to anchor/propeller mixing. Cool down slowly to below 40°C.'
  });

  if ((cosmeticPhases.value['Phase C (Active Ingredients)'] || []).length > 0) {
    sopSteps.push({
      order: orderNum++,
      action: 'Add Phase C (Active Ingredients)',
      detail: 'At 35-40°C, add active ingredients and stir at medium speed until fully distributed. Avoid adding at high temperatures to prevent active degradation.'
    });
  }

  if ((cosmeticPhases.value['Phase D (Preservative & Fragrance)'] || []).length > 0) {
    sopSteps.push({
      order: orderNum++,
      action: 'Add Phase D (Preservative & Fragrance)',
      detail: 'Lastly, add preservatives and fragrance, and mix for 10 minutes. Measure pH (typically adjusted to 5.5-6.5), then package.'
    });
  }

  return {
    totalPct: parseFloat(totalPct.toFixed(2)),
    requiredHlb: parseFloat(requiredHlb.toFixed(2)),
    emulsifierAdvice,
    warnings,
    sopSteps
  };
});

const canOptimizeHlb = computed(() => {
  const oilPhaseIngredients = cosmeticPhases.value['Phase B (Oil Phase / Emulsification)'] || [];
  const emulsifiersInPhase = oilPhaseIngredients.filter(ing => ing.type === 'emulsifier');
  if (cosmeticReport.value.requiredHlb > 0 && emulsifiersInPhase.length >= 2) {
    const highEmulsifier = emulsifiersInPhase.find(ing => {
      const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
      return key && EMULSIFIER_HLB[key] >= 10;
    });
    const lowEmulsifier = emulsifiersInPhase.find(ing => {
      const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
      return key && EMULSIFIER_HLB[key] < 10;
    });
    return !!(highEmulsifier && lowEmulsifier);
  }
  return false;
});

const applyOptimalHlb = () => {
  const oilPhaseIngredients = cosmeticPhases.value['Phase B (Oil Phase / Emulsification)'] || [];
  const emulsifiersInPhase = oilPhaseIngredients.filter(ing => ing.type === 'emulsifier');
  const highEmulsifier = emulsifiersInPhase.find(ing => {
    const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
    return key && EMULSIFIER_HLB[key] >= 10;
  });
  const lowEmulsifier = emulsifiersInPhase.find(ing => {
    const key = Object.keys(EMULSIFIER_HLB).find(k => ing.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
    return key && EMULSIFIER_HLB[key] < 10;
  });

  if (highEmulsifier && lowEmulsifier) {
    const keyHigh = Object.keys(EMULSIFIER_HLB).find(k => highEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
    const keyLow = Object.keys(EMULSIFIER_HLB).find(k => lowEmulsifier.name.toLowerCase().includes(k.toLowerCase().split(' ')[0]))!;
    const hlbHigh = EMULSIFIER_HLB[keyHigh];
    const hlbLow = EMULSIFIER_HLB[keyLow];
    const requiredHlb = cosmeticReport.value.requiredHlb;

    const totalEmulsifierPct = (parseFloat(highEmulsifier.percentage) || 0) + (parseFloat(lowEmulsifier.percentage) || 0);

    if (hlbHigh > hlbLow) {
      const ratioHigh = (requiredHlb - hlbLow) / (hlbHigh - hlbLow);
      const ratioLow = 1 - ratioHigh;
      if (ratioHigh >= 0 && ratioHigh <= 1) {
        highEmulsifier.percentage = (totalEmulsifierPct * ratioHigh).toFixed(2);
        lowEmulsifier.percentage = (totalEmulsifierPct * ratioLow).toFixed(2);
      }
    }
  }
};

// ==========================================
// WATCHERS & MOUNT
// ==========================================
watch([dose, weight, volumePer, count, solubilityLimit, dmsoPct, pegPct, tweenPct, waterPct, cornOilPct, activeTab], () => {
  if (activeTab.value === 'animal') {
    calculateAnimalFormula();
  }
});

watch([suppType, activeTab], () => {
  if (activeTab.value === 'supplement') {
    initSupplementExcipients();
  }
});

watch([cosmeticType, activeTab], () => {
  if (activeTab.value === 'cosmetic') {
    loadCosmeticTemplate(cosmeticType.value);
  }
});

onMounted(() => {
  calculateAnimalFormula();
  initSupplementExcipients();
  loadCosmeticTemplate(cosmeticType.value);
});
</script>

<template>
  <div class="calculator-wrapper flex flex-col gap-6">
    <!-- Header with Tab Navigation -->
    <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 class="text-2xl font-bold font-display gradient-text--gold">Formulation Solver</h2>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Interactive recipe builder for in vivo pharmacology, health supplements, and cosmetic emulsions
        </p>
      </div>

      <!-- Tab Buttons -->
      <div class="mode-toggle-switch">
        <button
          @click="activeTab = 'animal'"
          :class="['mode-toggle-btn', activeTab === 'animal' ? 'mode-toggle-btn--active' : '']"
        >
          In Vivo Animal Recipe
        </button>
        <button
          @click="activeTab = 'supplement'"
          :class="['mode-toggle-btn', activeTab === 'supplement' ? 'mode-toggle-btn--active' : '']"
        >
          Supplement Formulator
        </button>
        <button
          @click="activeTab = 'cosmetic'"
          :class="['mode-toggle-btn', activeTab === 'cosmetic' ? 'mode-toggle-btn--active' : '']"
        >
          Cosmetic Formulator
        </button>
      </div>
    </div>

    <!-- TAB 1: ANIMAL RECIPE -->
    <div v-if="activeTab === 'animal'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Inputs Pane -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">Animal Dosage Parameters</h3>
          <div class="flex gap-2">
            <button class="btn btn--secondary py-1 px-2.5 text-[11px]" @click="setFormulationMode('water')">Aqueous Template</button>
            <button class="btn btn--secondary py-1 px-2.5 text-[11px]" @click="setFormulationMode('oil')">Oil Template</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label text-xs">Dosage per Injection (mg/kg)</label>
            <input type="number" class="form-input font-mono" v-model="dose" />
          </div>
          <div>
            <label class="form-label text-xs">Average Animal Weight (g)</label>
            <input type="number" class="form-input font-mono" v-model="weight" />
          </div>
          <div>
            <label class="form-label text-xs">Injection Volume per Animal (μL)</label>
            <input type="number" class="form-input font-mono" v-model="volumePer" />
          </div>
          <div>
            <label class="form-label text-xs">Number of Animals</label>
            <input type="number" class="form-input font-mono" v-model="count" />
          </div>
          <div class="md:col-span-2">
            <label class="form-label text-xs">Solubility Limit in DMSO (mg/mL)</label>
            <input type="number" class="form-input font-mono" v-model="solubilityLimit" />
          </div>
        </div>

        <!-- Solvent Percentages -->
        <div class="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <label class="form-label text-xs font-bold uppercase tracking-wider">Solvent Volume Percentages (Must sum to 100%)</label>
          <div v-if="pctError" class="p-2.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-xs text-[var(--color-error)]">
            {{ pctError }}
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div>
              <label class="form-label text-[10px] text-center mb-1 block">DMSO %</label>
              <input type="number" class="form-input font-mono text-center p-1.5" v-model="dmsoPct" />
            </div>
            <div>
              <label class="form-label text-[10px] text-center mb-1 block">PEG300 %</label>
              <input type="number" class="form-input font-mono text-center p-1.5" v-model="pegPct" />
            </div>
            <div>
              <label class="form-label text-[10px] text-center mb-1 block">Tween80 %</label>
              <input type="number" class="form-input font-mono text-center p-1.5" v-model="tweenPct" />
            </div>
            <div>
              <label class="form-label text-[10px] text-center mb-1 block">ddH₂O %</label>
              <input type="number" class="form-input font-mono text-center p-1.5" v-model="waterPct" />
            </div>
            <div>
              <label class="form-label text-[10px] text-center mb-1 block">Corn Oil %</label>
              <input type="number" class="form-input font-mono text-center p-1.5" v-model="cornOilPct" />
            </div>
          </div>
        </div>

        <button @click="handleResetAnimal" class="btn btn--secondary self-start py-2 text-xs flex items-center gap-1">
          🔄 Reset Recipe
        </button>
      </div>

      <!-- SOP Output Pane -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col justify-between gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">📋 Animal Formulation SOP & Report</h3>

        <div v-if="animalResult" class="flex flex-col gap-4 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar pr-1">
          <!-- Summary card -->
          <div class="grid grid-cols-2 gap-4 bg-black/10 border border-[var(--color-border)] p-4 rounded-xl">
            <div>
              <span class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Working Conc</span>
              <p class="font-mono text-base text-[var(--color-primary-light)] font-bold">{{ animalResult.workingConc }} mg/mL</p>
            </div>
            <div>
              <span class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Recommended Prep Vol</span>
              <p class="font-mono text-base text-[var(--color-accent-light)] font-bold">{{ animalResult.recommendedVolume }} μL</p>
              <span class="text-[9px] text-[var(--color-text-muted)]">(Includes 1 extra animal margin)</span>
            </div>
          </div>

          <!-- Solubility safety status -->
          <div
            v-if="animalResult.solubilityWarning"
            class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-xs text-[var(--color-error)] leading-relaxed"
          >
            🚨 <strong>Solubility Warning:</strong> Calculated stock concentration is <strong>{{ animalResult.stockConc }} mg/mL</strong>, exceeding specified limit ({{ solubilityLimit }} mg/mL). Please adjust ratio.
          </div>
          <div v-else class="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg text-xs text-[var(--color-success)] flex items-center gap-1.5">
            ✅ Stock concentration is within safe solubility limits.
          </div>

          <!-- Steps -->
          <div class="flex flex-col gap-2">
            <span class="form-label text-xs uppercase font-bold tracking-wider mb-1">Step-by-Step SOP</span>
            <div
              v-for="step in animalResult.steps"
              :key="step.order"
              class="p-3 rounded-lg border border-[var(--color-border)] bg-white/5 flex gap-3 text-xs leading-relaxed"
            >
              <span class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] flex items-center justify-center font-bold flex-shrink-0">
                {{ step.order }}
              </span>
              <div class="flex flex-col gap-0.5">
                <strong class="text-[var(--color-primary-light)]">{{ step.action }}</strong>
                <p class="text-[var(--color-text-secondary)]">{{ step.detail }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center flex-grow text-xs text-[var(--color-text-muted)] italic">
          Enter valid dosage conditions to display the preparation protocol
        </div>
      </div>
    </div>

    <!-- TAB 2: SUPPLEMENT FORMULATOR -->
    <div v-if="activeTab === 'supplement'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Inputs Pane -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
        <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">Active Ingredients & Parameters</h3>
          <select class="form-input form-select w-40 text-xs py-1" v-model="suppType">
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="softgel">Softgel</option>
            <option value="liquid">Liquid</option>
            <option value="powder">Powder</option>
          </select>
        </div>

        <!-- Target parameters -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="form-label text-[11px] font-bold">Target Weight (mg)</label>
            <input type="number" class="form-input font-mono text-xs" v-model="suppTargetWeight" />
          </div>
          <div>
            <label class="form-label text-[11px] font-bold">Batch Size (Units)</label>
            <input type="number" class="form-input font-mono text-xs" v-model="suppBatchSize" />
          </div>
          <div>
            <label class="form-label text-[11px] font-bold">Bulk Density (g/mL)</label>
            <input type="number" class="form-input font-mono text-xs" step="0.05" v-model="suppBulkDensity" :disabled="suppType !== 'capsule' && suppType !== 'tablet'" />
          </div>
        </div>

        <!-- Active list -->
        <div class="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <span class="form-label text-xs uppercase font-bold tracking-wider">Active Compound Input</span>
          <div class="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-[var(--color-text-secondary)] px-1">
            <span class="col-span-6">Ingredient Name</span>
            <span class="col-span-3">Per Unit (mg)</span>
            <span class="col-span-2">Overage %</span>
            <span class="col-span-1 text-center">Del</span>
          </div>

          <div class="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="a in suppActives"
              :key="a.id"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <div class="col-span-6">
                <input type="text" class="form-input text-xs py-1.5" v-model="a.name" placeholder="Vitamin C" />
              </div>
              <div class="col-span-3">
                <input type="number" class="form-input font-mono text-xs py-1.5" v-model="a.targetContent" />
              </div>
              <div class="col-span-2">
                <input type="number" class="form-input font-mono text-xs py-1.5" v-model="a.overageRate" />
              </div>
              <button @click="removeSuppActive(a.id)" class="col-span-1 text-center text-[var(--color-error)] hover:bg-white/5 py-1 rounded">
                🗑️
              </button>
            </div>
          </div>

          <button @click="addSuppActive" class="btn btn--secondary py-1.5 px-3 text-xs self-start flex items-center gap-1">
            ➕ Add Active Ingredient
          </button>
        </div>

        <!-- Excipient Distribution -->
        <div v-if="SUPPLEMENT_TEMPLATES[suppType]" class="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <span class="form-label text-xs uppercase font-bold tracking-wider">Excipient Weight Ratios (Parts by Weight)</span>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="e in SUPPLEMENT_TEMPLATES[suppType].excipients"
              :key="e.nameCn"
              class="p-2.5 rounded-lg border border-[var(--color-border)] bg-black/15 flex justify-between items-center"
            >
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-semibold text-[var(--color-text)]">{{ e.nameCn }}</span>
                <span class="text-[10px] text-[var(--color-text-muted)]">{{ e.type }} (Typical: {{ e.typicalPct }})</span>
              </div>
              <div class="flex items-center gap-1">
                <input type="number" class="form-input font-mono text-xs w-16 text-center py-1" v-model="suppExcipientPcts[e.nameCn]" />
                <span class="text-[10px] text-[var(--color-text-muted)]">pbw</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Pane -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col justify-between gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">📋 Supplement Recipe Sheet</h3>

        <div class="flex flex-col gap-4 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar pr-1">
          <!-- Warnings -->
          <div
            v-for="(w, idx) in suppReport.warnings"
            :key="idx"
            class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-xs text-[var(--color-error)]"
          >
            {{ w }}
          </div>

          <!-- Total Metrics -->
          <div class="grid grid-cols-2 gap-4 bg-black/10 border border-[var(--color-border)] p-4 rounded-xl">
            <div>
              <span class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Unit Target Weight</span>
              <p class="font-mono text-base text-[var(--color-primary-light)] font-bold">{{ suppReport.totalWeightPerUnit}} mg</p>
            </div>
            <div>
              <span class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Total Batch Weight</span>
              <p class="font-mono text-base text-[var(--color-accent-light)] font-bold">{{ suppReport.totalBatchWeightKg }} kg</p>
              <span class="text-[9px] text-[var(--color-text-muted)]">(Batch: {{ suppBatchSize }} units)</span>
            </div>
          </div>

          <!-- Advice box -->
          <div v-if="suppReport.capsuleAdvice || suppReport.tabletAdvice" class="p-3.5 bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 rounded-xl text-xs text-[var(--color-primary-light)] leading-relaxed">
            💡 {{ suppReport.capsuleAdvice || suppReport.tabletAdvice }}
          </div>

          <!-- Take-off table -->
          <div class="flex flex-col gap-1.5">
            <span class="form-label text-xs uppercase font-bold tracking-wider">Material Take-off Sheet</span>
            <table class="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr class="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <th class="py-1.5">Name</th>
                  <th class="py-1.5">Type</th>
                  <th class="py-1.5 text-right">Per Unit (mg)</th>
                  <th class="py-1.5 text-right text-[var(--color-primary)]">Batch Total</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-white/5"><td colspan="4" class="px-2 py-1 text-[10px] font-bold text-[var(--color-primary-light)]">ACTIVE INGREDIENTS</td></tr>
                <tr v-for="a in suppReport.calculatedActives" :key="a.id" class="border-b border-white/[0.03]">
                  <td class="py-1.5">{{ a.name }}</td>
                  <td class="py-1.5 text-[var(--color-text-muted)]">Active</td>
                  <td class="py-1.5 text-right">{{ a.actualContent }} mg</td>
                  <td class="py-1.5 text-right text-[var(--color-accent-light)]">
                    {{ a.totalBatchWeightG >= 1000 ? `${(a.totalBatchWeightG/1000).toFixed(3)} kg` : `${a.totalBatchWeightG} g` }}
                  </td>
                </tr>

                <tr v-if="suppReport.excipientsList.length > 0" class="bg-white/5"><td colspan="4" class="px-2 py-1 text-[10px] font-bold text-[var(--color-success)]">EXCIPIENTS</td></tr>
                <tr v-for="e in suppReport.excipientsList" :key="e.nameCn" class="border-b border-white/[0.03]">
                  <td class="py-1.5">{{ e.nameCn }}</td>
                  <td class="py-1.5 text-[var(--color-text-muted)]">{{ e.type }}</td>
                  <td class="py-1.5 text-right">{{ e.contentPerUnit }} mg</td>
                  <td class="py-1.5 text-right text-[var(--color-accent-light)]">
                    {{ e.totalBatchWeightG >= 1000 ? `${(e.totalBatchWeightG/1000).toFixed(3)} kg` : `${e.totalBatchWeightG} g` }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: COSMETIC FORMULATOR -->
    <div v-if="activeTab === 'cosmetic'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Phase list Editor -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6 max-h-[660px] overflow-y-auto custom-scrollbar">
        <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">Multi-Phase Recipe Editor</h3>
          <div class="flex gap-2 items-center">
            <select class="form-input form-select text-xs py-1" v-model="cosmeticType">
              <option value="serum">Serum</option>
              <option value="cream">Cream</option>
              <option value="lotion">Lotion</option>
            </select>
            <div class="flex items-center gap-1">
              <input type="number" class="form-input font-mono text-xs w-16 py-1" v-model="cosmeticWeight" />
              <span class="text-xs text-[var(--color-text-muted)]">g</span>
            </div>
          </div>
        </div>

        <!-- Render Phases -->
        <div
          v-for="phaseName in ['Phase A (Water Phase)', 'Phase B (Oil Phase / Emulsification)', 'Phase C (Active Ingredients)', 'Phase D (Preservative & Fragrance)']"
          :key="phaseName"
          class="flex flex-col gap-3 border-b border-white/[0.04] pb-4 last:border-0"
        >
          <div class="flex justify-between items-center">
            <strong class="text-xs uppercase font-bold tracking-wider" :class="[phaseName.includes('Phase B') ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-primary-light)]']">
              {{ phaseName }}
            </strong>
            <button @click="addCosmeticIngredient(phaseName)" class="btn btn--secondary py-1 px-2.5 text-[10px] flex items-center gap-0.5">
              ➕ Add to Phase
            </button>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="ing in cosmeticPhases[phaseName] || []"
              :key="ing.id"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <div class="col-span-5">
                <input type="text" class="form-input text-xs py-1.5" v-model="ing.name" />
              </div>
              <div class="col-span-3 flex gap-1 items-center">
                <input type="number" class="form-input font-mono text-xs py-1.5" v-model="ing.percentage" />
                <span class="text-xs text-[var(--color-text-muted)]">%</span>
              </div>
              <div class="col-span-3">
                <select class="form-input form-select text-[11px] py-1.5" v-model="ing.type">
                  <option value="solvent">Solvent</option>
                  <option value="humectant">Humectant</option>
                  <option value="thickener">Thickener</option>
                  <option value="emollient">Emollient</option>
                  <option value="emulsifier">Emulsifier</option>
                  <option value="active">Active</option>
                  <option value="preservative">Preservative</option>
                  <option value="fragrance">Fragrance</option>
                  <option value="chelator">Chelator</option>
                </select>
              </div>
              <button @click="removeCosmeticIngredient(phaseName, ing.id)" class="col-span-1 text-center text-[var(--color-error)] hover:bg-white/5 py-1 rounded">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Output Report & HLB solver -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col justify-between gap-6 max-h-[660px] overflow-y-auto custom-scrollbar">
        <div class="flex flex-col gap-4">
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">📋 Cosmetic Formulation Report</h3>

          <!-- Safety warnings -->
          <div
            v-for="(w, idx) in cosmeticReport.warnings"
            :key="idx"
            class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-xs text-[var(--color-error)]"
          >
            {{ w }}
          </div>

          <!-- Pct sum verify -->
          <div class="p-3 border rounded-xl flex justify-between items-center text-xs" :class="[Math.abs(cosmeticReport.totalPct - 100) > 0.01 ? 'bg-[var(--color-error)]/5 border-[var(--color-error)]/25 text-[var(--color-error)]' : 'bg-[var(--color-success)]/5 border-[var(--color-success)]/25 text-[var(--color-success)]']">
            <span>Total Formula Ratio (Must be 100%):</span>
            <strong class="font-bold text-sm">{{ cosmeticReport.totalPct }} %</strong>
          </div>

          <!-- HLB balance calculator -->
          <div v-if="cosmeticReport.requiredHlb > 0" class="p-4 rounded-xl bg-[var(--color-primary-glow)] border border-[var(--color-primary)]/20 flex flex-col gap-3">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-[var(--color-primary-light)]">Required HLB Solver</span>
              <span class="px-2 py-0.5 bg-black/40 rounded text-xs font-mono text-[var(--color-accent)] font-bold">
                Req. HLB: {{ cosmeticReport.requiredHlb }}
              </span>
            </div>

            <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {{ cosmeticReport.emulsifierAdvice || 'Add one high-HLB emulsifier (e.g. Tween 80) and one low-HLB emulsifier (e.g. Span 80) under Phase B to calculate optimal blending ratio.' }}
            </p>

            <button
              v-if="canOptimizeHlb"
              @click="applyOptimalHlb"
              class="btn btn--gold text-xs py-1.5 self-start mt-1"
            >
              📥 Apply Optimal HLB Balance
            </button>
          </div>

          <!-- SOP Step guide -->
          <div class="flex flex-col gap-2">
            <span class="form-label text-xs uppercase font-bold tracking-wider">Preparation Process (SOP)</span>
            <div
              v-for="step in cosmeticReport.sopSteps"
              :key="step.order"
              class="p-3 rounded-lg border border-[var(--color-border)] bg-white/5 flex gap-3 text-xs leading-relaxed"
            >
              <span class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] flex items-center justify-center font-bold flex-shrink-0">
                {{ step.order }}
              </span>
              <div class="flex flex-col gap-0.5">
                <strong class="text-[var(--color-primary-light)]">{{ step.action }}</strong>
                <p class="text-[var(--color-text-secondary)]">{{ step.detail }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Material weight output table -->
        <div class="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
          <span class="form-label text-xs uppercase font-bold tracking-wider">Actual Weight Take-off ({{ cosmeticWeight }}g batch)</span>
          <table class="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr class="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th class="py-1.5">Ingredient Name</th>
                <th class="py-1.5">Type</th>
                <th class="py-1.5 text-right">Ratio</th>
                <th class="py-1.5 text-right text-[var(--color-primary)]">Weight</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="phaseName in ['Phase A (Water Phase)', 'Phase B (Oil Phase / Emulsification)', 'Phase C (Active Ingredients)', 'Phase D (Preservative & Fragrance)']" :key="phaseName">
                <tr v-if="(cosmeticPhases[phaseName] || []).length > 0" class="bg-white/5">
                  <td colspan="4" class="px-2 py-1 text-[10px] font-bold text-[var(--color-primary-light)]">{{ phaseName }}</td>
                </tr>
                <tr v-for="ing in cosmeticPhases[phaseName] || []" :key="ing.id" class="border-b border-white/[0.03]">
                  <td class="py-1.5">{{ ing.name }}</td>
                  <td class="py-1.5 text-[var(--color-text-muted)]">{{ ing.type }}</td>
                  <td class="py-1.5 text-right">{{ ing.percentage }}%</td>
                  <td class="py-1.5 text-right text-[var(--color-accent-light)]">
                    {{ ((parseFloat(ing.percentage) || 0) * (parseFloat(cosmeticWeight) || 100) / 100).toFixed(3) }} g
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
