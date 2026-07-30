<script setup lang="ts">
import { ref } from 'vue';
import MolarityCalculator from './MolarityCalculator.vue';
import DilutionCalculator from './DilutionCalculator.vue';
import MolecularWeightCalculator from './MolecularWeightCalculator.vue';
import FormulaCalculator from './FormulaCalculator.vue';

type CalculatorType = 'molarity' | 'dilution' | 'mw' | 'formula';

const activeCalc = ref<CalculatorType>('molarity');

const tabs = [
  { key: 'molarity' as CalculatorType, label: 'Molarity & Percentage', shortLabel: 'Molarity', desc: 'Mass, Vol & Molar Solvers' },
  { key: 'dilution' as CalculatorType, label: 'Dilution & Scaling',    shortLabel: 'Dilution', desc: 'C1V1, Serial Curves & Batch Scale' },
  { key: 'mw'      as CalculatorType, label: 'Molecular Weight',       shortLabel: 'MW Parser',desc: 'Formula Parser & Mass Composition' },
  { key: 'formula' as CalculatorType, label: 'Formulation SOP Solver',  shortLabel: 'Formulas', desc: 'HLB Emulsion & Capsule Dosing' },
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
        <span class="tab-icon flex items-center justify-center">
          <svg v-if="tab.key === 'molarity'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31L4.75 18.15A2 2 0 0 0 6.46 21h11.08a2 2 0 0 0 1.71-2.85L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>
          <svg v-else-if="tab.key === 'dilution'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
          <svg v-else-if="tab.key === 'mw'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z"/><path d="M2 12h20"/></svg>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </span>
        <span class="mobile-tab-label">{{ tab.shortLabel }}</span>
      </button>
    </nav>

    <!-- Console Body Layout -->
    <div class="console-body">
      <!-- Desktop Sidebar Navigation (≥ lg) -->
      <aside class="console-sidebar" aria-label="Calculator Suite Navigation">
        <!-- Sidebar Brand Card -->
        <div class="sidebar-header border border-[var(--color-border)] rounded-2xl p-4 bg-black/30 flex items-center gap-3">
          <div class="sidebar-logo-icon p-2.5 rounded-xl bg-[var(--color-primary-glow)] border border-[var(--color-primary)]/30 text-[var(--color-primary-light)]">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="16" y1="14" x2="16" y2="18"/>
              <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          <div>
            <div class="sidebar-title">Lab Calculator</div>
            <span class="sidebar-subtitle">Scientific Tools Suite</span>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="sidebar-nav-container border border-[var(--color-border)] rounded-2xl p-3 bg-black/20 flex flex-col gap-2">
          <span class="nav-section-label text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Toolkit Calculators</span>

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
            <span class="p-2 rounded-lg bg-white/5 text-[var(--color-primary-light)] shrink-0 flex items-center justify-center">
              <svg v-if="tab.key === 'molarity'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31L4.75 18.15A2 2 0 0 0 6.46 21h11.08a2 2 0 0 0 1.71-2.85L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>
              <svg v-else-if="tab.key === 'dilution'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
              <svg v-else-if="tab.key === 'mw'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z"/><path d="M2 12h20"/></svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </span>
            <div class="nav-btn-text">
              <span :class="['nav-btn-title text-sm font-semibold', activeCalc === tab.key ? 'nav-btn-title--active' : '']">
                {{ tab.label }}
              </span>
              <span class="nav-btn-desc text-xs text-[var(--color-text-secondary)]">{{ tab.desc }}</span>
            </div>
          </button>
        </div>

        <!-- Sidebar Helper Footer -->
        <div class="sidebar-footer border border-[var(--color-border)] rounded-2xl p-3.5 bg-black/20 text-xs text-[var(--color-text-muted)] flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5 text-[var(--color-primary-light)] font-bold text-xs">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SOP Standards Compliance
          </div>
          <p class="text-xs leading-relaxed italic text-[var(--color-text-secondary)]">
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
          <div class="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span class="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <div>
              <p class="font-semibold text-[var(--color-text)] text-sm">
                * Note: Calculation results are estimates for reference and may contain minor variances.
              </p>
              <p class="text-xs text-[var(--color-text-secondary)]">
                Need custom R&D assistance, precision validation, or technical support? Our experts are here to help.
              </p>
            </div>
          </div>
          <a
            href="/contact"
            class="btn btn--gold py-2.5 px-4 text-xs font-bold whitespace-nowrap flex items-center gap-2 shadow-lg shrink-0 rounded-xl"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Contact Ginkvora Formulators
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
