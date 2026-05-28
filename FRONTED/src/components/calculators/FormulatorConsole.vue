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
    <!-- ── Mobile Tab Bar (< lg): horizontal scroll bar at top ── -->
    <nav class="mobile-tab-bar" aria-label="Calculator Tabs">
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

    <!-- ── Desktop Layout (≥ lg): Sidebar + Main Pane ── -->
    <div class="console-body">
      <!-- Sidebar Navigation (desktop only) -->
      <aside class="console-sidebar" aria-label="Calculator Navigation">
        <!-- Info Header Card -->
        <div class="glass sidebar-header border border-[var(--color-border)]">
          <div class="sidebar-logo-icon">🧪</div>
          <div>
            <h2 class="sidebar-title">Pure Formulator</h2>
            <span class="sidebar-subtitle">Formulation Suite</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="glass border border-[var(--color-border)] p-4 flex flex-col gap-2">
          <span class="nav-section-label">Calculators Suite</span>

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
            <span class="text-lg leading-none flex-shrink-0">{{ tab.icon }}</span>
            <div class="nav-btn-text">
              <span :class="['nav-btn-title', activeCalc === tab.key ? 'nav-btn-title--active' : '']">
                {{ tab.label }}
              </span>
              <span class="nav-btn-desc">{{ tab.desc }}</span>
            </div>
          </button>
        </div>

        <!-- Sidebar footer docs link -->
        <div class="glass border border-[var(--color-border)] p-4 sidebar-footer">
          <div class="sidebar-docs-link">
            <span>📖</span>
            <span>Documentation & Helper</span>
          </div>
          <p class="sidebar-footer-note">
            * Designed for laboratory accuracy and regulatory compliance validation.
          </p>
        </div>
      </aside>

      <!-- Main Working Pane -->
      <main class="glass console-main border border-[var(--color-border)] custom-scrollbar">
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
  width: 100%;
}

/* ── Mobile Tab Bar: visible only below lg (1024px) ── */
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
    display: none; /* hidden on desktop — sidebar handles navigation */
  }
}

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

.tab-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.mobile-tab-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* ── Console Body: stacked on mobile, sidebar+main on desktop ── */
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

/* ── Sidebar: hidden on mobile, shown on desktop ── */
.console-sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .console-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 260px;
    flex-shrink: 0;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.sidebar-logo-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: var(--color-primary-glow);
  border: 1px solid rgba(212, 166, 84, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(212, 166, 84, 0.12);
}

.sidebar-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  font-family: var(--font-display);
  line-height: 1.2;
  /* Override h2 global style */
  letter-spacing: normal;
}

.sidebar-subtitle {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  display: block;
  margin-top: 0.125rem;
}

.nav-section-label {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  padding-left: 0.25rem;
  display: block;
  margin-bottom: 0.25rem;
}

.sidebar-nav-btn {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text);
  font-family: var(--font-body);
}

.sidebar-nav-btn:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(212, 166, 84, 0.2);
}

.sidebar-nav-btn--active {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-glow) !important;
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
  color: var(--color-text);
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

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-docs-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.sidebar-docs-link:hover {
  color: var(--color-text);
}

.sidebar-footer-note {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.5;
}

/* ── Main Pane ── */
.console-main {
  flex: 1;
  padding: 1.25rem;
  min-width: 0;
  /* No fixed height - grows to content naturally */
}

@media (min-width: 768px) {
  .console-main {
    padding: 1.75rem;
  }
}

@media (min-width: 1280px) {
  .console-main {
    padding: 2rem 2.25rem;
  }
}
</style>
