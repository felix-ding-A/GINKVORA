<script setup lang="ts">
import { ref } from 'vue';
import MolarityCalculator from './MolarityCalculator.vue';
import DilutionCalculator from './DilutionCalculator.vue';
import MolecularWeightCalculator from './MolecularWeightCalculator.vue';
import FormulaCalculator from './FormulaCalculator.vue';

type CalculatorType = 'molarity' | 'dilution' | 'mw' | 'formula';

const activeCalc = ref<CalculatorType>('molarity');

const tabs = [
  { key: 'molarity' as CalculatorType, icon: '⚖️', label: 'Molarity & Percentage', shortLabel: 'Molarity', desc: 'Mass - Vol - Conc Solver' },
  { key: 'dilution' as CalculatorType, icon: '📉', label: 'Dilution & Scaling',    shortLabel: 'Dilution', desc: 'C1V1, Log Curve & Batch scale' },
  { key: 'mw'      as CalculatorType, icon: '🧬', label: 'Molecular Weight',       shortLabel: 'MW Calc',  desc: 'Formula Parser & Composition' },
  { key: 'formula' as CalculatorType, icon: '📋', label: 'Formulation Solver',     shortLabel: 'Formulas', desc: 'Animal dosage, Supplement, HLB SOP' },
];
</script>

<template>
  <div class="console-wrapper">
    <!-- ── Mobile Tab Bar (< lg) ── -->
    <nav class="mobile-tab-bar lg:hidden" aria-label="Calculator Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeCalc = tab.key"
        :aria-current="activeCalc === tab.key ? 'page' : undefined"
        :class="[
          'mobile-tab-btn',
          activeCalc === tab.key ? 'mobile-tab-btn--active' : ''
        ]"
      >
        <span class="text-base leading-none">{{ tab.icon }}</span>
        <span class="mobile-tab-label">{{ tab.shortLabel }}</span>
      </button>
    </nav>

    <!-- ── Desktop Layout (≥ lg): Sidebar + Main Pane ── -->
    <div class="flex flex-col lg:flex-row gap-6 w-full">
      <!-- Sidebar Navigation (desktop only) -->
      <aside class="hidden lg:flex w-72 flex-col gap-5 shrink-0" aria-label="Calculator Navigation">
        <!-- Info Header Card -->
        <div class="glass p-5 border border-[var(--color-border)] flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-glow)] border border-[var(--color-primary)]/20 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(212,166,84,0.15)]">
            🧪
          </div>
          <div class="flex flex-col">
            <h2 class="text-base font-bold font-display text-[var(--color-text)]">Pure Formulator</h2>
            <span class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Formulation Suite</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="glass p-4 border border-[var(--color-border)] flex flex-col gap-2">
          <span class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1 px-1">
            Calculators Suite
          </span>

          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeCalc = tab.key"
            :aria-current="activeCalc === tab.key ? 'page' : undefined"
            :class="[
              'w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3.5',
              activeCalc === tab.key
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]'
                : 'border-[var(--color-border)] bg-black/10 hover:bg-white/[0.03]'
            ]"
          >
            <span class="text-lg">{{ tab.icon }}</span>
            <div class="flex flex-col text-left">
              <span :class="['text-xs font-bold', activeCalc === tab.key ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text)]']">
                {{ tab.label }}
              </span>
              <span class="text-[9px] text-[var(--color-text-muted)] mt-0.5">{{ tab.desc }}</span>
            </div>
          </button>
        </div>

        <!-- Sidebar footer docs link -->
        <div class="glass p-4 border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex flex-col gap-2">
          <div class="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer">
            <span>📖</span>
            <span>Documentation & Helper</span>
          </div>
          <p class="text-[10px] mt-1 italic leading-relaxed">
            * Designed for laboratory accuracy and regulatory compliance validation.
          </p>
        </div>
      </aside>

      <!-- Main Working Pane -->
      <main class="flex-1 glass p-4 md:p-6 lg:p-8 border border-[var(--color-border)] custom-scrollbar min-w-0">
        <MolarityCalculator v-if="activeCalc === 'molarity'" />
        <DilutionCalculator v-else-if="activeCalc === 'dilution'" />
        <MolecularWeightCalculator v-else-if="activeCalc === 'mw'" />
        <FormulaCalculator v-else-if="activeCalc === 'formula'" />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Console Wrapper ── */
.console-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 600px;
}

/* ── Mobile Tab Bar ── */
.mobile-tab-bar {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
  scrollbar-width: none; /* Hide scrollbar on Firefox */
}
.mobile-tab-bar::-webkit-scrollbar { display: none; }

.mobile-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1rem;
  flex: 1 0 auto;
  min-width: 72px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.3);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mobile-tab-btn:hover {
  background: rgba(212, 166, 84, 0.08);
  border-color: rgba(212, 166, 84, 0.25);
  color: var(--color-text);
}

.mobile-tab-btn--active {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-glow) !important;
  color: var(--color-primary-light) !important;
}

.mobile-tab-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
