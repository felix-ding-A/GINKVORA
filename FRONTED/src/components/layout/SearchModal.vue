<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div 
        v-if="isOpen" 
        class="search-backdrop"
        @click="close"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Modal Dialog -->
    <Transition name="slide-down">
      <div 
        v-if="isOpen" 
        class="search-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('search_title')"
      >
        <!-- Top Search Header -->
        <div class="search-header">
          <svg class="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="query"
            type="text"
            class="search-input"
            :placeholder="t('placeholder')"
            @keydown.down.prevent="navigateResults('down')"
            @keydown.up.prevent="navigateResults('up')"
            @keydown.enter.prevent="selectActiveResult"
            @keydown.esc="close"
          />
          <button 
            v-if="query" 
            class="clear-btn" 
            @click="query = ''"
            :title="t('clear')"
          >
            🧹
          </button>
          <!-- Confirm Search Button -->
          <button 
            type="button" 
            class="search-confirm-btn" 
            @click="selectActiveResultOrNavigate"
          >
            {{ t('search_btn') }}
          </button>

          <!-- Explicit Close X Button -->
          <button 
            type="button" 
            class="modal-close-x-btn" 
            @click="close" 
            :title="t('close_btn')"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <!-- Hot Tags Row -->
        <div class="hot-tags-row">
          <span class="hot-tags-label">{{ t('hot_searches') }}:</span>
          <div class="hot-tags-list">
            <button 
              v-for="tag in hotTags" 
              :key="tag" 
              class="hot-tag"
              @click="setQuery(tag)"
            >
              🔥 {{ tag }}
            </button>
          </div>
        </div>

        <!-- Search Body / Results -->
        <div class="search-body">
          <!-- Empty Query Placeholder / Quick Tips -->
          <div v-if="!query.trim()" class="search-tips">
            <div class="tip-card">
              <span class="tip-icon">🧬</span>
              <div class="tip-text">
                <strong>{{ t('tip1_title') }}</strong>
                <p>{{ t('tip1_desc') }}</p>
              </div>
            </div>
            <div class="tip-card">
              <span class="tip-icon">🧪</span>
              <div class="tip-text">
                <strong>{{ t('tip2_title') }}</strong>
                <p>{{ t('tip2_desc') }}</p>
              </div>
            </div>
          </div>

          <!-- No Results State -->
          <div v-else-if="filteredProducts.length === 0 && filteredPosts.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3>{{ t('no_results') }} "{{ query }}"</h3>
            <p>{{ t('no_results_sub') }}</p>
          </div>

          <!-- Results List -->
          <div v-else class="results-container">
            <!-- Products Section -->
            <div v-if="filteredProducts.length > 0" class="result-group">
              <div class="group-title">
                <span>📦 {{ t('products_heading') }}</span>
                <span class="count-badge">{{ filteredProducts.length }}</span>
              </div>
              <a
                v-for="(item, idx) in filteredProducts"
                :key="item._id || item.slug"
                :href="getProductUrl(item)"
                class="result-item"
                :class="{ active: activeIndex === idx }"
                @mouseenter="activeIndex = idx"
              >
                <div class="item-thumb" v-if="getImgUrl(item.heroImage)">
                  <img :src="getImgUrl(item.heroImage)" :alt="item.name" loading="lazy" />
                </div>
                <div class="item-thumb placeholder-thumb" v-else>
                  🌿
                </div>
                <div class="item-info">
                  <div class="item-title-row">
                    <span class="item-name">{{ item.name }}</span>
                    <span v-if="item.purity" class="purity-badge">{{ item.purity }}</span>
                  </div>
                  <div class="item-meta">
                    <span v-if="item.casNumber" class="cas-tag">CAS: {{ item.casNumber }}</span>
                    <span v-if="item.botanicalName" class="botanical-tag"><i>{{ item.botanicalName }}</i></span>
                  </div>
                  <p v-if="item.shortDescription" class="item-desc">{{ truncate(item.shortDescription, 90) }}</p>
                </div>
                <span class="arrow-icon">→</span>
              </a>
            </div>

            <!-- Posts / Insights Section -->
            <div v-if="filteredPosts.length > 0" class="result-group">
              <div class="group-title">
                <span>📚 {{ t('insights_heading') }}</span>
                <span class="count-badge">{{ filteredPosts.length }}</span>
              </div>
              <a
                v-for="(post, pIdx) in filteredPosts"
                :key="post._id || post.slug"
                :href="getPostUrl(post)"
                class="result-item"
                :class="{ active: activeIndex === (filteredProducts.length + pIdx) }"
                @mouseenter="activeIndex = filteredProducts.length + pIdx"
              >
                <div class="item-thumb" v-if="getImgUrl(post.mainImage)">
                  <img :src="getImgUrl(post.mainImage)" :alt="post.title" loading="lazy" />
                </div>
                <div class="item-thumb placeholder-thumb" v-else>
                  📄
                </div>
                <div class="item-info">
                  <span class="item-name">{{ post.title }}</span>
                  <p v-if="post.excerpt" class="item-desc">{{ truncate(post.excerpt, 90) }}</p>
                </div>
                <span class="arrow-icon">→</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="search-footer">
          <div class="footer-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> {{ t('nav_keys') }}</span>
            <span><kbd>↵</kbd> {{ t('select_key') }}</span>
            <span><kbd>ESC</kbd> {{ t('close_key') }}</span>
          </div>
          <a :href="getLocalePath('/products')" class="all-products-link" @click="close">
            {{ t('view_all_products') }} →
          </a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  products: { type: Array, default: () => [] },
  posts: { type: Array, default: () => [] },
  lang: { type: String, default: 'en' }
});

const isOpen = ref(false);
const query = ref('');
const activeIndex = ref(0);
const searchInputRef = ref(null);

const hotTags = ['Proxylane', 'NMN', 'PQQ', 'Glabridin', 'EGCG', 'Liposomal', 'CAS 13749-38-7'];

const i18n = {
  en: {
    search_title: 'Search GINKVORA Catalog',
    placeholder: 'Search ingredients by name, CAS number, purity, or application...',
    clear: 'Clear search',
    hot_searches: 'Popular Searches',
    tip1_title: 'Search by Raw Material & CAS Number',
    tip1_desc: 'Try typing "Proxylane", "NMN", "PQQ", "Glabridin", or CAS numbers like "13749-38-7".',
    tip2_title: 'Search by Efficacy & Mechanism',
    tip2_desc: 'Filter by ECM target keywords like "Collagen", "MMP", "Anti-Glycation", or "Liposomal".',
    no_results: 'No ingredients found for',
    no_results_sub: 'Try searching by CAS number, trade name, or broader botanical keywords.',
    products_heading: 'Ingredients & Raw Materials',
    insights_heading: 'Research & Insights Articles',
    nav_keys: 'to navigate',
    select_key: 'to select',
    close_key: 'to close',
    view_all_products: 'Browse Full B2B Catalog',
    search_btn: 'Search',
    close_btn: 'Close'
  },
  ru: {
    search_title: 'Поиск по каталогу GINKVORA',
    placeholder: 'Поиск ингредиентов по названию, CAS номеру, чистоте...',
    clear: 'Очистить',
    hot_searches: 'Популярные запросы',
    tip1_title: 'Поиск по названию и CAS номеру',
    tip1_desc: 'Попробуйте ввести "Proxylane", "NMN", "PQQ", "Glabridin" или номер CAS "13749-38-7".',
    tip2_title: 'Поиск по механизму действия',
    tip2_desc: 'Фильтруйте по ключевым словам: "Коллаген", "MMP", "Антигликация" или "Липосомальные".',
    no_results: 'Ничего не найдено по запросу',
    no_results_sub: 'Попробуйте использовать номер CAS, химическое название или более общие термины.',
    products_heading: 'Сырье и Ингредиенты',
    insights_heading: 'Исследования и Статьи',
    nav_keys: 'навигация',
    select_key: 'выбрать',
    close_key: 'закрыть',
    view_all_products: 'Весь каталог B2B',
    search_btn: 'Искать',
    close_btn: 'Закрыть'
  },
  es: {
    search_title: 'Buscar en el catálogo GINKVORA',
    placeholder: 'Buscar ingredientes por nombre, número CAS, pureza...',
    clear: 'Limpiar',
    hot_searches: 'Búsquedas populares',
    tip1_title: 'Buscar por materia prima y número CAS',
    tip1_desc: 'Pruebe buscando "Proxylane", "NMN", "PQQ", "Glabridin" o números CAS como "13749-38-7".',
    tip2_title: 'Buscar por mecanismo y eficacia',
    tip2_desc: 'Filtre por palabras clave como "Colágeno", "Inhibidor MMP", "Anti-glicación".',
    no_results: 'No se encontraron resultados para',
    no_results_sub: 'Intente buscar por número CAS, nombre INCI o términos botánicos generales.',
    products_heading: 'Ingredientes y Materias Primas',
    insights_heading: 'Artículos e Investigaciones',
    nav_keys: 'para navegar',
    select_key: 'para seleccionar',
    close_key: 'para cerrar',
    view_all_products: 'Ver catálogo completo B2B',
    search_btn: 'Buscar',
    close_btn: 'Cerrar'
  },
  ar: {
    search_title: 'البحث في كتالوج GINKVORA',
    placeholder: 'ابحث عن المكونات بالاسم، رقم CAS، النقاء...',
    clear: 'مسح',
    hot_searches: 'الأكثر بحثاً',
    tip1_title: 'البحث باسم المادة الخام ورقم CAS',
    tip1_desc: 'جرب كتابة "Proxylane" أو "NMN" أو "PQQ" أو أرقام CAS مثل "13749-38-7".',
    tip2_title: 'البحث حسب الفاعلية وآلية العمل',
    tip2_desc: 'تصفح حسب الكلمات المفتاحية مثل "الكولاجين"، "MMP"، "مضادات السكرية".',
    no_results: 'لم يتم العثور على نتائج لـ',
    no_results_sub: 'جرب البحث برقم CAS أو الاسم الكيميائي أو مصطلحات نباتية عامة.',
    products_heading: 'المكونات والمواد الخام',
    insights_heading: 'الأبحاث والمقالات العلمية',
    nav_keys: 'للتنقل',
    select_key: 'الاختيار',
    close_key: 'للإغلاق',
    view_all_products: 'استعرض الكتالوج الكامل',
    search_btn: 'بحث',
    close_btn: 'إغلاق'
  }
};

function t(key) {
  const currentLang = i18n[props.lang] ? props.lang : 'en';
  return i18n[currentLang][key] || i18n.en[key] || key;
}

function getLocalePath(path) {
  if (props.lang === 'en' || !props.lang) return path;
  return `/${props.lang}${path === '/' ? '' : path}`;
}

function getProductUrl(item) {
  const slug = item.slug || item._id;
  return `${getLocalePath('/products')}/${slug}`;
}

function getPostUrl(post) {
  const slug = post.slug || post._id;
  return `${getLocalePath('/insights')}/${slug}`;
}

function getImgUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (img.asset && img.asset.url) return img.asset.url;
  return null;
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

const filteredProducts = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return props.products.filter(p => {
    const nameMatch = p.name && p.name.toLowerCase().includes(q);
    const casMatch = p.casNumber && p.casNumber.toLowerCase().includes(q);
    const botMatch = p.botanicalName && p.botanicalName.toLowerCase().includes(q);
    const inciMatch = p.inciName && p.inciName.toLowerCase().includes(q);
    const purityMatch = p.purity && p.purity.toLowerCase().includes(q);
    const descMatch = p.shortDescription && p.shortDescription.toLowerCase().includes(q);
    return nameMatch || casMatch || botMatch || inciMatch || purityMatch || descMatch;
  }).slice(0, 8);
});

const filteredPosts = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return props.posts.filter(p => {
    const titleMatch = p.title && p.title.toLowerCase().includes(q);
    const excerptMatch = p.excerpt && p.excerpt.toLowerCase().includes(q);
    return titleMatch || excerptMatch;
  }).slice(0, 4);
});

const totalResultCount = computed(() => {
  return filteredProducts.value.length + filteredPosts.value.length;
});

watch(query, () => {
  activeIndex.value = 0;
});

function setQuery(val) {
  query.value = val;
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus();
  });
}

function open() {
  isOpen.value = true;
  document.body.style.overflow = 'hidden';
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus();
  });
}

function close() {
  isOpen.value = false;
  query.value = '';
  document.body.style.overflow = '';
}

function navigateResults(dir) {
  const total = totalResultCount.value;
  if (total === 0) return;
  if (dir === 'down') {
    activeIndex.value = (activeIndex.value + 1) % total;
  } else if (dir === 'up') {
    activeIndex.value = (activeIndex.value - 1 + total) % total;
  }
}

function selectActiveResult() {
  const pCount = filteredProducts.value.length;
  if (activeIndex.value < pCount) {
    const targetProduct = filteredProducts.value[activeIndex.value];
    if (targetProduct) {
      window.location.href = getProductUrl(targetProduct);
    }
  } else {
    const targetPost = filteredPosts.value[activeIndex.value - pCount];
    if (targetPost) {
      window.location.href = getPostUrl(targetPost);
    }
  }
}

function selectActiveResultOrNavigate() {
  if (totalResultCount.value > 0) {
    selectActiveResult();
  } else if (query.value.trim()) {
    window.location.href = `${getLocalePath('/products')}?search=${encodeURIComponent(query.value.trim())}`;
  }
}

function handleGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('open-global-search', open);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('open-global-search', open);
});

defineExpose({ open, close });
</script>

<style scoped>
.search-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 5, 4, 0.75);
  backdrop-filter: blur(12px);
  z-index: 9998;
}

.search-modal {
  position: fixed;
  top: 10vh;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 720px;
  max-height: 80vh;
  background: rgba(12, 14, 12, 0.95);
  border: 1px solid rgba(212, 166, 84, 0.3);
  border-radius: 16px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 166, 84, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f5efe0;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(212, 166, 84, 0.15);
  background: rgba(255, 255, 255, 0.02);
}

.search-input-icon {
  color: #d4a654;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1.125rem;
  color: #fff;
  font-family: inherit;
}

.search-input::placeholder {
  color: rgba(245, 239, 224, 0.4);
}

.clear-btn {
  background: transparent;
  border: none;
  color: rgba(245, 239, 224, 0.5);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #fff;
}

.search-confirm-btn {
  padding: 0.45rem 1.1rem;
  background: linear-gradient(135deg, #d4a654 0%, #b8860b 100%);
  border: none;
  border-radius: 9999px;
  color: #060503;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.search-confirm-btn:hover {
  background: linear-gradient(135deg, #f0c878 0%, #d4a654 100%);
  box-shadow: 0 4px 15px rgba(212, 166, 84, 0.4);
}

.modal-close-x-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: #e0d8c3;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close-x-btn:hover {
  background: rgba(224, 80, 80, 0.2);
  border-color: rgba(224, 80, 80, 0.5);
  color: #ff6b6b;
}

.close-badge kbd {
  background: rgba(212, 166, 84, 0.15);
  border: 1px solid rgba(212, 166, 84, 0.3);
  color: #d4a654;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: monospace;
}

.close-badge {
  background: transparent;
  border: none;
  cursor: pointer;
}

.hot-tags-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(212, 166, 84, 0.05);
  border-bottom: 1px solid rgba(212, 166, 84, 0.1);
  overflow-x: auto;
}

.hot-tags-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #d4a654;
  white-space: nowrap;
}

.hot-tags-list {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.hot-tag {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e0d8c3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hot-tag:hover {
  background: rgba(212, 166, 84, 0.2);
  border-color: rgba(212, 166, 84, 0.4);
  color: #f0c878;
}

.search-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 240px;
  max-height: 52vh;
}

.search-tips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 12px 0;
}

.tip-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.tip-icon {
  font-size: 1.5rem;
}

.tip-text strong {
  display: block;
  font-size: 0.875rem;
  color: #f0c878;
  margin-bottom: 4px;
}

.tip-text p {
  margin: 0;
  font-size: 0.781rem;
  color: rgba(245, 239, 224, 0.6);
  line-height: 1.4;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
}

.no-results-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.7;
}

.no-results h3 {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
  color: #f0c878;
}

.no-results p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(245, 239, 224, 0.6);
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #d4a654;
  margin-bottom: 10px;
}

.count-badge {
  background: rgba(212, 166, 84, 0.15);
  color: #f0c878;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  margin-bottom: 6px;
}

.result-item:hover,
.result-item.active {
  background: rgba(212, 166, 84, 0.12);
  border-color: rgba(212, 166, 84, 0.35);
  transform: translateX(4px);
}

.item-thumb {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumb {
  font-size: 1.25rem;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
}

.purity-badge {
  background: rgba(224, 120, 48, 0.2);
  color: #ff9854;
  border: 1px solid rgba(224, 120, 48, 0.3);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}

.item-meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 0.75rem;
}

.cas-tag {
  color: #d4a654;
  font-family: monospace;
}

.botanical-tag {
  color: rgba(245, 239, 224, 0.6);
}

.item-desc {
  margin: 4px 0 0 0;
  font-size: 0.781rem;
  color: rgba(245, 239, 224, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  color: rgba(212, 166, 84, 0.4);
  font-size: 1.1rem;
  transition: transform 0.2s, color 0.2s;
}

.result-item:hover .arrow-icon,
.result-item.active .arrow-icon {
  color: #f0c878;
  transform: translateX(4px);
}

.search-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(212, 166, 84, 0.12);
  font-size: 0.781rem;
  color: rgba(245, 239, 224, 0.5);
}

.footer-shortcuts {
  display: flex;
  gap: 16px;
}

.footer-shortcuts kbd {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 5px;
  border-radius: 4px;
  margin-right: 4px;
  color: #d4a654;
  font-family: monospace;
}

.all-products-link {
  color: #f0c878;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.all-products-link:hover {
  color: #fff;
  text-decoration: underline;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@media (max-width: 640px) {
  .search-modal {
    top: 5vh;
    width: 95%;
    max-height: 90vh;
  }
  .search-tips {
    grid-template-columns: 1fr;
  }
  .footer-shortcuts {
    display: none;
  }
}
</style>
