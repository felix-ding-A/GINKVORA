<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { REGULATORY_LIMITS } from '../../lib/calculators/cosmeticData';

const CONC_UNITS = [
  { label: 'pM', type: 'molar', factor: 1e-12 },
  { label: 'nM', type: 'molar', factor: 1e-9 },
  { label: 'μM', type: 'molar', factor: 1e-6 },
  { label: 'mM', type: 'molar', factor: 1e-3 },
  { label: 'M', type: 'molar', factor: 1.0 },
  { label: 'μg/mL', type: 'mass', factor: 1e-3 },
  { label: 'mg/mL', type: 'mass', factor: 1.0 },
  { label: 'g/L', type: 'mass', factor: 1.0 },
  { label: '% (w/v)', type: 'percent', factor: 10.0 },
];

const VOL_UNITS = [
  { label: 'nL', factor: 1e-9 },
  { label: 'μL', factor: 1e-6 },
  { label: 'mL', factor: 1e-3 },
  { label: 'L', factor: 1.0 },
];

interface ScalingIngredient {
  id: string;
  name: string;
  percentage: string;
}

const activeTab = ref<'standard' | 'serial' | 'scaling'>('standard');

// ==========================================
// STATE: STANDARD DILUTION
// ==========================================
const c1 = ref('10');
const c1Unit = ref('mM');
const v1 = ref('');
const v1Unit = ref('μL');
const c2 = ref('100');
const c2Unit = ref('μM');
const v2 = ref('1');
const v2Unit = ref('mL');
const mw = ref('176.12');
const target = ref<'c1' | 'v1' | 'c2' | 'v2'>('v1');
const stdFormula = ref('');
const stdOperation = ref('');
const stdError = ref('');

// Computed active result display for C1V1
const stdResultDisplay = computed(() => {
  if (target.value === 'c1') return { val: c1.value, unit: c1Unit.value, label: 'Stock Concentration (C₁)' };
  if (target.value === 'v1') return { val: v1.value, unit: v1Unit.value, label: 'Stock Volume to Transfer (V₁)' };
  if (target.value === 'c2') return { val: c2.value, unit: c2Unit.value, label: 'Final Concentration (C₂)' };
  if (target.value === 'v2') return { val: v2.value, unit: v2Unit.value, label: 'Final Solution Volume (V₂)' };
  return { val: '0', unit: '', label: '' };
});

// ==========================================
// STATE: SERIAL DILUTION
// ==========================================
const c0 = ref('10');
const c0Unit = ref('mM');
const dilutionFactor = ref('10');
const steps = ref(8);
const totalVol = ref('100');
const volUnit = ref('μL');
const serialResults = ref<any[]>([]);

// ==========================================
// STATE: FORMULA SCALING
// ==========================================
const scalingIngredients = ref<ScalingIngredient[]>([
  { id: '1', name: 'Deionized Water', percentage: '75' },
  { id: '2', name: 'Glycerin', percentage: '10' },
  { id: '3', name: 'GTCC', percentage: '10' },
  { id: '4', name: 'Niacinamide', percentage: '4' },
  { id: '5', name: 'Phenoxyethanol', percentage: '1' }
]);
const baseBatchSize = ref('100');
const baseBatchUnit = ref('g');
const targetBatchSize = ref('50');
const targetBatchUnit = ref('kg');
const scalingWarnings = ref<string[]>([]);
const scalingTotalPct = ref(100);

// ==========================================
// CALCULATION LOGIC
// ==========================================
const formatResult = (num: number): string => {
  if (num === 0) return '0';
  if (num < 1e-4 || num > 1e6) {
    return num.toExponential(4);
  }
  return parseFloat(num.toFixed(4)).toString();
};

const convertConcToBase = (value: number, unit: string, mwVal: number): number => {
  const unitInfo = CONC_UNITS.find(u => u.label === unit);
  if (!unitInfo) return value;
  if (unitInfo.type === 'molar') {
    const valM = value * unitInfo.factor;
    return valM * mwVal;
  } else {
    return value * unitInfo.factor;
  }
};

const convertConcFromBase = (valueInBase: number, targetUnit: string, mwVal: number): number => {
  const unitInfo = CONC_UNITS.find(u => u.label === targetUnit);
  if (!unitInfo) return valueInBase;
  if (unitInfo.type === 'molar') {
    const valM = valueInBase / mwVal;
    return valM / unitInfo.factor;
  } else {
    return valueInBase / unitInfo.factor;
  }
};

const calculateStandard = () => {
  stdError.value = '';
  const c1Val = parseFloat(c1.value);
  const v1Val = parseFloat(v1.value);
  const c2Val = parseFloat(c2.value);
  const v2Val = parseFloat(v2.value);
  const mwVal = parseFloat(mw.value) || 176.12;

  const uC1 = CONC_UNITS.find(u => u.label === c1Unit.value);
  const uC2 = CONC_UNITS.find(u => u.label === c2Unit.value);
  const isMixedSystem = uC1 && uC2 && (uC1.type !== uC2.type);

  if (isMixedSystem && (!mwVal || isNaN(mwVal) || mwVal <= 0)) {
    stdError.value = 'Valid Molecular Weight required for cross-system molar/mass conversions.';
    return;
  }

  try {
    const fV1 = VOL_UNITS.find(u => u.label === v1Unit.value)?.factor || 1;
    const fV2 = VOL_UNITS.find(u => u.label === v2Unit.value)?.factor || 1;

    if (target.value === 'v1') {
      if (isNaN(c1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
      if (c1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

      const c1Base = convertConcToBase(c1Val, c1Unit.value, mwVal);
      const c2Base = convertConcToBase(c2Val, c2Unit.value, mwVal);
      const v2L = v2Val * fV2;

      const v1L = (c2Base * v2L) / c1Base;
      const v1_target = v1L / fV1;

      if (v1_target > v2Val * (fV2 / fV1)) {
        throw new Error('Initial stock volume (V₁) cannot exceed final volume (V₂). Check ratios.');
      }

      v1.value = formatResult(v1_target);
      stdFormula.value = `V₁ = (C₂ × V₂) / C₁\n= (${c2Val} ${c2Unit.value} × ${v2Val} ${v2Unit.value}) / ${c1Val} ${c1Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `Transfer ${formatResult(v1_target)} ${v1Unit.value} of stock solution into ${formatResult(solvent_vol)} ${v2Unit.value} of diluent (Total Volume: ${v2Val} ${v2Unit.value}).`;
    }
    else if (target.value === 'v2') {
      if (isNaN(c1Val) || isNaN(v1Val) || isNaN(c2Val)) return;
      if (c1Val <= 0 || v1Val <= 0 || c2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

      const c1Base = convertConcToBase(c1Val, c1Unit.value, mwVal);
      const c2Base = convertConcToBase(c2Val, c2Unit.value, mwVal);
      const v1L = v1Val * fV1;

      const v2L = (c1Base * v1L) / c2Base;
      const v2_target = v2L / fV2;

      if (v2_target < v1Val * (fV1 / fV2)) {
        throw new Error('Calculated final volume (V₂) is smaller than initial volume (V₁).');
      }

      v2.value = formatResult(v2_target);
      stdFormula.value = `V₂ = (C₁ × V₁) / C₂\n= (${c1Val} ${c1Unit.value} × ${v1Val} ${v1Unit.value}) / ${c2Val} ${c2Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `Transfer ${v1Val} ${v1Unit.value} of stock solution into ${formatResult(solvent_vol)} ${v2Unit.value} of diluent.`;
    }
    else if (target.value === 'c1') {
      if (isNaN(v1Val) || isNaN(c2Val) || isNaN(v2Val)) return;
      if (v1Val <= 0 || c2Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

      const c2Base = convertConcToBase(c2Val, c2Unit.value, mwVal);
      const v1L = v1Val * fV1;
      const v2L = v2Val * fV2;

      const c1Base = (c2Base * v2L) / v1L;
      const c1_target = convertConcFromBase(c1Base, c1Unit.value, mwVal);

      c1.value = formatResult(c1_target);
      stdFormula.value = `C₁ = (C₂ × V₂) / V₁\n= (${c2Val} ${c2Unit.value} × ${v2Val} ${v2Unit.value}) / ${v1Val} ${v1Unit.value}`;
      stdOperation.value = `Required stock solution concentration is ${formatResult(c1_target)} ${c1Unit.value}.`;
    }
    else if (target.value === 'c2') {
      if (isNaN(c1Val) || isNaN(v1Val) || isNaN(v2Val)) return;
      if (c1Val <= 0 || v1Val <= 0 || v2Val <= 0) throw new Error('Concentration and Volume must be greater than 0');

      const c1Base = convertConcToBase(c1Val, c1Unit.value, mwVal);
      const v1L = v1Val * fV1;
      const v2L = v2Val * fV2;

      const c2Base = (c1Base * v1L) / v2L;
      const c2_target = convertConcFromBase(c2Base, c2Unit.value, mwVal);

      c2.value = formatResult(c2_target);
      stdFormula.value = `C₂ = (C₁ × V₁) / V₂\n= (${c1Val} ${c1Unit.value} × ${v1Val} ${v1Unit.value}) / ${v2Val} ${v2Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `Final diluted concentration will be ${formatResult(c2_target)} ${c2Unit.value}. Add ${formatResult(solvent_vol)} ${v2Unit.value} of diluent to ${v1Val} ${v1Unit.value} stock.`;
    }
  } catch (e: any) {
    stdError.value = e.message;
  }
};

const calculateSerial = () => {
  const c0Val = parseFloat(c0.value);
  const factorVal = parseFloat(dilutionFactor.value);
  const totalVolVal = parseFloat(totalVol.value);

  if (isNaN(c0Val) || isNaN(factorVal) || isNaN(totalVolVal) || c0Val <= 0 || factorVal <= 1 || totalVolVal <= 0) {
    return;
  }

  const results = [];
  let currentConc = c0Val;

  const transferVol = totalVolVal / factorVal;
  const solventVol = totalVolVal - transferVol;

  for (let i = 1; i <= steps.value; i++) {
    currentConc = currentConc / factorVal;
    const logVal = Math.log10(currentConc);
    
    results.push({
      step: `C${i}`,
      concentration: parseFloat(currentConc.toFixed(5)),
      logConc: parseFloat(logVal.toFixed(4)),
      operation: i === 1 
        ? `Pipette ${formatResult(transferVol)} ${volUnit.value} of C0 stock into Tube 1 with ${formatResult(solventVol)} ${volUnit.value} diluent.`
        : `Pipette ${formatResult(transferVol)} ${volUnit.value} from Tube C${i-1} into Tube ${i} with ${formatResult(solventVol)} ${volUnit.value} diluent.`
    });
  }
  serialResults.value = results;
};

const calculateScaling = () => {
  const warnings: string[] = [];
  let totalPctSum = 0;

  scalingIngredients.value.forEach(ing => {
    const pct = parseFloat(ing.percentage) || 0;
    totalPctSum += pct;

    const ingNameLower = ing.name.toLowerCase();
    const matchedLimitKey = Object.keys(REGULATORY_LIMITS).find(
      key => ingNameLower.includes(key.toLowerCase()) || ingNameLower.includes(REGULATORY_LIMITS[key].nameCn.toLowerCase())
    );

    if (matchedLimitKey) {
      const limitInfo = REGULATORY_LIMITS[matchedLimitKey];
      if (pct > limitInfo.maxUsagePct) {
        warnings.push(`Ingredient [${ing.name}] at ${pct}% exceeds maximum limit of ${limitInfo.maxUsagePct}% (${limitInfo.ref}).`);
      }
    }
  });

  scalingTotalPct.value = parseFloat(totalPctSum.toFixed(2));
  scalingWarnings.value = warnings;
};

const handleResetSerial = () => {
  c0.value = '10';
  c0Unit.value = 'mM';
  dilutionFactor.value = '10';
  steps.value = 8;
  totalVol.value = '100';
  volUnit.value = 'μL';
  calculateSerial();
};

const chartPoints = computed(() => {
  if (serialResults.value.length === 0) return [];
  const width = 450;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const stepsCount = serialResults.value.length;
  const xSpan = (width - paddingLeft - paddingRight) / Math.max(1, stepsCount - 1);

  const logs = serialResults.value.map(r => r.logConc);
  const minLog = Math.min(...logs);
  const maxLog = Math.max(...logs);
  const logSpan = maxLog - minLog || 1;

  return serialResults.value.map((r, i) => {
    const x = paddingLeft + i * xSpan;
    const y = height - paddingBottom - ((r.logConc - minLog) / logSpan) * (height - paddingTop - paddingBottom);
    return {
      x,
      y,
      step: r.step,
      concentration: r.concentration,
      logConc: r.logConc
    };
  });
});

const svgLinePath = computed(() => {
  if (chartPoints.value.length === 0) return '';
  return chartPoints.value.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
});

const getWeightInGram = (value: number, unit: string): number => {
  return unit === 'kg' ? value * 1000 : value;
};

const formatWeight = (valueInGram: number, targetUnit: string): string => {
  if (targetUnit === 'kg') {
    const valKg = valueInGram / 1000;
    return `${valKg.toFixed(4).replace(/\.?0+$/, '')} kg`;
  }
  return `${valueInGram.toFixed(2).replace(/\.?0+$/, '')} g`;
};

const loadScalingPreset = (type: 'serum' | 'cream') => {
  if (type === 'serum') {
    scalingIngredients.value = [
      { id: '1', name: 'Deionized Water', percentage: '82.5' },
      { id: '2', name: 'Sodium Hyaluronate', percentage: '0.5' },
      { id: '3', name: 'Butylene Glycol', percentage: '8' },
      { id: '4', name: 'Niacinamide', percentage: '5' },
      { id: '5', name: 'Panthenol', percentage: '3' },
      { id: '6', name: 'Phenoxyethanol', percentage: '1' }
    ];
  } else {
    scalingIngredients.value = [
      { id: '1', name: 'Deionized Water', percentage: '68.5' },
      { id: '2', name: 'Glycerin', percentage: '6' },
      { id: '3', name: 'Squalane', percentage: '15' },
      { id: '4', name: 'Jojoba Oil', percentage: '5' },
      { id: '5', name: 'Span-60', percentage: '2' },
      { id: '6', name: 'Tween-60', percentage: '3' },
      { id: '7', name: 'Phenoxyethanol', percentage: '0.5' }
    ];
  }
};

const addScalingIngredient = () => {
  scalingIngredients.value.push({
    id: Date.now().toString(),
    name: 'New Component',
    percentage: '0'
  });
};

const removeScalingIngredient = (id: string) => {
  scalingIngredients.value = scalingIngredients.value.filter(x => x.id !== id);
};

watch([c1, c1Unit, v1, v1Unit, c2, c2Unit, v2, v2Unit, target, mw, activeTab], () => {
  if (activeTab.value === 'standard') calculateStandard();
});

watch([c0, c0Unit, dilutionFactor, steps, totalVol, volUnit, activeTab], () => {
  if (activeTab.value === 'serial') calculateSerial();
});

watch([scalingIngredients, baseBatchSize, baseBatchUnit, targetBatchSize, targetBatchUnit, activeTab], () => {
  if (activeTab.value === 'scaling') calculateScaling();
}, { deep: true });

onMounted(() => {
  calculateStandard();
  calculateSerial();
  calculateScaling();
});
</script>

<template>
  <div class="dilution-calc-container flex flex-col gap-6">
    <!-- Header & Sub-tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
      <div>
        <h3 class="text-lg font-bold font-display text-[var(--color-text)]">Dilution & Batch Scaling Console</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Compute C1V1 stock dilutions, serial titration log curves, or production batch scaling with safety checks.
        </p>
      </div>

      <!-- Tab Buttons -->
      <div class="inline-flex p-1 bg-black/40 border border-[var(--color-border)] rounded-xl self-start sm:self-auto">
        <button
          @click="activeTab = 'standard'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
            activeTab === 'standard'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)] font-bold shadow'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          ]"
        >
          Standard (C₁V₁)
        </button>
        <button
          @click="activeTab = 'serial'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
            activeTab === 'serial'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)] font-bold shadow'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          ]"
        >
          Serial Curve
        </button>
        <button
          @click="activeTab = 'scaling'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
            activeTab === 'scaling'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)] font-bold shadow'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          ]"
        >
          Batch Scaling
        </button>
      </div>
    </div>

    <!-- ── TAB 1: STANDARD DILUTION (C1V1 = C2V2) ── -->
    <div v-if="activeTab === 'standard'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left (7/12): Inputs Panel -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        <div class="p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
              📥 Dilution Parameters (C₁ × V₁ = C₂ × V₂)
            </span>
            <span class="text-[11px] text-[var(--color-text-muted)]">
              Select <strong class="text-[var(--color-primary-light)]">Solve Target</strong> below
            </span>
          </div>

          <div class="flex flex-col gap-3.5">
            <!-- C1 Stock Conc -->
            <div :class="['input-row-card', target === 'c1' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="d-c1" class="text-xs font-bold text-[var(--color-text)]">Stock Concentration (C₁)</label>
                <button @click="target = 'c1'" :class="['target-btn', target === 'c1' ? 'target-btn--active' : '']">
                  {{ target === 'c1' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input id="d-c1" type="number" step="any" v-model="c1" :disabled="target === 'c1'" class="calc-input" placeholder="Stock C1" />
                <select v-model="c1Unit" class="calc-unit-select">
                  <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- V1 Stock Volume -->
            <div :class="['input-row-card', target === 'v1' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="d-v1" class="text-xs font-bold text-[var(--color-text)]">Stock Volume to Transfer (V₁)</label>
                <button @click="target = 'v1'" :class="['target-btn', target === 'v1' ? 'target-btn--active' : '']">
                  {{ target === 'v1' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input id="d-v1" type="number" step="any" v-model="v1" :disabled="target === 'v1'" class="calc-input" placeholder="Stock V1" />
                <select v-model="v1Unit" class="calc-unit-select">
                  <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- C2 Target Conc -->
            <div :class="['input-row-card', target === 'c2' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="d-c2" class="text-xs font-bold text-[var(--color-text)]">Final Diluted Concentration (C₂)</label>
                <button @click="target = 'c2'" :class="['target-btn', target === 'c2' ? 'target-btn--active' : '']">
                  {{ target === 'c2' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input id="d-c2" type="number" step="any" v-model="c2" :disabled="target === 'c2'" class="calc-input" placeholder="Final C2" />
                <select v-model="c2Unit" class="calc-unit-select">
                  <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- V2 Final Volume -->
            <div :class="['input-row-card', target === 'v2' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="d-v2" class="text-xs font-bold text-[var(--color-text)]">Final Total Volume (V₂)</label>
                <button @click="target = 'v2'" :class="['target-btn', target === 'v2' ? 'target-btn--active' : '']">
                  {{ target === 'v2' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input id="d-v2" type="number" step="any" v-model="v2" :disabled="target === 'v2'" class="calc-input" placeholder="Final V2" />
                <select v-model="v2Unit" class="calc-unit-select">
                  <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- MW Input for mixed molar/mass conversions -->
            <div class="p-3.5 rounded-xl border border-[var(--color-border)] bg-black/10 flex items-center justify-between">
              <label for="d-mw" class="text-xs font-semibold text-[var(--color-text-secondary)]">Molecular Weight (MW for molar ↔ mass conversion):</label>
              <div class="flex items-center gap-1.5 w-36">
                <input id="d-mw" type="number" v-model="mw" class="calc-input text-xs" />
                <span class="text-[10px] text-[var(--color-text-muted)]">g/mol</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right (5/12): Hero Result Board -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        <div class="p-6 rounded-2xl border border-[var(--color-primary)]/40 bg-gradient-to-b from-[#1c160c] to-[#0d0a05] shadow-xl relative overflow-hidden">
          <div class="glow-ambient"></div>
          
          <div class="relative z-10 flex flex-col gap-4">
            <div v-if="stdError" class="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
              <strong>⚠️ Error:</strong> {{ stdError }}
            </div>

            <div v-else class="flex flex-col gap-1 my-1">
              <span class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {{ stdResultDisplay.label }}
              </span>
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-4xl sm:text-5xl font-black font-mono text-[var(--color-primary-light)] tracking-tight drop-shadow">
                  {{ stdResultDisplay.val }}
                </span>
                <span class="text-lg font-bold font-mono text-[var(--color-accent-light)]">
                  {{ stdResultDisplay.unit }}
                </span>
              </div>
            </div>

            <!-- Prep Instructions SOP Card -->
            <div v-if="!stdError" class="p-3.5 rounded-xl bg-black/50 border border-white/10 flex flex-col gap-2">
              <span class="text-[10px] uppercase font-bold text-[var(--color-primary-light)] tracking-wider">🧪 Laboratory Preparation SOP:</span>
              <p class="text-xs text-[var(--color-text)] leading-relaxed font-sans">{{ stdOperation }}</p>
            </div>

            <!-- Formula -->
            <div v-if="!stdError" class="p-3 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
              {{ stdFormula }}
            </div>

            <!-- Disclaimer & Contact Link -->
            <div class="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
              <span class="text-[var(--color-text-secondary)] italic text-xs">
                * Note: Results are estimates and may contain minor variances.
              </span>
              <a href="/contact" class="text-[var(--color-primary-light)] font-bold hover:underline flex items-center gap-1 text-xs">
                Contact Ginkvora Formulators →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 2: SERIAL DILUTION ── -->
    <div v-if="activeTab === 'serial'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left (5/12): Controls -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        <div class="p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
            ⚙️ Serial Titration Conditions
          </span>

          <div class="flex flex-col gap-3.5">
            <div>
              <label class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Initial Conc (C₀)</label>
              <div class="flex gap-2">
                <input type="number" v-model="c0" class="calc-input" />
                <select v-model="c0Unit" class="calc-unit-select">
                  <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Dilution Factor (1:X ratio)</label>
              <input type="number" v-model="dilutionFactor" class="calc-input" />
            </div>

            <div>
              <label class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Total Tube Volume</label>
              <div class="flex gap-2">
                <input type="number" v-model="totalVol" class="calc-input" />
                <select v-model="volUnit" class="calc-unit-select">
                  <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 flex justify-between">
                <span>Number of Tubes:</span>
                <span class="font-mono font-bold text-[var(--color-primary-light)]">{{ steps }} Tubes</span>
              </label>
              <input type="range" min="2" max="12" class="w-full accent-[var(--color-primary)] cursor-pointer" v-model.number="steps" />
            </div>
          </div>

          <button @click="handleResetSerial" class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] self-start mt-2">
            🔄 Reset Conditions
          </button>
        </div>
      </div>

      <!-- Right (7/12): Plot & Steps checklist -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        <!-- SVG Curve Card -->
        <div class="p-5 rounded-2xl bg-black/30 border border-[var(--color-border)] flex flex-col gap-3">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
            📈 Log₁₀ Concentration Curve
          </span>
          
          <div class="w-full h-52 bg-black/40 border border-white/10 rounded-xl p-2 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 450 220" class="overflow-visible font-mono">
              <defs>
                <linearGradient id="serGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="var(--color-primary)" />
                  <stop offset="100%" stop-color="var(--color-accent)" />
                </linearGradient>
              </defs>
              <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
                <line v-for="i in 4" :key="i" :x1="50" :y1="20 + i * 36" :x2="430" :y2="20 + i * 36" />
              </g>
              <path :d="svgLinePath" fill="none" stroke="url(#serGradient)" stroke-width="3" stroke-linecap="round" />
              <g v-for="pt in chartPoints" :key="pt.step">
                <circle :cx="pt.x" :cy="pt.y" r="4.5" fill="var(--color-primary-light)" stroke="#060503" stroke-width="2" />
                <text :x="pt.x" :y="pt.y - 8" fill="var(--color-primary-light)" font-size="8" text-anchor="middle">
                  {{ pt.logConc }}
                </text>
                <text :x="pt.x" :y="210" fill="var(--color-text-secondary)" font-size="9" text-anchor="middle">
                  {{ pt.step }}
                </text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Scrollable Tubes checklist -->
        <div class="p-4 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
            Pipetting Protocol Steps Checklist
          </span>
          <div
            v-for="r in serialResults"
            :key="r.step"
            class="p-2.5 rounded-xl border border-[var(--color-border)] bg-black/20 text-xs flex flex-col gap-1"
          >
            <div class="flex justify-between items-center font-mono">
              <strong class="text-[var(--color-primary-light)]">{{ r.step }} Tube</strong>
              <span class="font-bold text-[var(--color-text)]">{{ r.concentration }} {{ c0Unit }}</span>
            </div>
            <p class="text-[11px] text-[var(--color-text-muted)] font-mono">{{ r.operation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 3: BATCH FORMULA SCALING ── -->
    <div v-if="activeTab === 'scaling'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left List Editor (7/12) -->
      <div class="lg:col-span-7 p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
            📋 Formula Recipe Ingredients (%)
          </span>
          <div class="flex gap-1.5">
            <button class="btn btn--secondary py-1 px-2 text-[10px]" @click="loadScalingPreset('serum')">Load Serum</button>
            <button class="btn btn--secondary py-1 px-2 text-[10px]" @click="loadScalingPreset('cream')">Load Cream</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-[var(--color-border)]">
          <div>
            <label class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1 block">Base Batch</label>
            <div class="flex gap-1">
              <input type="number" class="calc-input text-xs py-1" v-model="baseBatchSize" />
              <select v-model="baseBatchUnit" class="calc-unit-select text-xs py-1">
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1 block">Target Batch</label>
            <div class="flex gap-1">
              <input type="number" class="calc-input text-xs py-1" v-model="targetBatchSize" />
              <select v-model="targetBatchUnit" class="calc-unit-select text-xs py-1">
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
          <div v-for="ing in scalingIngredients" :key="ing.id" class="flex gap-2 items-center">
            <input type="text" v-model="ing.name" class="calc-input text-xs flex-1" placeholder="Ingredient Name" />
            <input type="number" v-model="ing.percentage" class="calc-input text-xs w-20 font-mono" placeholder="%" />
            <button @click="removeScalingIngredient(ing.id)" class="text-red-400 hover:text-red-300 p-1 text-sm">🗑️</button>
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
          <button @click="addScalingIngredient" class="btn btn--secondary py-1 px-3 text-xs">➕ Add Ingredient</button>
          <span class="text-xs">
            Sum: <strong :class="Math.abs(scalingTotalPct - 100) > 0.01 ? 'text-amber-400' : 'text-emerald-400'">{{ scalingTotalPct }} %</strong>
          </span>
        </div>
      </div>

      <!-- Right Output Output (5/12) -->
      <div class="lg:col-span-5 p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
        <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
          ⚖️ Scaled Production Weights
        </span>

        <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
          <div
            v-for="ing in scalingIngredients"
            :key="ing.id"
            class="p-2.5 rounded-xl border border-[var(--color-border)] bg-black/30 flex justify-between items-center text-xs"
          >
            <div>
              <div class="font-bold text-[var(--color-text)]">{{ ing.name }}</div>
              <div class="text-[10px] text-[var(--color-text-muted)]">{{ ing.percentage }}%</div>
            </div>
            <span class="font-mono font-bold text-[var(--color-primary-light)] text-sm">
              {{ formatWeight(getWeightInGram(parseFloat(targetBatchSize) || 0, targetBatchUnit) * ((parseFloat(ing.percentage) || 0) / 100), targetBatchUnit) }}
            </span>
          </div>
        </div>

        <div v-if="scalingWarnings.length > 0" class="p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex flex-col gap-1 text-xs text-red-300">
          <strong class="font-bold uppercase tracking-wider text-[10px]">🚨 Regulatory Warnings:</strong>
          <div v-for="(w, idx) in scalingWarnings" :key="idx">{{ w }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.input-row-card {
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.input-row-card--target {
  border-color: rgba(212, 166, 84, 0.5) !important;
  background: rgba(212, 166, 84, 0.05) !important;
}

.target-btn {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.target-btn--active {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-bg) !important;
}

.calc-input {
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.65rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-family: monospace;
  font-size: 0.875rem;
}

.calc-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.calc-input:disabled {
  background: rgba(212, 166, 84, 0.08);
  color: var(--color-primary-light);
  font-weight: 700;
}

.calc-unit-select {
  padding: 0.45rem 0.5rem;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-size: 0.75rem;
}

.glow-ambient {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(212, 166, 84, 0.15) 0%, transparent 70%);
  pointer-events: none;
}
</style>
