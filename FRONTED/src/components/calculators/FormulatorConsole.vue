<script setup lang="ts">
import { ref } from 'vue';
import MolarityCalculator from './MolarityCalculator.vue';
import DilutionCalculator from './DilutionCalculator.vue';
import MolecularWeightCalculator from './MolecularWeightCalculator.vue';
import FormulaCalculator from './FormulaCalculator.vue';

type CalculatorType = 'molarity' | 'dilution' | 'mw' | 'formula';

const activeCalc = ref<CalculatorType>('molarity');

const tabs = [
  { key: 'molarity' as CalculatorType, icon: '⚖️', label: 'Molarity & Percentage', shortLabel: 'Molarity', desc: 'Mass, Vol & Molar Solvers' },
  { key: 'dilution' as CalculatorType, icon: '📉', label: 'Dilution & Scaling',    shortLabel: 'Dilution', desc: 'C1V1, Serial Curves & Batch Scale' },
  { key: 'mw'      as CalculatorType, icon: '🧬', label: 'Molecular Weight',       shortLabel: 'MW Parser',desc: 'Formula Parser & Mass Composition' },
  { key: 'formula' as CalculatorType, icon: '📋', label: 'Formulation SOP Solver',  shortLabel: 'Formulas', desc: 'HLB Emulsion & Capsule Dosing' },
];
</script>

<template>
  <div class="console-wrapper">
    <!-- Mobile Tab Bar (< lg) -->
    <nav class="mobile-tab-bar" aria-label="Calculator Navigation Mobile">
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
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="mobile-tab-label">{{ tab.shortLabel }}</span>
      </button>
    </nav>

    <!-- Console Body Layout -->
    <div class="console-body">
      <!-- Desktop Sidebar Navigation (≥ lg) -->
      <aside class="console-sidebar" aria-label="Calculator Suite Navigation">
        <!-- Sidebar Brand Card -->
        <div class="sidebar-header border border-[var(--color-border)] rounded-2xl p-4 bg-black/30">
          <div class="sidebar-logo-icon">🧮</div>
          <div>
            <div class="sidebar-title">Lab Calculator</div>
            <span class="sidebar-subtitle">Scientific Tools Suite</span>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="sidebar-nav-container border border-[var(--color-border)] rounded-2xl p-3 bg-black/20 flex flex-col gap-2">
          <span class="nav-section-label">Toolkit Calculators</span>

          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeCalc = tab.key"
            :aria-current="activeCalc === tab.key ? 'page' : undefined"
            :class="[
              'sidebar-nav-btn',
              activeCalc === tab.key ? 'sidebar-nav-btn--active' : ''
            ]"
          >
            <span class="text-xl leading-none flex-shrink-0">{{ tab.icon }}</span>
            <div class="nav-btn-text">
              <span :class="['nav-btn-title', activeCalc === tab.key ? 'nav-btn-title--active' : '']">
                {{ tab.label }}
              </span>
              <span class="nav-btn-desc">{{ tab.desc }}</span>
            </div>
          </button>
        </div>

        <!-- Sidebar Helper Footer -->
        <div class="sidebar-footer border border-[var(--color-border)] rounded-2xl p-3.5 bg-black/20 text-xs text-[var(--color-text-muted)] flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5 text-[var(--color-primary-light)] font-bold text-[11px]">
            <span>📖</span> SOP Standards Compliance
          </div>
          <p class="text-[10px] leading-relaxed italic">
            Calibrated for lab accuracy, IUPAC stoichiometry standards & USP/EP pharmaceutical compliance.
          </p>
        </div>
      </aside>

      <!-- Main Working Pane -->
      <main class="console-main rounded-3xl border border-[var(--color-border)] bg-black/30 backdrop-blur-md">
        <MolarityCalculator v-if="activeCalc === 'molarity'" />
        <DilutionCalculator v-else-if="activeCalc === 'dilution'" />
        <MolecularWeightCalculator v-else-if="activeCalc === 'mw'" />
        <FormulaCalculator v-else-if="activeCalc === 'formula'" />

        <!-- ⚠️ Disclaimer & Contact Formulators CTA Bar -->
        <div class="disclaimer-cta-bar mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-black/40 to-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            <span class="text-lg flex-shrink-0">⚠️</span>
            <div>
              <p class="font-semibold text-[var(--color-text)]">
                * Note: Calculation results are estimates for reference and may contain minor variances.
              </p>
              <p class="text-[11px] text-[var(--color-text-muted)]">
                Need custom R&D assistance, precision validation, or technical support? Our experts are here to help.
              </p>
            </div>
          </div>
          <a
            href="/contact"
            class="btn btn--gold py-2.5 px-4 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-lg shrink-0 rounded-xl"
          >
            💬 Contact Ginkvora Formulators
          </a>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.console-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.mobile-tab-bar {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
}
.mobile-tab-bar::-webkit-scrollbar { display: none; }

@media (min-width: 1024px) {
  .mobile-tab-bar {
    display: none;
  }
}

.mobile-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1rem;
  flex: 1 0 auto;
  min-width: 76px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.4);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mobile-tab-btn--active {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-glow) !important;
  color: var(--color-primary-light) !important;
  font-weight: 700;
}

.tab-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.mobile-tab-label {
  font-size: 0.6875rem;
  font-weight: 600;
}

.console-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .console-body {
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
  }
}

.console-sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .console-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 250px;
    flex-shrink: 0;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-logo-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: var(--color-primary-glow);
  border: 1px solid rgba(212, 166, 84, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(212, 166, 84, 0.15);
}

.sidebar-title {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--color-text);
  font-family: var(--font-display);
  line-height: 1.2;
}

.sidebar-subtitle {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  display: block;
}

.nav-section-label {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  padding-left: 0.25rem;
  margin-bottom: 0.25rem;
}

.sidebar-nav-btn {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
}

.sidebar-nav-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.sidebar-nav-btn--active {
  border-color: rgba(212, 166, 84, 0.4) !important;
  background: rgba(212, 166, 84, 0.1) !important;
  color: var(--color-primary-light) !important;
}

.nav-btn-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.nav-btn-title {
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn-title--active {
  color: var(--color-primary-light);
}

.nav-btn-desc {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.console-main {
  flex: 1;
  padding: 1.25rem;
  min-width: 0;
}

@media (min-width: 768px) {
  .console-main {
    padding: 1.75rem;
  }
}

@media (min-width: 1280px) {
  .console-main {
    padding: 2rem;
  }
}
</style>
