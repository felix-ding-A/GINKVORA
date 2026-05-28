<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { PRESET_INGREDIENTS } from '../../lib/calculators/formulaParser';
import { IU_FACTORS } from '../../lib/calculators/supplementData';

const MASS_UNITS = [
  { label: 'pg', factor: 1e-9 },
  { label: 'ng', factor: 1e-6 },
  { label: 'μg', factor: 1e-3 },
  { label: 'mg', factor: 1 },
  { label: 'g', factor: 1e3 },
  { label: 'kg', factor: 1e6 },
];

const CONC_UNITS = [
  { label: 'fM', factor: 1e-12 },
  { label: 'pM', factor: 1e-9 },
  { label: 'nM', factor: 1e-6 },
  { label: 'μM', factor: 1e-3 },
  { label: 'mM', factor: 1 },
  { label: 'M', factor: 1e3 },
];

const VOL_UNITS = [
  { label: 'nL', factor: 1e-6 },
  { label: 'μL', factor: 1e-3 },
  { label: 'mL', factor: 1 },
  { label: 'L', factor: 1e3 },
];

const calcMode = ref<'molarity' | 'percentage'>('molarity');

// ==========================================
// STATE: MOLARITY MODE
// ==========================================
const mass = ref('88.06');
const massUnit = ref('mg');
const conc = ref('50');
const concUnit = ref('mM');
const volume = ref('10');
const volumeUnit = ref('mL');
const mw = ref('176.12'); // Vitamin C
const target = ref<'mass' | 'conc' | 'volume' | 'mw'>('mass');
const formulaString = ref('');
const molarityError = ref('');

// ==========================================
// STATE: PERCENTAGE MODE (% w/w, % v/v)
// ==========================================
const pctType = ref<'ww' | 'vv'>('ww');
const pctSolute = ref('5');
const pctSoluteUnit = ref('g');
const pctTotal = ref('100');
const pctTotalUnit = ref('g');
const pctValue = ref('5');
const pctTarget = ref<'solute' | 'total' | 'pct'>('pct');
const pctFormulaString = ref('');
const pctError = ref('');

// ==========================================
// STATE: IU ↔ MG CONVERTER
// ==========================================
const iuActiveKey = ref('vitA');
const iuValue = ref('5000');
const mgValue = ref('1.5');

// Computed current IU factor info
const currentIuItem = computed(() => IU_FACTORS[iuActiveKey.value]);

// ==========================================
// CALCULATIONS
// ==========================================
const getSIFactor = (type: 'mass' | 'conc' | 'volume', unit: string): number => {
  if (type === 'mass') {
    const u = MASS_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0; // Standardize to grams
  } else if (type === 'conc') {
    const u = CONC_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0; // Standardize to M
  } else if (type === 'volume') {
    const u = VOL_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0; // Standardize to L
  }
  return 1.0;
};

const formatResult = (num: number): string => {
  if (num === 0) return '0';
  if (num < 1e-4 || num > 1e6) {
    return num.toExponential(4);
  }
  return parseFloat(num.toFixed(4)).toString();
};

const calculateMolarity = () => {
  molarityError.value = '';
  const mVal = parseFloat(mass.value);
  const cVal = parseFloat(conc.value);
  const vVal = parseFloat(volume.value);
  const mwVal = parseFloat(mw.value);

  try {
    if (target.value === 'mass') {
      if (isNaN(cVal) || isNaN(vVal) || isNaN(mwVal)) return;
      if (cVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Concentration, Volume, and Molecular Weight must be greater than 0');
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const mass_g = C_SI * V_SI * mwVal;
      const mass_target = mass_g / getSIFactor('mass', massUnit.value);
      mass.value = formatResult(mass_target);
      formulaString.value = `Mass = Concentration × Volume × MW = ${cVal} ${concUnit.value} × ${vVal} ${volumeUnit.value} × ${mwVal} g/mol`;
    }
    else if (target.value === 'conc') {
      if (isNaN(mVal) || isNaN(vVal) || isNaN(mwVal)) return;
      if (mVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Mass, Volume, and Molecular Weight must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const conc_M = mass_g / (V_SI * mwVal);
      const conc_target = conc_M / getSIFactor('conc', concUnit.value);
      conc.value = formatResult(conc_target);
      formulaString.value = `Concentration = Mass / (Volume × MW) = ${mVal} ${massUnit.value} / (${vVal} ${volumeUnit.value} × ${mwVal} g/mol)`;
    }
    else if (target.value === 'volume') {
      if (isNaN(mVal) || isNaN(cVal) || isNaN(mwVal)) return;
      if (mVal <= 0 || cVal <= 0 || mwVal <= 0) throw new Error('Mass, Concentration, and Molecular Weight must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const volume_L = mass_g / (C_SI * mwVal);
      const volume_target = volume_L / getSIFactor('volume', volumeUnit.value);
      volume.value = formatResult(volume_target);
      formulaString.value = `Volume = Mass / (Concentration × MW) = ${mVal} ${massUnit.value} / (${cVal} ${concUnit.value} × ${mwVal} g/mol)`;
    }
    else if (target.value === 'mw') {
      if (isNaN(mVal) || isNaN(cVal) || isNaN(vVal)) return;
      if (mVal <= 0 || cVal <= 0 || vVal <= 0) throw new Error('Mass, Concentration, and Volume must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const mw_calc = mass_g / (C_SI * V_SI);
      mw.value = formatResult(mw_calc);
      formulaString.value = `Molecular Weight = Mass / (Concentration × Volume) = ${mVal} ${massUnit.value} / (${cVal} ${concUnit.value} × ${vVal} ${volumeUnit.value})`;
    }
  } catch (e: any) {
    molarityError.value = e.message;
  }
};

const calculatePercentage = () => {
  pctError.value = '';
  const soluteVal = parseFloat(pctSolute.value);
  const totalVal = parseFloat(pctTotal.value);
  const pValue = parseFloat(pctValue.value);

  try {
    const getUnitFactor = (unit: string) => {
      if (unit === 'pg') return 1e-12;
      if (unit === 'ng') return 1e-9;
      if (unit === 'μg') return 1e-6;
      if (unit === 'mg') return 1e-3;
      if (unit === 'g' || unit === 'mL') return 1.0;
      if (unit === 'kg' || unit === 'L') return 1e3;
      return 1.0;
    };

    const soluteBase = soluteVal * getUnitFactor(pctSoluteUnit.value);
    const totalBase = totalVal * getUnitFactor(pctTotalUnit.value);

    if (pctTarget.value === 'pct') {
      if (isNaN(soluteVal) || isNaN(totalVal)) return;
      if (soluteVal <= 0 || totalVal <= 0) throw new Error('Solute amount and Total amount must be greater than 0');
      if (soluteBase > totalBase) throw new Error('Solute amount cannot exceed total amount');

      const calculatedPct = (soluteBase / totalBase) * 100;
      pctValue.value = formatResult(calculatedPct);
      
      const labelStr = pctType.value === 'ww' ? 'w/w' : 'v/v';
      pctFormulaString.value = `Percentage (% ${labelStr}) = (Solute / Total) × 100% = (${soluteVal} ${pctSoluteUnit.value} / ${totalTotalLabel(totalVal)}) × 100%`;
    }
    else if (pctTarget.value === 'solute') {
      if (isNaN(totalVal) || isNaN(pValue)) return;
      if (totalVal <= 0 || pValue <= 0 || pValue > 100) throw new Error('Total amount must be > 0, and Percentage must be between 0% and 100%');

      const calculatedSoluteBase = totalBase * (pValue / 100);
      const calculatedSolute = calculatedSoluteBase / getUnitFactor(pctSoluteUnit.value);
      pctSolute.value = formatResult(calculatedSolute);
      
      pctFormulaString.value = `Solute Amount = Total × (Percentage / 100) = ${totalVal} ${pctTotalUnit.value} × (${pValue}% / 100)`;
    }
    else if (pctTarget.value === 'total') {
      if (isNaN(soluteVal) || isNaN(pValue)) return;
      if (soluteVal <= 0 || pValue <= 0 || pValue > 100) throw new Error('Solute amount must be > 0, and Percentage must be between 0% and 100%');

      const calculatedTotalBase = soluteBase / (pValue / 100);
      const calculatedTotal = calculatedTotalBase / getUnitFactor(pctTotalUnit.value);
      pctTotal.value = formatResult(calculatedTotal);
      
      pctFormulaString.value = `Total Amount = Solute / (Percentage / 100) = ${soluteVal} ${pctSoluteUnit.value} / (${pValue}% / 100)`;
    }
  } catch (e: any) {
    pctError.value = e.message;
  }
};

const totalTotalLabel = (val: number): string => {
  return `${val} ${pctTotalUnit.value}`;
};

// IU ↔ Mg conversion
const convertIuToMg = (val: string) => {
  iuValue.value = val;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) {
    mgValue.value = '';
    return;
  }
  const factor = IU_FACTORS[iuActiveKey.value].iuToMg;
  const calculatedMg = num * factor;
  mgValue.value = calculatedMg.toString();
};

const convertMgToIu = (val: string) => {
  mgValue.value = val;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) {
    iuValue.value = '';
    return;
  }
  const factor = IU_FACTORS[iuActiveKey.value].mgToIu;
  const calculatedIu = Math.round(num * factor);
  iuValue.value = calculatedIu.toString();
};

const applyConvertedMg = () => {
  if (!mgValue.value) return;
  if (calcMode.value === 'molarity') {
    mass.value = mgValue.value;
    massUnit.value = 'mg';
    if (target.value === 'mass') {
      target.value = 'conc'; // Prevent overwriting calculated result
    }
  } else {
    pctSolute.value = mgValue.value;
    pctSoluteUnit.value = 'g';
    if (pctTarget.value === 'solute') {
      pctTarget.value = 'pct';
    }
  }
};

const loadPreset = (preset: typeof PRESET_INGREDIENTS[0]) => {
  mw.value = preset.mw.toString();
  if (target.value === 'mw') {
    target.value = 'mass';
  }
};

const handleReset = () => {
  if (calcMode.value === 'molarity') {
    mass.value = '88.06';
    massUnit.value = 'mg';
    conc.value = '50';
    concUnit.value = 'mM';
    volume.value = '10';
    volumeUnit.value = 'mL';
    mw.value = '176.12';
    target.value = 'mass';
    molarityError.value = '';
  } else {
    pctType.value = 'ww';
    pctSolute.value = '5';
    pctSoluteUnit.value = 'g';
    pctTotal.value = '100';
    pctTotalUnit.value = 'g';
    pctValue.value = '5';
    pctTarget.value = 'pct';
    pctError.value = '';
  }
};

// Setup watchers for auto calculation
watch([mass, massUnit, conc, concUnit, volume, volumeUnit, mw, target, calcMode], () => {
  if (calcMode.value === 'molarity') {
    calculateMolarity();
  }
});

watch([pctType, pctSolute, pctSoluteUnit, pctTotal, pctTotalUnit, pctValue, pctTarget, calcMode], () => {
  if (calcMode.value === 'percentage') {
    calculatePercentage();
  }
});

watch(iuActiveKey, () => {
  convertIuToMg(iuValue.value);
});

// Initial trigger
onMounted(() => {
  calculateMolarity();
});
</script>

<template>
  <div class="calculator-wrapper flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold font-display gradient-text--gold">Molarity & Percentage</h2>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Solve for Molarity parameters or Weight/Volume percentage configurations
        </p>
      </div>
      <!-- Mode Toggle Switch -->
      <div class="inline-flex p-1 bg-black/40 rounded-xl border border-[var(--color-border)] self-start">
        <button
          @click="calcMode = 'molarity'"
          :class="['px-4 py-1.5 text-xs font-semibold rounded-lg transition-all', calcMode === 'molarity' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-[var(--color-text-secondary)] hover:text-white']"
        >
          Molarity Mode
        </button>
        <button
          @click="calcMode = 'percentage'"
          :class="['px-4 py-1.5 text-xs font-semibold rounded-lg transition-all', calcMode === 'percentage' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-[var(--color-text-secondary)] hover:text-white']"
        >
          Percentage Mode
        </button>
      </div>
    </div>

    <!-- main Grid layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left side: Parameters Editor (takes 2 cols) -->
      <div class="lg:col-span-2 glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
        <h3 class="text-lg font-semibold text-[var(--color-primary-light)] flex items-center gap-2">
          ⚙️ Target Parameter Configuration
        </h3>

        <!-- Molarity Mode Inputs -->
        <div v-if="calcMode === 'molarity'" class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Mass input -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'mass' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Solute Mass (m)</label>
              <button 
                @click="target = 'mass'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'mass' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ target === 'mass' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="mass"
                :disabled="target === 'mass'"
                placeholder="Enter mass"
              />
              <select class="form-input form-select w-24" v-model="massUnit">
                <option v-for="u in MASS_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Concentration input -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'conc' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Target Concentration (C)</label>
              <button 
                @click="target = 'conc'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'conc' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ target === 'conc' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="conc"
                :disabled="target === 'conc'"
                placeholder="Enter conc"
              />
              <select class="form-input form-select w-24" v-model="concUnit">
                <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Volume input -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'volume' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Solvent Volume (V)</label>
              <button 
                @click="target = 'volume'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'volume' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ target === 'volume' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="volume"
                :disabled="target === 'volume'"
                placeholder="Enter volume"
              />
              <select class="form-input form-select w-24" v-model="volumeUnit">
                <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- Molecular Weight input -->
          <div :class="['p-4 rounded-xl border transition-all', target === 'mw' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Molecular Weight (MW)</label>
              <button 
                @click="target = 'mw'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', target === 'mw' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ target === 'mw' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="mw"
                :disabled="target === 'mw'"
                placeholder="Enter MW"
              />
              <span class="form-input w-24 flex items-center justify-center text-xs text-[var(--color-text-muted)] bg-white/5 select-none">
                g/mol
              </span>
            </div>
          </div>
        </div>

        <!-- Percentage Mode Inputs -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Solute Amount -->
          <div :class="['p-4 rounded-xl border transition-all', pctTarget === 'solute' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Solute Amount</label>
              <button 
                @click="pctTarget = 'solute'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', pctTarget === 'solute' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ pctTarget === 'solute' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="pctSolute"
                :disabled="pctTarget === 'solute'"
                placeholder="Enter solute"
              />
              <select class="form-input form-select w-24" v-model="pctSoluteUnit">
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="kg">kg</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>

          <!-- Total Amount -->
          <div :class="['p-4 rounded-xl border transition-all', pctTarget === 'total' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Total Formula Amount</label>
              <button 
                @click="pctTarget = 'total'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', pctTarget === 'total' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ pctTarget === 'total' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="pctTotal"
                :disabled="pctTarget === 'total'"
                placeholder="Enter total"
              />
              <select class="form-input form-select w-24" v-model="pctTotalUnit">
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>

          <!-- Percentage Value -->
          <div :class="['p-4 rounded-xl border transition-all', pctTarget === 'pct' ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] bg-black/20']">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label font-semibold text-xs uppercase tracking-wider">Concentration Percentage</label>
              <button 
                @click="pctTarget = 'pct'" 
                :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', pctTarget === 'pct' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10']"
              >
                {{ pctTarget === 'pct' ? 'Target' : 'Solve' }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="form-input font-mono"
                v-model="pctValue"
                :disabled="pctTarget === 'pct'"
                placeholder="Enter percentage"
              />
              <span class="form-input w-24 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] bg-white/5 select-none">
                % ({{ pctType === 'ww' ? 'w/w' : 'v/v' }})
              </span>
            </div>
          </div>

          <!-- Pct Type Select -->
          <div class="p-4 rounded-xl border border-[var(--color-border)] bg-black/20">
            <label class="form-label font-semibold text-xs uppercase tracking-wider mb-2 block">Percentage Relation Type</label>
            <div class="flex gap-4 h-[42px] items-center">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="ww" v-model="pctType" class="accent-[var(--color-primary)]" />
                Weight-in-Weight (w/w)
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="vv" v-model="pctType" class="accent-[var(--color-primary)]" />
                Volume-in-Volume (v/v)
              </label>
            </div>
          </div>
        </div>

        <!-- Formulas and Errors -->
        <div class="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <div v-if="molarityError || pctError" class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-sm text-[var(--color-error)] flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ calcMode === 'molarity' ? molarityError : pctError }}</span>
          </div>

          <div v-else class="p-4 bg-white/[0.02] border border-[var(--color-border)] rounded-xl">
            <div class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 font-bold">Calculation Equation</div>
            <div class="font-mono text-sm text-[var(--color-primary-light)]">
              {{ calcMode === 'molarity' ? formulaString : pctFormulaString }}
            </div>
          </div>

          <button @click="handleReset" class="btn btn--secondary self-start py-2 text-xs flex items-center gap-1.5">
            🔄 Reset Calculator
          </button>
        </div>
      </div>

      <!-- Right side: Sidebar Helpers (Presets & Converter) -->
      <div class="flex flex-col gap-6">
        <!-- Preset Molecular Weights (Molarity mode only) -->
        <div v-if="calcMode === 'molarity'" class="glass p-5 border border-[var(--color-border)] flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-[var(--color-primary-light)] flex items-center gap-2">
            🧬 Ingredient MW Presets
          </h3>
          <div class="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            <button
              v-for="item in PRESET_INGREDIENTS"
              :key="item.nameCn"
              @click="loadPreset(item)"
              class="w-full text-left p-2.5 rounded-lg border border-[var(--color-border)] bg-black/10 hover:bg-white/[0.04] transition-all flex justify-between items-center"
            >
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-[var(--color-text)]">{{ item.nameEn }}</span>
                <span class="text-[10px] text-[var(--color-text-secondary)]">{{ item.formula }}</span>
              </div>
              <span class="text-xs font-mono text-[var(--color-primary)] font-bold">{{ item.mw }}</span>
            </button>
          </div>
        </div>

        <!-- Vitamin IU ↔ mg Activity Converter -->
        <div class="glass p-5 border border-[var(--color-border)] flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-[var(--color-primary-light)] flex items-center gap-2">
            🧪 Vitamin IU ↔ mg Converter
          </h3>
          
          <div class="flex flex-col gap-3">
            <div>
              <label class="form-label text-[11px] mb-1.5 block">Vitamin Active Ingredient</label>
              <select class="form-input form-select text-xs" v-model="iuActiveKey">
                <option value="vitA">Vitamin A (Retinol)</option>
                <option value="vitD3">Vitamin D3 (Cholecalciferol)</option>
                <option value="vitE">Vitamin E (d-α-Tocopherol)</option>
              </select>
            </div>

            <!-- Active Factors Info Card -->
            <div class="p-3 bg-black/30 border border-[var(--color-border)] rounded-lg text-[11px] text-[var(--color-text-secondary)]">
              <div class="flex justify-between mb-1">
                <span>Ingredient Type:</span>
                <span class="font-bold text-[var(--color-text)]">{{ currentIuItem.nameEn || currentIuItem.nameCn }}</span>
              </div>
              <div class="flex justify-between">
                <span>Standard activity:</span>
                <span class="font-mono text-[var(--color-primary)]">1 mg = {{ formatResult(currentIuItem.mgToIu) }} IU</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label text-[10px] mb-1 block">Activity (IU)</label>
                <input
                  type="number"
                  class="form-input font-mono text-xs"
                  :value="iuValue"
                  @input="convertIuToMg(($event.target as HTMLInputElement).value)"
                  placeholder="IU amount"
                />
              </div>
              <div>
                <label class="form-label text-[10px] mb-1 block">Mass (mg)</label>
                <input
                  type="number"
                  class="form-input font-mono text-xs"
                  :value="mgValue"
                  @input="convertMgToIu(($event.target as HTMLInputElement).value)"
                  placeholder="mg amount"
                />
              </div>
            </div>

            <button
              @click="applyConvertedMg"
              :disabled="!mgValue"
              class="w-full btn btn--gold text-xs py-2 mt-2 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1"
            >
              📥 Apply Mass to Left Pane
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
