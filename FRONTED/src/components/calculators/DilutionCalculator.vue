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
    stdError.value = 'Valid Molecular Weight must be provided for cross-system concentration conversion.';
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
        throw new Error('Calculated initial volume (V₁) is greater than final volume (V₂). Dilution ratio is illogical.');
      }

      v1.value = formatResult(v1_target);
      stdFormula.value = `V₁ = (C₂ × V₂) / C₁ = (${c2Val} ${c2Unit.value} × ${v2Val} ${v2Unit.value}) / ${c1Val} ${c1Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `Transfer ${formatResult(v1_target)} ${v1Unit.value} of initial solution into ${formatResult(solvent_vol)} ${v2Unit.value} of diluent.`;
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
        throw new Error('Calculated final volume (V₂) is smaller than initial volume (V₁). No dilution needed.');
      }

      v2.value = formatResult(v2_target);
      stdFormula.value = `V₂ = (C₁ × V₁) / C₂ = (${c1Val} ${c1Unit.value} × ${v1Val} ${v1Unit.value}) / ${c2Val} ${c2Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `Transfer ${v1Val} ${v1Unit.value} of initial solution into ${formatResult(solvent_vol)} ${v2Unit.value} of diluent (total volume: ${formatResult(v2_target)} ${v2Unit.value}).`;
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
      stdFormula.value = `C₁ = (C₂ × V₂) / V₁ = (${c2Val} ${c2Unit.value} × ${v2Val} ${v2Unit.value}) / ${v1Val} ${v1Unit.value}`;
      stdOperation.value = `Use stock solution with concentration of ${formatResult(c1_target)} ${c1Unit.value}.`;
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
      stdFormula.value = `C₂ = (C₁ × V₁) / V₂ = (${c1Val} ${c1Unit.value} × ${v1Val} ${v1Unit.value}) / ${v2Val} ${v2Unit.value}`;
      
      const solvent_vol = (v2L - v1L) / fV2;
      stdOperation.value = `The final solution concentration will be ${formatResult(c2_target)} ${c2Unit.value}. Operation: Mix ${v1Val} ${v1Unit.value} of initial solution into ${formatResult(solvent_vol)} ${v2Unit.value} of diluent.`;
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
        ? `Pipette ${formatResult(transferVol)} ${volUnit.value} of stock (C0) into Tube 1 containing ${formatResult(solventVol)} ${volUnit.value} of diluent and mix.`
        : `Pipette ${formatResult(transferVol)} ${volUnit.value} of preceding (C${i-1}) into Tube ${i} containing ${formatResult(solventVol)} ${volUnit.value} of diluent and mix.`
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
        warnings.push(`[Regulatory Warning] Ingredient [${ing.name}] at ${pct}% exceeds the safety threshold of ${limitInfo.maxUsagePct}% (${limitInfo.ref}).`);
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

// SVG semi-log line chart generation
const chartPoints = computed(() => {
  if (serialResults.value.length === 0) return [];
  const width = 450;
  const height = 240;
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

// Scaling Presets loaders
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

// Setup watchers
watch([c1, c1Unit, v1, v1Unit, c2, c2Unit, v2, v2Unit, target, mw, activeTab], () => {
  if (activeTab.value === 'standard') {
    calculateStandard();
  }
});

watch([c0, c0Unit, dilutionFactor, steps, totalVol, volUnit, activeTab], () => {
  if (activeTab.value === 'serial') {
    calculateSerial();
  }
});

watch([scalingIngredients, baseBatchSize, baseBatchUnit, targetBatchSize, targetBatchUnit, activeTab], () => {
  if (activeTab.value === 'scaling') {
    calculateScaling();
  }
}, { deep: true });

onMounted(() => {
  calculateStandard();
  calculateSerial();
  calculateScaling();
});
</script>

<template>
  <div class="calculator-wrapper flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold font-display gradient-text--gold">Dilution & Scaling</h2>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Perform Stock Dilutions, Series Titration Curves, or Formula Scaling with regulatory limits
        </p>
      </div>

      <!-- Tab Buttons -->
      <div class="mode-toggle-switch">
        <button
          @click="activeTab = 'standard'"
          :class="['mode-toggle-btn', activeTab === 'standard' ? 'mode-toggle-btn--active' : '']"
        >
          Standard (C1V1)
        </button>
        <button
          @click="activeTab = 'serial'"
          :class="['mode-toggle-btn', activeTab === 'serial' ? 'mode-toggle-btn--active' : '']"
        >
          Serial Dilution
        </button>
        <button
          @click="activeTab = 'scaling'"
          :class="['mode-toggle-btn', activeTab === 'scaling' ? 'mode-toggle-btn--active' : '']"
        >
          Formula Scaling
        </button>
      </div>
    </div>

    <!-- TAB 1: STANDARD DILUTION (C1V1) -->
    <div v-if="activeTab === 'standard'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)] flex items-center gap-2">
          📉 Standard Dilution Parameters
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Stock C1 -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'c1' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Stock Concentration (C₁)</label>
              <button @click="target = 'c1'" :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'c1' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']">
                {{ target === 'c1' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="c1" :disabled="target === 'c1'" />
              <select class="form-input form-select w-28" v-model="c1Unit">
                <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Stock V1 -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'v1' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Stock Volume (V₁)</label>
              <button @click="target = 'v1'" :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'v1' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']">
                {{ target === 'v1' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="v1" :disabled="target === 'v1'" />
              <select class="form-input form-select w-28" v-model="v1Unit">
                <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Target C2 -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'c2' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Final Concentration (C₂)</label>
              <button @click="target = 'c2'" :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'c2' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']">
                {{ target === 'c2' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="c2" :disabled="target === 'c2'" />
              <select class="form-input form-select w-28" v-model="c2Unit">
                <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Target V2 -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'v2' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Final Volume (V₂)</label>
              <button @click="target = 'v2'" :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'v2' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']">
                {{ target === 'v2' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="v2" :disabled="target === 'v2'" />
              <select class="form-input form-select w-28" v-model="v2Unit">
                <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <label class="form-label text-xs font-semibold">Molecular Weight (for Molar ↔ Mass conversion)</label>
          <div class="flex gap-2 items-center">
            <input type="number" class="form-input font-mono w-40" v-model="mw" />
            <span class="text-xs text-[var(--color-text-muted)]">g/mol</span>
          </div>
        </div>
      </div>

      <!-- Action Card -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col justify-between gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">📋 Prep Guide & Formula</h3>

        <div class="flex flex-col gap-4">
          <div v-if="stdError" class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-sm text-[var(--color-error)] flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ stdError }}</span>
          </div>

          <template v-else>
            <div class="p-4 bg-white/[0.02] border border-[var(--color-border)] rounded-xl">
              <span class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mb-1 block">Formula</span>
              <div class="font-mono text-sm text-[var(--color-primary-light)]">{{ stdFormula }}</div>
            </div>

            <div class="p-4 bg-white/[0.02] border border-[var(--color-border)] rounded-xl">
              <span class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mb-1 block">Preparation Steps</span>
              <p class="text-sm text-[var(--color-text)] leading-relaxed">{{ stdOperation }}</p>
            </div>
          </template>
        </div>

        <div class="text-xs text-[var(--color-text-muted)] italic">
          * C₁V₁ = C₂V₂ holds true for both molar concentrations and mass percentage solutions as long as density is constant.
        </div>
      </div>
    </div>

    <!-- TAB 2: SERIAL DILUTION -->
    <div v-if="activeTab === 'serial'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">📈 Input Serial Dilution Conditions</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label text-xs uppercase tracking-wider mb-2 block">Initial Concentration (C₀)</label>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="c0" />
              <select class="form-input form-select w-28" v-model="c0Unit">
                <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label text-xs uppercase tracking-wider mb-2 block">Dilution Factor (e.g. 10 for 1:10)</label>
            <input type="number" class="form-input font-mono" v-model="dilutionFactor" />
          </div>

          <div>
            <label class="form-label text-xs uppercase tracking-wider mb-2 block">Volume per Tube (V_total)</label>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono" v-model="totalVol" />
              <select class="form-input form-select w-28" v-model="volUnit">
                <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label text-xs uppercase tracking-wider mb-2 block font-semibold">Dilution Steps (2 - 12)</label>
            <div class="flex items-center gap-4">
              <input type="range" min="2" max="12" class="flex-1 accent-[var(--color-primary)]" v-model.number="steps" />
              <span class="form-input font-mono text-center w-12 py-1 px-0">{{ steps }}</span>
            </div>
          </div>
        </div>

        <!-- Scrollable checklist steps -->
        <div class="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 mt-4">
          <span class="form-label text-xs font-bold uppercase tracking-wider mb-1">Serial Dilution Steps Checklist</span>
          <div
            v-for="r in serialResults"
            :key="r.step"
            class="p-3 rounded-lg border border-[var(--color-border)] bg-black/10 text-xs flex flex-col gap-1"
          >
            <div class="flex justify-between items-center">
              <strong class="text-[var(--color-primary-light)] font-bold text-sm">{{ r.step }} Tube</strong>
              <div>
                <span class="font-mono text-sm">{{ r.concentration }} {{ c0Unit }}</span>
                <span class="text-[10px] text-[var(--color-text-muted)] ml-3">Log: {{ r.logConc }}</span>
              </div>
            </div>
            <div class="text-[var(--color-text-secondary)] mt-1 font-mono text-[11px]">{{ r.operation }}</div>
          </div>
        </div>

        <button @click="handleResetSerial" class="btn btn--secondary self-start py-2 text-xs flex items-center gap-1.5 mt-2">
          🔄 Reset Parameters
        </button>
      </div>

      <!-- Dilution SVG Plot card -->
      <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-5 justify-between">
        <div>
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)] mb-2 flex items-center gap-2">
            📉 Semi-Log Dilution Curve (Log₁₀ C vs Step)
          </h3>
          <p class="text-xs text-[var(--color-text-secondary)]">
            A linear decline on a semi-log scale verifies exponential dilution scaling.
          </p>
        </div>

        <div class="w-full h-[260px] bg-black/20 border border-[var(--color-border)] rounded-xl flex items-center justify-center p-3">
          <template v-if="serialResults.length > 0">
            <svg width="100%" height="100%" viewBox="0 0 450 240" class="overflow-visible font-mono">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="var(--color-primary)" />
                  <stop offset="100%" stop-color="var(--color-accent)" />
                </linearGradient>
              </defs>
              <!-- Grid lines -->
              <g stroke="rgba(212,166,84,0.06)" stroke-width="1">
                <line v-for="i in 5" :key="i" :x1="50" :y1="20 + i * 32" :x2="430" :y2="20 + i * 32" />
              </g>

              <!-- Plot path line -->
              <path :d="svgLinePath" fill="none" stroke="url(#curveGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Y Labels -->
              <text :x="10" :y="26" fill="var(--color-text-secondary)" font-size="9">Max</text>
              <text :x="10" :y="200" fill="var(--color-text-secondary)" font-size="9">Min</text>

              <!-- Points -->
              <g v-for="pt in chartPoints" :key="pt.step">
                <circle :cx="pt.x" :cy="pt.y" r="5" fill="var(--color-primary-light)" stroke="#060503" stroke-width="2" />
                <!-- Tooltip values shown above dot -->
                <text :x="pt.x" :y="pt.y - 8" fill="var(--color-primary-light)" font-size="8" text-anchor="middle">
                  {{ pt.logConc }}
                </text>
                <!-- X labels -->
                <text :x="pt.x" :y="228" fill="var(--color-text-secondary)" font-size="9" text-anchor="middle">
                  {{ pt.step }}
                </text>
              </g>
            </svg>
          </template>
          <div v-else class="text-xs text-[var(--color-text-muted)]">
            Enter valid parameters to plot the curve
          </div>
        </div>

        <div class="text-[10px] text-[var(--color-text-muted)] leading-relaxed italic">
          * Dilution Curve represents concentration decay. The values on dots show the log₁₀ concentration of each step.
        </div>
      </div>
    </div>

    <!-- TAB 3: FORMULA SCALING & SAFE ALARMS -->
    <div v-if="activeTab === 'scaling'" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Left side: List editor (3 cols) -->
      <div class="lg:col-span-3 glass p-6 border border-[var(--color-border)] flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)]">Formula Component Editor</h3>
          <div class="flex gap-2">
            <button class="btn btn--secondary py-1 px-2.5 text-[11px]" @click="loadScalingPreset('serum')">Load Serum</button>
            <button class="btn btn--secondary py-1 px-2.5 text-[11px]" @click="loadScalingPreset('cream')">Load Cream</button>
          </div>
        </div>

        <!-- Scale ratios configuration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/10 border border-[var(--color-border)] p-4 rounded-xl">
          <div>
            <label class="form-label text-[11px] mb-1.5 uppercase font-bold tracking-wider">Base Batch Size</label>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono py-1 text-xs" v-model="baseBatchSize" />
              <select class="form-input form-select w-20 py-1 text-xs" v-model="baseBatchUnit">
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label text-[11px] mb-1.5 uppercase font-bold tracking-wider">Target Batch Size</label>
            <div class="flex gap-2">
              <input type="number" class="form-input font-mono py-1 text-xs" v-model="targetBatchSize" />
              <select class="form-input form-select w-20 py-1 text-xs" v-model="targetBatchUnit">
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table list header -->
        <div class="grid grid-cols-12 gap-3 px-2 text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-secondary)]">
          <span class="col-span-8">Ingredient / Component Name</span>
          <span class="col-span-3">Percentage (%)</span>
          <span class="col-span-1 text-center">Del</span>
        </div>

        <!-- Table rows scrollable -->
        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          <div
            v-for="(ing, idx) in scalingIngredients"
            :key="ing.id"
            class="grid grid-cols-12 gap-2 items-center"
          >
            <div class="col-span-8">
              <input type="text" class="form-input py-1.5 text-xs" v-model="ing.name" placeholder="Component Name" />
            </div>
            <div class="col-span-3 flex gap-1 items-center">
              <input type="number" class="form-input font-mono py-1.5 text-xs" v-model="ing.percentage" placeholder="%" />
            </div>
            <button @click="removeScalingIngredient(ing.id)" class="col-span-1 flex items-center justify-center text-[var(--color-error)] hover:bg-white/5 rounded-lg py-1">
              🗑️
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center border-t border-[var(--color-border)] pt-4 mt-2">
          <button @click="addScalingIngredient" class="btn btn--secondary py-1.5 px-3 text-xs flex items-center gap-1">
            ➕ Add Component
          </button>
          <div class="text-xs">
            Sum: <span :class="[Math.abs(scalingTotalPct - 100) > 0.01 ? 'text-[var(--color-warning)] font-bold' : 'text-[var(--color-success)] font-bold']">{{ scalingTotalPct }} %</span>
          </div>
        </div>
      </div>

      <!-- Right side: Calculation output checklist & warnings (2 cols) -->
      <div class="lg:col-span-2 glass p-6 border border-[var(--color-border)] flex flex-col justify-between gap-5">
        <div>
          <h3 class="text-lg font-semibold text-[var(--color-primary-light)] mb-3">📋 Scaled Formula output</h3>
          
          <div v-if="Math.abs(scalingTotalPct - 100) > 0.01" class="p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg text-xs text-[var(--color-text)] flex items-center gap-2 mb-4 leading-relaxed">
            <span>⚠️</span>
            <span>Current total percentage is {{ scalingTotalPct }}% (should equal 100% for batch logic).</span>
          </div>

          <!-- Output lists -->
          <div class="flex flex-col gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="ing in scalingIngredients"
              :key="ing.id"
              class="p-2.5 rounded-lg border border-[var(--color-border)] bg-black/10 text-xs flex justify-between items-center"
            >
              <div class="flex flex-col">
                <span class="font-bold text-[var(--color-text)]">{{ ing.name }}</span>
                <span class="text-[10px] text-[var(--color-text-secondary)]">{{ ing.percentage }}%</span>
              </div>
              <span class="font-mono text-xs text-[var(--color-primary-light)] font-bold">
                {{ 
                  formatWeight(
                    getWeightInGram(parseFloat(targetBatchSize) || 0, targetBatchUnit) * ((parseFloat(ing.percentage) || 0) / 100),
                    targetBatchUnit
                  ) 
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Safe regulations alarm box -->
        <div v-if="scalingWarnings.length > 0" class="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl flex flex-col gap-1.5">
          <div class="text-xs uppercase tracking-wider font-bold text-[var(--color-error)] flex items-center gap-1.5">
            🚨 Regulatory Limit Warnings
          </div>
          <div class="flex flex-col gap-1 mt-1">
            <div
              v-for="(w, idx) in scalingWarnings"
              :key="idx"
              class="text-[11px] text-[var(--color-text)] leading-relaxed"
            >
              {{ w }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
