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
// STATE: IU ↔ MG CONVERTER & PRESET TOGGLE
// ==========================================
const iuActiveKey = ref('vitA');
const iuValue = ref('5000');
const mgValue = ref('1.5');
const activeRightTab = ref<'presets' | 'iu'>('presets');

const currentIuItem = computed(() => IU_FACTORS[iuActiveKey.value]);

// Computed active result value for the Hero Display
const activeResultDisplay = computed(() => {
  if (calcMode.value === 'molarity') {
    if (target.value === 'mass') return { val: mass.value, unit: massUnit.value, label: 'Solute Mass (m)' };
    if (target.value === 'conc') return { val: conc.value, unit: concUnit.value, label: 'Concentration (C)' };
    if (target.value === 'volume') return { val: volume.value, unit: volumeUnit.value, label: 'Solvent Volume (V)' };
    if (target.value === 'mw') return { val: mw.value, unit: 'g/mol', label: 'Molecular Weight (MW)' };
  } else {
    if (pctTarget.value === 'solute') return { val: pctSolute.value, unit: pctSoluteUnit.value, label: 'Solute Amount' };
    if (pctTarget.value === 'total') return { val: pctTotal.value, unit: pctTotalUnit.value, label: 'Total Formula Amount' };
    if (pctTarget.value === 'pct') return { val: pctValue.value, unit: `% (${pctType.value === 'ww' ? 'w/w' : 'v/v'})`, label: 'Concentration Percentage' };
  }
  return { val: '0', unit: '', label: '' };
});

// ==========================================
// CALCULATIONS
// ==========================================
const getSIFactor = (type: 'mass' | 'conc' | 'volume', unit: string): number => {
  if (type === 'mass') {
    const u = MASS_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0;
  } else if (type === 'conc') {
    const u = CONC_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0;
  } else if (type === 'volume') {
    const u = VOL_UNITS.find(x => x.label === unit);
    return u ? u.factor / 1e3 : 1.0;
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
      if (cVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Concentration, Volume, and MW must be greater than 0');
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const mass_g = C_SI * V_SI * mwVal;
      const mass_target = mass_g / getSIFactor('mass', massUnit.value);
      mass.value = formatResult(mass_target);
      formulaString.value = `Mass = Concentration × Volume × MW\n= ${cVal} ${concUnit.value} × ${vVal} ${volumeUnit.value} × ${mwVal} g/mol`;
    }
    else if (target.value === 'conc') {
      if (isNaN(mVal) || isNaN(vVal) || isNaN(mwVal)) return;
      if (mVal <= 0 || vVal <= 0 || mwVal <= 0) throw new Error('Mass, Volume, and MW must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const conc_M = mass_g / (V_SI * mwVal);
      const conc_target = conc_M / getSIFactor('conc', concUnit.value);
      conc.value = formatResult(conc_target);
      formulaString.value = `Concentration = Mass / (Volume × MW)\n= ${mVal} ${massUnit.value} / (${vVal} ${volumeUnit.value} × ${mwVal} g/mol)`;
    }
    else if (target.value === 'volume') {
      if (isNaN(mVal) || isNaN(cVal) || isNaN(mwVal)) return;
      if (mVal <= 0 || cVal <= 0 || mwVal <= 0) throw new Error('Mass, Concentration, and MW must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const volume_L = mass_g / (C_SI * mwVal);
      const volume_target = volume_L / getSIFactor('volume', volumeUnit.value);
      volume.value = formatResult(volume_target);
      formulaString.value = `Volume = Mass / (Concentration × MW)\n= ${mVal} ${massUnit.value} / (${cVal} ${concUnit.value} × ${mwVal} g/mol)`;
    }
    else if (target.value === 'mw') {
      if (isNaN(mVal) || isNaN(cVal) || isNaN(vVal)) return;
      if (mVal <= 0 || cVal <= 0 || vVal <= 0) throw new Error('Mass, Concentration, and Volume must be greater than 0');
      const mass_g = mVal * getSIFactor('mass', massUnit.value);
      const C_SI = cVal * getSIFactor('conc', concUnit.value);
      const V_SI = vVal * getSIFactor('volume', volumeUnit.value);
      const mw_calc = mass_g / (C_SI * V_SI);
      mw.value = formatResult(mw_calc);
      formulaString.value = `Molecular Weight = Mass / (Concentration × Volume)\n= ${mVal} ${massUnit.value} / (${cVal} ${concUnit.value} × ${vVal} ${volumeUnit.value})`;
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
      pctFormulaString.value = `Percentage (% ${labelStr}) = (Solute / Total) × 100%\n= (${soluteVal} ${pctSoluteUnit.value} / ${totalVal} ${pctTotalUnit.value}) × 100%`;
    }
    else if (pctTarget.value === 'solute') {
      if (isNaN(totalVal) || isNaN(pValue)) return;
      if (totalVal <= 0 || pValue <= 0 || pValue > 100) throw new Error('Total amount must be > 0, and Percentage must be between 0% and 100%');

      const calculatedSoluteBase = totalBase * (pValue / 100);
      const calculatedSolute = calculatedSoluteBase / getUnitFactor(pctSoluteUnit.value);
      pctSolute.value = formatResult(calculatedSolute);
      
      pctFormulaString.value = `Solute Amount = Total × (Percentage / 100)\n= ${totalVal} ${pctTotalUnit.value} × (${pValue}% / 100)`;
    }
    else if (pctTarget.value === 'total') {
      if (isNaN(soluteVal) || isNaN(pValue)) return;
      if (soluteVal <= 0 || pValue <= 0 || pValue > 100) throw new Error('Solute amount must be > 0, and Percentage must be between 0% and 100%');

      const calculatedTotalBase = soluteBase / (pValue / 100);
      const calculatedTotal = calculatedTotalBase / getUnitFactor(pctTotalUnit.value);
      pctTotal.value = formatResult(calculatedTotal);
      
      pctFormulaString.value = `Total Amount = Solute / (Percentage / 100)\n= ${soluteVal} ${pctSoluteUnit.value} / (${pValue}% / 100)`;
    }
  } catch (e: any) {
    pctError.value = e.message;
  }
};

const convertIuToMg = (val: string) => {
  iuValue.value = val;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) {
    mgValue.value = '';
    return;
  }
  const factor = IU_FACTORS[iuActiveKey.value].iuToMg;
  mgValue.value = (num * factor).toString();
};

const convertMgToIu = (val: string) => {
  mgValue.value = val;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) {
    iuValue.value = '';
    return;
  }
  const factor = IU_FACTORS[iuActiveKey.value].mgToIu;
  iuValue.value = Math.round(num * factor).toString();
};

const applyConvertedMg = () => {
  if (!mgValue.value) return;
  if (calcMode.value === 'molarity') {
    mass.value = mgValue.value;
    massUnit.value = 'mg';
    if (target.value === 'mass') target.value = 'conc';
  } else {
    pctSolute.value = mgValue.value;
    pctSoluteUnit.value = 'g';
    if (pctTarget.value === 'solute') pctTarget.value = 'pct';
  }
};

const loadPreset = (preset: typeof PRESET_INGREDIENTS[0]) => {
  mw.value = preset.mw.toString();
  if (target.value === 'mw') target.value = 'mass';
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

watch([mass, massUnit, conc, concUnit, volume, volumeUnit, mw, target, calcMode], () => {
  if (calcMode.value === 'molarity') calculateMolarity();
});

watch([pctType, pctSolute, pctSoluteUnit, pctTotal, pctTotalUnit, pctValue, pctTarget, calcMode], () => {
  if (calcMode.value === 'percentage') calculatePercentage();
});

watch(iuActiveKey, () => {
  convertIuToMg(iuValue.value);
});

onMounted(() => {
  calculateMolarity();
});
</script>

<template>
  <div class="molarity-calc-container flex flex-col gap-6">
    <!-- Top Bar: Header & Mode Switcher -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
      <div>
        <h3 class="text-lg font-bold font-display text-[var(--color-text)]">Molarity & Percentage Solver</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Select what variable to calculate — inputs are on the left, live result is highlighted on the right.
        </p>
      </div>

      <!-- Mode Pill Toggle -->
      <div class="inline-flex p-1 bg-black/40 border border-[var(--color-border)] rounded-xl self-start sm:self-auto">
        <button
          @click="calcMode = 'molarity'"
          :class="[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
            calcMode === 'molarity'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md font-bold'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          ]"
        >
          Molarity (M)
        </button>
        <button
          @click="calcMode = 'percentage'"
          :class="[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
            calcMode === 'percentage'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md font-bold'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          ]"
        >
          Percentage (% w/w)
        </button>
      </div>
    </div>

    <!-- Main Two-Column Layout: Left (Inputs) vs Right (Hero Result Board) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- ── LEFT COLUMN (7/12): INPUT PARAMETERS PANEL ── -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        
        <div class="panel-card p-5 rounded-2xl bg-black/20 border border-[var(--color-border)]">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)] flex items-center gap-1.5">
              <span>📥</span> Input Parameters
            </span>
            <span class="text-[11px] text-[var(--color-text-muted)]">
              Click <strong class="text-[var(--color-primary-light)]">Solve Target</strong> to compute that variable
            </span>
          </div>

          <!-- MOLARITY MODE INPUTS -->
          <div v-if="calcMode === 'molarity'" class="flex flex-col gap-3.5">
            <!-- 1. Mass Input -->
            <div :class="['input-row-card', target === 'mass' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="m-mass" class="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Solute Mass (m)</span>
                </label>
                <button
                  @click="target = 'mass'"
                  :class="['target-btn', target === 'mass' ? 'target-btn--active' : '']"
                >
                  {{ target === 'mass' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="m-mass"
                  type="number"
                  step="any"
                  v-model="mass"
                  :disabled="target === 'mass'"
                  class="calc-input"
                  placeholder="Enter mass"
                />
                <select v-model="massUnit" class="calc-unit-select" aria-label="Mass Unit">
                  <option v-for="u in MASS_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- 2. Concentration Input -->
            <div :class="['input-row-card', target === 'conc' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="m-conc" class="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Target Concentration (C)</span>
                </label>
                <button
                  @click="target = 'conc'"
                  :class="['target-btn', target === 'conc' ? 'target-btn--active' : '']"
                >
                  {{ target === 'conc' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="m-conc"
                  type="number"
                  step="any"
                  v-model="conc"
                  :disabled="target === 'conc'"
                  class="calc-input"
                  placeholder="Enter concentration"
                />
                <select v-model="concUnit" class="calc-unit-select" aria-label="Concentration Unit">
                  <option v-for="u in CONC_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- 3. Volume Input -->
            <div :class="['input-row-card', target === 'volume' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="m-vol" class="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Solvent Volume (V)</span>
                </label>
                <button
                  @click="target = 'volume'"
                  :class="['target-btn', target === 'volume' ? 'target-btn--active' : '']"
                >
                  {{ target === 'volume' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="m-vol"
                  type="number"
                  step="any"
                  v-model="volume"
                  :disabled="target === 'volume'"
                  class="calc-input"
                  placeholder="Enter volume"
                />
                <select v-model="volumeUnit" class="calc-unit-select" aria-label="Volume Unit">
                  <option v-for="u in VOL_UNITS" :key="u.label" :value="u.label">{{ u.label }}</option>
                </select>
              </div>
            </div>

            <!-- 4. Molecular Weight Input -->
            <div :class="['input-row-card', target === 'mw' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="m-mw" class="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Molecular Weight (MW)</span>
                </label>
                <button
                  @click="target = 'mw'"
                  :class="['target-btn', target === 'mw' ? 'target-btn--active' : '']"
                >
                  {{ target === 'mw' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="m-mw"
                  type="number"
                  step="any"
                  v-model="mw"
                  :disabled="target === 'mw'"
                  class="calc-input"
                  placeholder="Enter molecular weight"
                />
                <span class="calc-unit-badge">g/mol</span>
              </div>
            </div>
          </div>

          <!-- PERCENTAGE MODE INPUTS -->
          <div v-else class="flex flex-col gap-3.5">
            <!-- 1. Solute Amount -->
            <div :class="['input-row-card', pctTarget === 'solute' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="pct-s" class="text-xs font-bold text-[var(--color-text)]">Solute Amount</label>
                <button
                  @click="pctTarget = 'solute'"
                  :class="['target-btn', pctTarget === 'solute' ? 'target-btn--active' : '']"
                >
                  {{ pctTarget === 'solute' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="pct-s"
                  type="number"
                  v-model="pctSolute"
                  :disabled="pctTarget === 'solute'"
                  class="calc-input"
                  placeholder="Enter solute"
                />
                <select v-model="pctSoluteUnit" class="calc-unit-select" aria-label="Solute Unit">
                  <option value="g">g</option>
                  <option value="mg">mg</option>
                  <option value="kg">kg</option>
                  <option value="mL">mL</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <!-- 2. Total Formula Amount -->
            <div :class="['input-row-card', pctTarget === 'total' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="pct-t" class="text-xs font-bold text-[var(--color-text)]">Total Solution Mass/Vol</label>
                <button
                  @click="pctTarget = 'total'"
                  :class="['target-btn', pctTarget === 'total' ? 'target-btn--active' : '']"
                >
                  {{ pctTarget === 'total' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="pct-t"
                  type="number"
                  v-model="pctTotal"
                  :disabled="pctTarget === 'total'"
                  class="calc-input"
                  placeholder="Enter total"
                />
                <select v-model="pctTotalUnit" class="calc-unit-select" aria-label="Total Unit">
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="mL">mL</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <!-- 3. Percentage Concentration -->
            <div :class="['input-row-card', pctTarget === 'pct' ? 'input-row-card--target' : '']">
              <div class="flex items-center justify-between mb-1.5">
                <label for="pct-v" class="text-xs font-bold text-[var(--color-text)]">Concentration Percentage</label>
                <button
                  @click="pctTarget = 'pct'"
                  :class="['target-btn', pctTarget === 'pct' ? 'target-btn--active' : '']"
                >
                  {{ pctTarget === 'pct' ? '⚡ Solving Target' : 'Solve Target' }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  id="pct-v"
                  type="number"
                  v-model="pctValue"
                  :disabled="pctTarget === 'pct'"
                  class="calc-input"
                  placeholder="Enter percentage"
                />
                <span class="calc-unit-badge">% ({{ pctType === 'ww' ? 'w/w' : 'v/v' }})</span>
              </div>
            </div>

            <!-- 4. Percentage Type Radio -->
            <div class="p-3.5 rounded-xl border border-[var(--color-border)] bg-black/20 flex items-center justify-between">
              <span class="text-xs font-semibold text-[var(--color-text-secondary)]">Ratio Basis:</span>
              <div class="flex gap-4">
                <label class="flex items-center gap-1.5 text-xs text-[var(--color-text)] cursor-pointer">
                  <input type="radio" value="ww" v-model="pctType" class="accent-[var(--color-primary)]" />
                  Weight-in-Weight (w/w)
                </label>
                <label class="flex items-center gap-1.5 text-xs text-[var(--color-text)] cursor-pointer">
                  <input type="radio" value="vv" v-model="pctType" class="accent-[var(--color-primary)]" />
                  Volume-in-Volume (v/v)
                </label>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <button @click="handleReset" class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 transition-colors">
              <span>🔄</span> Reset to defaults
            </button>
            <span class="text-[10px] text-[var(--color-text-muted)] italic">
              Auto-calculates on keypress
            </span>
          </div>
        </div>
      </div>

      <!-- ── RIGHT COLUMN (5/12): HERO RESULT BOARD & TOOLS ── -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        
        <!-- 🎯 HERO HIGH-CONTRAST RESULT BOARD -->
        <div class="result-hero-board p-6 rounded-2xl border border-[var(--color-primary)]/40 bg-gradient-to-b from-[#1c160c] to-[#0d0a05] shadow-xl relative overflow-hidden">
          <div class="glow-ambient"></div>
          
          <div class="relative z-10 flex flex-col gap-4">
            <!-- Error State -->
            <div v-if="molarityError || pctError" class="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 leading-relaxed">
              <strong>⚠️ Calculation Notice:</strong>
              <p class="mt-1">{{ calcMode === 'molarity' ? molarityError : pctError }}</p>
            </div>

            <!-- Main Result Output Display -->
            <div v-else class="flex flex-col gap-1 my-1">
              <span class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {{ activeResultDisplay.label }}
              </span>

              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-4xl sm:text-5xl font-black font-mono text-[var(--color-primary-light)] tracking-tight drop-shadow-md">
                  {{ activeResultDisplay.val }}
                </span>
                <span class="text-lg font-bold font-mono text-[var(--color-accent-light)]">
                  {{ activeResultDisplay.unit }}
                </span>
              </div>
            </div>

            <!-- Step Formula Display -->
            <div class="p-3.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-[var(--color-primary-light)] leading-relaxed whitespace-pre-line">
              <div class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-sans mb-1 font-bold">
                Formula Breakdown:
              </div>
              {{ calcMode === 'molarity' ? formulaString : pctFormulaString }}
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

        <!-- 🛠️ AUXILIARY TOOLS TABS: PRESETS & CONVERTER -->
        <div class="aux-tools-card p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
          <!-- Tools Tab Bar -->
          <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
            <div class="flex gap-2">
              <button
                @click="activeRightTab = 'presets'"
                :class="[
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  activeRightTab === 'presets'
                    ? 'bg-white/10 text-[var(--color-primary-light)] border border-white/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                ]"
              >
                🧬 MW Presets
              </button>
              <button
                @click="activeRightTab = 'iu'"
                :class="[
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  activeRightTab === 'iu'
                    ? 'bg-white/10 text-[var(--color-primary-light)] border border-white/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                ]"
              >
                🧪 Vitamin IU ↔ mg
              </button>
            </div>
          </div>

          <!-- TAB A: INGREDIENT PRESETS -->
          <div v-if="activeRightTab === 'presets'" class="flex flex-col gap-2">
            <span class="text-[11px] text-[var(--color-text-muted)]">
              Click any common ingredient to load its Molecular Weight into the calculator:
            </span>
            <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <button
                v-for="item in PRESET_INGREDIENTS"
                :key="item.nameCn"
                @click="loadPreset(item)"
                class="w-full text-left p-2 rounded-lg border border-[var(--color-border)] bg-black/10 hover:bg-white/[0.04] transition-all flex justify-between items-center group"
              >
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-light)]">
                    {{ item.nameEn }}
                  </span>
                  <span class="text-[10px] font-mono text-[var(--color-text-muted)]">{{ item.formula }}</span>
                </div>
                <span class="text-xs font-mono font-bold text-[var(--color-primary)] bg-white/5 px-2 py-0.5 rounded">
                  {{ item.mw }}
                </span>
              </button>
            </div>
          </div>

          <!-- TAB B: VITAMIN IU CONVERTER -->
          <div v-else-if="activeRightTab === 'iu'" class="flex flex-col gap-3">
            <div>
              <label for="iu-select" class="text-[11px] text-[var(--color-text-muted)] mb-1 block">Select Vitamin:</label>
              <select id="iu-select" v-model="iuActiveKey" class="calc-unit-select w-full text-xs">
                <option value="vitA">Vitamin A (Retinol)</option>
                <option value="vitD3">Vitamin D3 (Cholecalciferol)</option>
                <option value="vitE">Vitamin E (d-α-Tocopherol)</option>
              </select>
            </div>

            <div class="p-2.5 rounded-lg bg-black/30 border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] flex justify-between font-mono">
              <span>Standard Activity:</span>
              <span class="text-[var(--color-primary-light)] font-bold">1 mg = {{ currentIuItem.mgToIu }} IU</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="converter-iu" class="text-[10px] text-[var(--color-text-muted)] mb-1 block">Activity (IU)</label>
                <input
                  id="converter-iu"
                  type="number"
                  class="calc-input text-xs font-mono"
                  :value="iuValue"
                  @input="convertIuToMg(($event.target as HTMLInputElement).value)"
                  placeholder="IU"
                />
              </div>
              <div>
                <label for="converter-mg" class="text-[10px] text-[var(--color-text-muted)] mb-1 block">Mass (mg)</label>
                <input
                  id="converter-mg"
                  type="number"
                  class="calc-input text-xs font-mono"
                  :value="mgValue"
                  @input="convertMgToIu(($event.target as HTMLInputElement).value)"
                  placeholder="mg"
                />
              </div>
            </div>

            <button
              @click="applyConvertedMg"
              :disabled="!mgValue"
              class="w-full btn btn--gold py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              📥 Apply mg to Solute Mass
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── ROW CARDS & INPUT STYLING ── */
.input-row-card {
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.input-row-card--target {
  border-color: rgba(212, 166, 84, 0.5) !important;
  background: rgba(212, 166, 84, 0.05) !important;
  box-shadow: 0 0 12px rgba(212, 166, 84, 0.08);
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
  transition: all 0.15s ease;
}

.target-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
}

.target-btn--active {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-bg) !important;
}

.calc-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-family: monospace;
  font-size: 0.9375rem;
  transition: border-color 0.15s ease;
}

.calc-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.calc-input:disabled {
  background: rgba(212, 166, 84, 0.08);
  color: var(--color-primary-light);
  font-weight: 700;
  cursor: default;
}

.calc-unit-select {
  padding: 0.5rem 0.625rem;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-size: 0.8125rem;
  cursor: pointer;
}

.calc-unit-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  user-select: none;
}

/* ── HERO RESULT BOARD ── */
.result-hero-board {
  box-shadow: 0 10px 30px -10px rgba(212, 166, 84, 0.15);
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
