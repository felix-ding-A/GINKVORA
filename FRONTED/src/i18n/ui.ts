// src/i18n/ui.ts — Static UI translations for all supported languages
// Dynamic content (products, posts) is handled via Sanity CMS fields

export const defaultLang = 'en' as const;

export const languages = {
  en: { label: 'English',   flag: '🇬🇧', locale: 'en-US' },
  ru: { label: 'Русский',   flag: '🇷🇺', locale: 'ru-RU' },
  es: { label: 'Español',   flag: '🇪🇸', locale: 'es-ES' },
  ar: { label: 'العربية',  flag: '🇸🇦', locale: 'ar-SA' },
} as const;

export type Lang = keyof typeof languages;

// ─────────────────────────────────────────────────────────────────────────────
// Translation Dictionary
// ─────────────────────────────────────────────────────────────────────────────
export const ui = {
  en: {
    // ── Navigation ──
    'nav.products':        'Products',
    'nav.formulator':      'Formulator',
    'nav.quality':         'Quality',
    'nav.about':           'About',
    'nav.insights':        'Insights',
    'nav.contact':         'Contact',
    'nav.cta':             'Request a Sample',

    // ── Insights dropdown ──
    'nav.ingredient_spotlight': 'Ingredient Spotlight',
    'nav.formulation_tips':     'Formulation Tips',
    'nav.research':             'Research',
    'nav.quality_testing':      'Quality & Testing',
    'nav.regulatory':           'Regulatory',
    'nav.market_trends':        'Market Trends',
    'nav.industry_news':        'Industry News',

    // ── Hero ──
    'hero.badge':          'B2B Plant Extract Supplier',
    'hero.title_1':        'Pure Nature,',
    'hero.title_2':        'Proven Science',
    'hero.subtitle':       'Premium botanical extracts for global nutraceutical, cosmetic, and pet health industries. 500+ high-purity ingredients — from PQQ and NMN to EGCG and Glabridin.',
    'hero.cta_explore':    'Explore Products',
    'hero.cta_sample':     'Request a Sample',
    'hero.trust_gmp':      'GMP Certified',
    'hero.trust_countries':'50+ Countries Served',
    'hero.trust_iso':      'ISO 9001:2015',
    'hero.featured':       'Featured Ingredient',

    // ── Footer ──
    'footer.tagline':         'Pure Nature, Proven Science.',
    'footer.tagline_sub':     'Premium B2B botanical extract supplier serving global nutraceutical, cosmetic and pet health industries.',
    'footer.col_products':    'Products',
    'footer.col_ingredients': 'Key Ingredients',
    'footer.col_company':     'Company',
    'footer.link_supplements':'Health Supplements',
    'footer.link_cosmetics':  'Cosmetic Actives',
    'footer.link_pet':        'Pet Health',
    'footer.link_custom':     'Custom Formulation',
    'footer.link_about':      'About Us',
    'footer.link_quality':    'Quality & Certifications',
    'footer.link_insights':   'Industry Insights',
    'footer.link_contact':    'Contact Us',
    'footer.link_rfq':        'Request a Quote',
    'footer.copyright':       'All rights reserved.',
    'footer.privacy':         'Privacy Policy',
    'footer.terms':           'Terms of Service',
    'footer.sitemap':         'Sitemap',

    // ── Products page ──
    'products.title':           'B2B Plant Extract Catalogue',
    'products.subtitle':        'Precision-manufactured botanical ingredients for global nutraceutical, cosmetic, and functional food brands.',
    'products.search':          'Search ingredients...',
    'products.all_categories':  'All Categories',
    'products.no_results':      'No products found matching your criteria.',
    'products.purity_label':    'Purity',
    'products.view_details':    'View Details',
    'products.request_sample':  'Request Sample',
    'products.featured_badge':  'Featured',
    'products.back_to_list':    '← Back to Products',

    // ── Product detail ──
    'product.tab_description':  'Description',
    'product.tab_specs':        'Technical Specifications',
    'product.tab_applications': 'Applications',
    'product.download_coa':     'Download COA',
    'product.download_msds':    'Download MSDS',
    'product.cta_rfq':          'Request a Quote / Sample',
    'product.certifications':   'Certifications',
    'product.cas_number':       'CAS Number',
    'product.purity':           'Assay / Purity',
    'product.active':           'Active Constituent',
    'product.no_description':   'No description provided.',
    'product.no_specs':         'Please contact our QA department to request the full technical specification sheet.',
    'product.no_applications':  'Nutraceutical supplements, cosmetics formulations, pet foods, and health products.',
    'product.faq_1_q':          'What is the minimum order quantity?',
    'product.faq_2_q':          'What certifications does this product hold?',
    'product.faq_3_q':          'Can I request a COA or sample?',
    'product.faq_4_q':          'What is the purity specification?',
    'product.specs_param':      'Parameter',
    'product.specs_value':      'Specification Value',
    'product.breadcrumb_home':  'Home',
    'product.breadcrumb_list':  'Products',

    // ── Insights ──
    'insights.title':           'Industry Insights',
    'insights.subtitle':        'Research, regulatory updates, and formulation expertise from our science team.',
    'insights.all_posts':       'All Posts',
    'insights.read_more':       'Read More',
    'insights.by_author':       'By',
    'insights.min_read':        'min read',
    'insights.no_posts':        'No articles found.',
    'insights.breadcrumb_home': 'Home',
    'insights.breadcrumb_list': 'Insights',

    // ── Contact ──
    'contact.title':            'Get in Touch',
    'contact.subtitle':         'Request a quotation, sample, or technical documentation.',
    'contact.form_name':        'Full Name',
    'contact.form_company':     'Company',
    'contact.form_email':       'Email Address',
    'contact.form_message':     'Message',
    'contact.form_submit':      'Send Inquiry',
    'contact.form_success':     'Your inquiry has been sent successfully!',

    // ── About ──
    'about.title':              'Pioneering Pure Plant Bioactives',
    'about.label':              'Our Company',

    // ── Quality ──
    'quality.title':            'Quality & Certifications',
    'quality.label':            'Our Standards',

    // ── Formulator ──
    'formulator.title':         'Scientific Formulation Console',
    'formulator.label':         'Lab Tools',

    // ── Common ──
    'common.loading':           'Loading...',
    'common.error':             'An error occurred.',
    'common.back':              'Back',
    'common.next':              'Next',
    'common.previous':          'Previous',
    'common.search':            'Search',
    'common.close':             'Close',
    'common.contact_cta':       'Need Premium Grade Ingredients?',
    'common.contact_cta_sub':   'Request documentation, COAs, or sample shipments for any active plant constituent directly from our commercial desk.',
    'common.contact_cta_btn':   'Request Quotation / Sample',
  },

  ru: {
    // ── Navigation ──
    'nav.products':        'Продукты',
    'nav.formulator':      'Формулятор',
    'nav.quality':         'Качество',
    'nav.about':           'О нас',
    'nav.insights':        'Блог',
    'nav.contact':         'Контакты',
    'nav.cta':             'Запросить образец',

    // ── Insights dropdown ──
    'nav.ingredient_spotlight': 'Ингредиенты',
    'nav.formulation_tips':     'Рецептуры',
    'nav.research':             'Исследования',
    'nav.quality_testing':      'Качество и тестирование',
    'nav.regulatory':           'Регуляторика',
    'nav.market_trends':        'Тренды рынка',
    'nav.industry_news':        'Новости отрасли',

    // ── Hero ──
    'hero.badge':          'B2B поставщик растительных экстрактов',
    'hero.title_1':        'Чистая природа,',
    'hero.title_2':        'Доказанная наука',
    'hero.subtitle':       'Премиальные растительные экстракты для мировых производителей нутрицевтиков, косметики и продукции для здоровья животных. 500+ высокочистых ингредиентов — от PQQ и NMN до EGCG и глабридина.',
    'hero.cta_explore':    'Каталог продуктов',
    'hero.cta_sample':     'Запросить образец',
    'hero.trust_gmp':      'GMP сертификат',
    'hero.trust_countries':'50+ стран',
    'hero.trust_iso':      'ISO 9001:2015',
    'hero.featured':       'Рекомендуемый ингредиент',

    // ── Footer ──
    'footer.tagline':         'Чистая природа, доказанная наука.',
    'footer.tagline_sub':     'Премиальный B2B поставщик растительных экстрактов для мировых производителей нутрицевтиков, косметики и продукции для здоровья животных.',
    'footer.col_products':    'Продукты',
    'footer.col_ingredients': 'Ключевые ингредиенты',
    'footer.col_company':     'Компания',
    'footer.link_supplements':'Биологически активные добавки',
    'footer.link_cosmetics':  'Косметические активы',
    'footer.link_pet':        'Здоровье животных',
    'footer.link_custom':     'Индивидуальные рецептуры',
    'footer.link_about':      'О компании',
    'footer.link_quality':    'Качество и сертификаты',
    'footer.link_insights':   'Отраслевой блог',
    'footer.link_contact':    'Связаться с нами',
    'footer.link_rfq':        'Запросить коммерческое предложение',
    'footer.copyright':       'Все права защищены.',
    'footer.privacy':         'Политика конфиденциальности',
    'footer.terms':           'Условия обслуживания',
    'footer.sitemap':         'Карта сайта',

    // ── Products page ──
    'products.title':           'Каталог растительных экстрактов B2B',
    'products.subtitle':        'Ингредиенты промышленного производства для мировых брендов нутрицевтиков, косметики и функционального питания.',
    'products.search':          'Поиск ингредиентов...',
    'products.all_categories':  'Все категории',
    'products.no_results':      'Продукты не найдены.',
    'products.purity_label':    'Чистота',
    'products.view_details':    'Подробнее',
    'products.request_sample':  'Запросить образец',
    'products.featured_badge':  'Рекомендуемый',
    'products.back_to_list':    '← Назад к каталогу',

    // ── Product detail ──
    'product.tab_description':  'Описание',
    'product.tab_specs':        'Технические характеристики',
    'product.tab_applications': 'Применение',
    'product.download_coa':     'Скачать COA',
    'product.download_msds':    'Скачать MSDS',
    'product.cta_rfq':          'Запросить коммерческое предложение / образец',
    'product.certifications':   'Сертификаты',
    'product.cas_number':       'Номер CAS',
    'product.purity':           'Анализ / Чистота',
    'product.active':           'Действующее вещество',
    'product.no_description':   'Описание не предоставлено.',
    'product.no_specs':         'Пожалуйста, свяжитесь с нашим отделом QA для получения полного листа технических характеристик.',
    'product.no_applications':  'Нутрицевтические добавки, косметические рецептуры, корма для животных и продукты для здоровья.',
    'product.faq_1_q':          'Каков минимальный объём заказа?',
    'product.faq_2_q':          'Какие сертификаты имеет этот продукт?',
    'product.faq_3_q':          'Можно ли запросить COA или образец?',
    'product.faq_4_q':          'Какова спецификация чистоты?',
    'product.specs_param':      'Параметр',
    'product.specs_value':      'Значение',
    'product.breadcrumb_home':  'Главная',
    'product.breadcrumb_list':  'Продукты',

    // ── Insights ──
    'insights.title':           'Отраслевой блог',
    'insights.subtitle':        'Исследования, нормативные обновления и экспертиза формуляций от нашей научной команды.',
    'insights.all_posts':       'Все статьи',
    'insights.read_more':       'Читать далее',
    'insights.by_author':       'Автор',
    'insights.min_read':        'мин. чтения',
    'insights.no_posts':        'Статьи не найдены.',
    'insights.breadcrumb_home': 'Главная',
    'insights.breadcrumb_list': 'Блог',

    // ── Contact ──
    'contact.title':            'Связаться с нами',
    'contact.subtitle':         'Запросить коммерческое предложение, образец или техническую документацию.',
    'contact.form_name':        'Полное имя',
    'contact.form_company':     'Компания',
    'contact.form_email':       'Адрес электронной почты',
    'contact.form_message':     'Сообщение',
    'contact.form_submit':      'Отправить запрос',
    'contact.form_success':     'Ваш запрос успешно отправлен!',

    // ── About ──
    'about.title':              'Первопроходцы чистых растительных биоактивов',
    'about.label':              'О компании',

    // ── Quality ──
    'quality.title':            'Качество и сертификаты',
    'quality.label':            'Наши стандарты',

    // ── Formulator ──
    'formulator.title':         'Консоль научных рецептур',
    'formulator.label':         'Лабораторные инструменты',

    // ── Common ──
    'common.loading':           'Загрузка...',
    'common.error':             'Произошла ошибка.',
    'common.back':              'Назад',
    'common.next':              'Далее',
    'common.previous':          'Предыдущий',
    'common.search':            'Поиск',
    'common.close':             'Закрыть',
    'common.contact_cta':       'Нужны ингредиенты высшего качества?',
    'common.contact_cta_sub':   'Запросите документацию, COA или образцы напрямую из нашего коммерческого отдела.',
    'common.contact_cta_btn':   'Запросить КП / образец',
  },
} as const;

export type UIKey = keyof typeof ui[typeof defaultLang];
