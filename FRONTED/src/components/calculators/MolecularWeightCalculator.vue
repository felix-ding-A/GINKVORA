<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { parseFormula, PRESET_INGREDIENTS, ATOMIC_WEIGHTS } from '../../lib/calculators/formulaParser';

const formula = ref('C10H16N2O2');
const searchTerm = ref('');
const mwResult = ref<ReturnType<typeof parseFormula> | null>(null);

const calculateMW = () => {
  mwResult.value = parseFormula(formula.value);
};

const filteredPresets = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return PRESET_INGREDIENTS;
  return PRESET_INGREDIENTS.filter(
    p => p.nameEn.toLowerCase().includes(term) || 
         p.nameCn.toLowerCase().includes(term) || 
         p.formula.toLowerCase().includes(term)
  );
});

const matchedPreset = computed(() => {
  const cleanTyped = formula.value.replace(/\s+/g, '');
  return PRESET_INGREDIENTS.find(
    p => p.formula.replace(/\s+/g, '') === cleanTyped
  );
});

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

const colors = [
  'var(--color-primary)',
  'var(--color-accent)',
  '#34d399',
  '#f97316',
  '#fbbf24',
  '#a855f7',
  '#ec4899',
  '#38bdf8'
];

watch(formula, () => {
  calculateMW();
});

onMounted(() => {
  calculateMW();
});
</script>

<template>
  <div class="mw-calc-container flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
      <div>
        <h3 class="text-lg font-bold font-display text-[var(--color-text)]">Molecular Weight & Composition</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Parse complex chemical formulas (hydrates, nested brackets) and compute elemental mass percentages.
        </p>
      </div>

      <button @click="formula = 'C10H16N2O2'" class="btn btn--secondary py-1 px-3 text-xs self-start sm:self-auto">
        🔄 Reset Formula
      </button>
    </div>

    <!-- Layout: Left (Input & Hero Result) vs Right (Preset Search) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Area (7/12) -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        <!-- Formula Input Box -->
        <div class="p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
          <div>
            <label for="chem-formula" class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)] mb-2 block">
              🧪 Enter Chemical Formula
            </label>
            <input
              id="chem-formula"
              type="text"
              v-model="formula"
              class="w-full p-3 bg-black/50 border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl font-mono text-xl text-[var(--color-primary-light)] font-bold outline-none"
              placeholder="e.g. Ca(OH)2 or CuSO4·5H2O"
            />
          </div>

          <!-- Virtual Keyboard -->
          <div>
            <span class="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider mb-2 block">
              Lab Touch Keyboard (Quick Symbols)
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="char in ['C', 'H', 'O', 'N', 'P', 'S', 'Na', 'Cl', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', '(', ')', '·', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']"
                :key="char"
                @click="handleKeyPress(char)"
                class="px-3 py-1 rounded-lg border border-[var(--color-border)] bg-black/20 text-xs font-mono font-bold hover:bg-white/10 transition-colors"
              >
                {{ char }}
              </button>
              <button @click="handleBackspace" class="px-3 py-1 rounded-lg border border-red-500/30 bg-red-950/20 text-xs text-red-400 font-bold hover:bg-red-900/30">
                ⌫
              </button>
              <button @click="handleClear" class="px-3 py-1 rounded-lg border border-[var(--color-border)] bg-white/5 text-xs text-[var(--color-text-muted)] hover:text-white">
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- 🎯 Hero MW Output Result Card -->
        <div v-if="mwResult" class="p-6 rounded-2xl border border-[var(--color-primary)]/40 bg-gradient-to-b from-[#1c160c] to-[#0d0a05] shadow-xl relative overflow-hidden flex flex-col gap-4">
          <div v-if="mwResult.error" class="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            <strong>⚠️ Parse Error:</strong> {{ mwResult.error }}
          </div>

          <template v-else>
            <!-- Big Result Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block mb-0.5">Parsed Formula</span>
                <span class="text-xl font-mono font-bold text-[var(--color-primary-light)]">{{ mwResult.formula }}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block mb-0.5">Molecular Weight</span>
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl font-black font-mono text-[var(--color-primary-light)]">{{ mwResult.molecularWeight }}</span>
                  <span class="text-xs font-mono text-[var(--color-accent-light)] font-bold">g/mol</span>
                </div>
              </div>
            </div>

            <!-- Matched Ingredient Info Badge -->
            <div v-if="matchedPreset" class="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <strong class="font-bold text-white">{{ matchedPreset.nameEn }}</strong> — {{ matchedPreset.desc }}
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-900/40 text-[10px] uppercase font-bold font-mono text-emerald-400 border border-emerald-500/30">
                {{ matchedPreset.type }}
              </span>
            </div>

            <!-- Element Mass Breakdown -->
            <div class="flex flex-col gap-3">
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
                📊 Element Mass Percentage Breakdown
              </span>

              <!-- Stacked Segment Bar -->
              <div class="flex h-3.5 w-full rounded-full overflow-hidden bg-black/50 border border-white/10">
                <div
                  v-for="(item, idx) in breakdown"
                  :key="item.element"
                  :style="{ width: `${item.percentage}%`, backgroundColor: colors[idx % colors.length] }"
                  :title="`${item.element}: ${item.percentage}%`"
                  class="h-full transition-all"
                />
              </div>

              <!-- Details Grid -->
              <div class="grid grid-cols-2 gap-2 mt-1">
                <div
                  v-for="(item, idx) in breakdown"
                  :key="item.element"
                  class="p-2.5 rounded-xl border border-white/5 bg-black/40 flex justify-between items-center text-xs font-mono"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: colors[idx % colors.length] }" />
                    <strong class="text-white text-xs">{{ item.element }}</strong>
                    <span class="text-xs text-[var(--color-text-secondary)]">×{{ item.count }}</span>
                  </div>
                  <span class="font-bold text-xs" :style="{ color: colors[idx % colors.length] }">{{ item.percentage }}%</span>
                </div>
              </div>
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
          </template>
        </div>
      </div>

      <!-- Right Area: Presets DB (5/12) -->
      <div class="lg:col-span-5 p-5 rounded-2xl bg-black/20 border border-[var(--color-border)] flex flex-col gap-4">
        <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]">
          📚 Formula Database Presets
        </span>

        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search compound name or formula..."
          class="w-full p-2 bg-black/40 border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
        />

        <div class="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          <button
            v-for="p in filteredPresets"
            :key="p.nameEn"
            @click="formula = p.formula"
            class="w-full text-left p-2.5 rounded-xl border border-[var(--color-border)] bg-black/20 hover:bg-white/[0.04] transition-all flex flex-col gap-1 group"
          >
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary-light)]">{{ p.nameEn }}</span>
              <span class="font-mono text-[10px] text-[var(--color-primary)] font-bold">MW: {{ p.mw }}</span>
            </div>
            <div class="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
              <span>{{ p.formula }}</span>
              <span class="italic text-[9px]">{{ p.type }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
