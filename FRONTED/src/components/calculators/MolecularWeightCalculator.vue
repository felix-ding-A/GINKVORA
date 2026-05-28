<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { parseFormula, PRESET_INGREDIENTS, ATOMIC_WEIGHTS } from '../../lib/calculators/formulaParser';

const formula = ref('C10H16N2O2');
const searchTerm = ref('');
const mwResult = ref<ReturnType<typeof parseFormula> | null>(null);

const calculateMW = () => {
  mwResult.value = parseFormula(formula.value);
};

// Search presets
const filteredPresets = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return PRESET_INGREDIENTS;
  return PRESET_INGREDIENTS.filter(
    p => p.nameEn.toLowerCase().includes(term) || 
         p.nameCn.toLowerCase().includes(term) || 
         p.formula.toLowerCase().includes(term)
  );
});

// Match typed formula in presets database
const matchedPreset = computed(() => {
  const cleanTyped = formula.value.replace(/\s+/g, '');
  return PRESET_INGREDIENTS.find(
    p => p.formula.replace(/\s+/g, '') === cleanTyped
  );
});

// Element mass percentage breakdown
const breakdown = computed(() => {
  if (!mwResult.value || mwResult.value.error || mwResult.value.molecularWeight === 0) return [];
  
  const resultList = Object.entries(mwResult.value.composition).map(([element, count]) => {
    const atomInfo = ATOMIC_WEIGHTS[element];
    const atomW = atomInfo?.weight || 0;
    const subtotal = atomW * count;
    const percentage = (subtotal / mwResult.value!.molecularWeight) * 100;
    
    return {
      element,
      nameCn: atomInfo?.nameCn || 'Unknown',
      nameEn: atomInfo?.nameEn || 'Unknown',
      count,
      atomicWeight: atomW,
      subtotal: parseFloat(subtotal.toFixed(4)),
      percentage: parseFloat(percentage.toFixed(2))
    };
  });

  return resultList.sort((a, b) => b.percentage - a.percentage);
});

const handleKeyPress = (char: string) => {
  formula.value += char;
};

const handleBackspace = () => {
  formula.value = formula.value.slice(0, -1);
};

const handleClear = () => {
  formula.value = '';
};

// Color palettes for breakdown segments (Gold, Orange, Green, Warm tones)
const colors = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-success)',
  '#f09050',
  '#f0c878',
  '#a07830',
  '#b05818',
  '#c8b898',
  '#7a6848'
];

watch(formula, () => {
  calculateMW();
});

onMounted(() => {
  calculateMW();
});
</script>

<template>
  <div class="calculator-wrapper flex flex-col gap-6">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
      <div>
        <h2 class="text-2xl font-bold font-display gradient-text--gold">Molecular Weight</h2>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Parse complex formulas (hydrates, nested brackets) and analyze element mass percentage composition
        </p>
      </div>
      <button @click="formula = 'C10H16N2O2'" class="btn btn--secondary py-1 px-3 text-xs flex items-center gap-1">
        🔄 Reset
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left & Center: Editors & Breakdown (2 cols) -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- Input & Keyboard Panel -->
        <div class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
          <div>
            <label class="form-label text-xs uppercase font-bold tracking-wider mb-2 block">Enter Chemical Formula</label>
            <input
              type="text"
              class="form-input font-mono text-xl py-3 px-4 border border-[var(--color-border)]"
              v-model="formula"
              placeholder="e.g. Ca(OH)2 or CuSO4·5H2O"
            />
          </div>

          <!-- Virtual Keyboard for clean touchscreen/glove laboratory environment -->
          <div>
            <span class="form-label text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider mb-2.5 block">
              Laboratory Virtual Keyboard (Quick Input)
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="char in ['C', 'H', 'O', 'N', 'P', 'S', 'Na', 'Cl', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', '(', ')', '·', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']"
                :key="char"
                @click="handleKeyPress(char)"
                class="px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-black/10 text-xs font-mono font-bold hover:bg-white/[0.04] transition-all min-w-[36px]"
              >
                {{ char }}
              </button>
              <button
                @click="handleBackspace"
                class="px-4 py-1.5 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 text-xs text-[var(--color-error)] font-bold hover:bg-[var(--color-error)]/15 transition-all min-w-[60px]"
              >
                Back
              </button>
              <button
                @click="handleClear"
                class="px-4 py-1.5 rounded-lg border border-[var(--color-border)] bg-white/5 text-xs text-[var(--color-text-secondary)] hover:bg-white/10 transition-all min-w-[60px]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Parse Result Panel -->
        <div v-if="mwResult" class="glass p-6 border border-[var(--color-border)] flex flex-col gap-6">
          <!-- Failure Alert -->
          <div v-if="mwResult.error" class="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-sm text-[var(--color-error)] flex items-center gap-2">
            <span>⚠️</span>
            <div><strong>Formula parsing failed:</strong> {{ mwResult.error }}</div>
          </div>

          <template v-else>
            <!-- Header display -->
            <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-4">
              <div>
                <span class="form-label text-[10px] uppercase font-bold tracking-wider mb-0.5 block">Parsed Formula</span>
                <strong class="text-xl font-mono text-[var(--color-primary-light)]">{{ mwResult.formula }}</strong>
              </div>
              <div class="text-right">
                <span class="form-label text-[10px] uppercase font-bold tracking-wider mb-0.5 block">Calculated Molecular Weight</span>
                <strong class="text-3xl font-mono text-[var(--color-accent-light)] font-bold">
                  {{ mwResult.molecularWeight }} <span class="text-sm font-medium text-[var(--color-text-secondary)]">g/mol</span>
                </strong>
              </div>
            </div>

            <!-- Preset detail info match -->
            <div v-if="matchedPreset" class="p-4 rounded-xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 flex gap-3 text-xs leading-relaxed">
              <span class="text-base">ℹ️</span>
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="text-[var(--color-text)] font-semibold text-sm">{{ matchedPreset.nameEn }}</strong>
                  <span class="px-2 py-0.5 bg-white/5 border border-[var(--color-border)] rounded text-[9px] text-[var(--color-primary)] uppercase tracking-wider font-bold">
                    {{ matchedPreset.type }}
                  </span>
                </div>
                <p class="text-[var(--color-text-secondary)]">{{ matchedPreset.desc }}</p>
              </div>
            </div>

            <!-- Stacked bar graph of breakdown -->
            <div>
              <h4 class="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                📊 Element Mass Percentage Breakdown
              </h4>

              <div class="flex h-4 w-full rounded-full overflow-hidden mb-5 bg-black/30 border border-[var(--color-border)]">
                <div
                  v-for="(item, idx) in breakdown"
                  :key="item.element"
                  :style="{
                    width: `${item.percentage}%`,
                    backgroundColor: colors[idx % colors.length]
                  }"
                  :title="`${item.element} (${item.nameEn}): ${item.percentage}%`"
                  class="h-full transition-all"
                />
              </div>

              <!-- List details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(item, idx) in breakdown"
                  :key="item.element"
                  class="p-3.5 rounded-xl border border-[var(--color-border)] bg-black/10 flex flex-col gap-2"
                >
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: colors[idx % colors.length] }" />
                      <strong class="font-mono text-sm">{{ item.element }}</strong>
                      <span class="text-[10px] text-[var(--color-text-muted)]">{{ item.nameEn }}</span>
                    </div>
                    <span class="text-xs font-bold font-mono" :style="{ color: colors[idx % colors.length] }">
                      {{ item.percentage }}%
                    </span>
                  </div>

                  <div class="flex justify-between text-[11px] text-[var(--color-text-secondary)] font-mono border-t border-white/[0.03] pt-1.5">
                    <span>Count: <strong>{{ item.count }}</strong></span>
                    <span>At. Wt: <strong>{{ item.atomicWeight }}</strong></span>
                    <span>Mass: <strong>{{ item.subtotal }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Right Panel: Presets Database (1 col) -->
      <div class="glass p-5 border border-[var(--color-border)] flex flex-col gap-4 max-h-[600px]">
        <h3 class="text-sm font-semibold text-[var(--color-primary-light)]">Formula Database Presets</h3>
        
        <div class="relative">
          <input
            type="text"
            class="form-input text-xs pl-8 py-2"
            placeholder="Search name, formula..."
            v-model="searchTerm"
          />
          <span class="absolute left-3 top-2.5 text-xs text-[var(--color-text-muted)]">🔍</span>
        </div>

        <div class="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
          <div
            v-for="p in filteredPresets"
            :key="p.nameEn"
            @click="formula = p.formula"
            class="p-2.5 rounded-lg border border-[var(--color-border)] bg-black/15 hover:bg-white/[0.03] cursor-pointer transition-all flex flex-col gap-1.5"
          >
            <div class="flex justify-between items-center">
              <span class="font-bold text-xs text-[var(--color-text)]">{{ p.nameEn }}</span>
            </div>
            <div class="flex justify-between text-[10px] font-mono text-[var(--color-text-secondary)]">
              <span class="text-[var(--color-primary)] font-bold">{{ p.formula }}</span>
              <span>MW: {{ p.mw }}</span>
            </div>
            <div class="text-[9px] text-[var(--color-text-muted)] italic font-mono truncate">
              {{ p.type }}
            </div>
          </div>
          <div v-if="filteredPresets.length === 0" class="text-center text-xs text-[var(--color-text-muted)] py-4">
            No matching preset formulas
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
