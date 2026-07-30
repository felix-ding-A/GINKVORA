// schemaTypes/post.ts — Blog post schema
import { defineType, defineField, defineArrayMember } from 'sanity'
import { CustomMarkdownInput } from './components/CustomMarkdownInput'

export const postType = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  icon: () => '📝',
  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'i18n', title: '🌍 Translations (RU & AR & ES)' },
    { name: 'seo', title: 'SEO Settings' },
    { name: 'faq', title: 'FAQ' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'basic',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'basic',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt Text (Required for SEO)',
          validation: (Rule) => Rule.required().error('封面图的 Alt 替代文本不可为空！'),
        }),
      ],
    }),
    defineField({
      name: 'postVideo',
      title: 'Featured Post Video',
      type: 'mux.video',
      group: 'basic',
      description: 'Upload video for this blog post via Mux Video CDN',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'basic',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At (dateModified)',
      type: 'datetime',
      group: 'basic',
      description: 'Last update time of this post for schema.org dateModified.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'basic',
      rows: 3,
      description: 'Short summary shown in listing cards',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time (minutes)',
      type: 'number',
      group: 'basic',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'basic',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Industry News', value: 'Industry News' },
          { title: 'Ingredient Spotlight', value: 'Ingredient Spotlight' },
          { title: 'Research', value: 'Research' },
          { title: 'Regulatory', value: 'Regulatory' },
          { title: 'Market Trends', value: 'Market Trends' },
          { title: 'Quality & Testing', value: 'Quality & Testing' },
          { title: 'Formulation Tips', value: 'Formulation Tips' },
        ],
      },
    }),
    defineField({
      name: 'featured',
      title: 'Recommend on Homepage',
      type: 'boolean',
      group: 'basic',
      initialValue: false,
      description: 'If checked, this post will be featured in the Industry Insights section on the homepage.',
    }),
    defineField({
      name: 'body',
      title: 'Body (Markdown)',
      type: 'markdown',
      group: 'basic',
      components: {
        input: CustomMarkdownInput,
      },
    }),

    // ── 🌍 Translations (Russian) ─────────────────
    defineField({
      name: 'title_ru',
      title: '🇷🇺 Заголовок (RU)',
      type: 'string',
      group: 'i18n',
      description: 'Заголовок статьи на русском языке',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'excerpt_ru',
      title: '🇷🇺 Краткое содержание (RU)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Краткое содержание статьи на русском языке (для карточек)',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'body_ru',
      title: '🇷🇺 Текст статьи (RU, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Полный текст статьи на русском языке.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_ru',
      title: '🇷🇺 Meta Title (RU)',
      type: 'string',
      group: 'i18n',
      description: 'Заголовок страницы для поисковых систем на русском языке (до 60 символов).',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'meta_description_ru',
      title: '🇷🇺 Meta Description (RU)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Мета-описание для поисковых систем на русском языке (до 160 символов).',
      validation: (Rule) => Rule.max(160),
    }),

    // ── 🌍 Translations (Arabic) ─────────────────
    defineField({
      name: 'title_ar',
      title: '🇸🇦 العنوان (AR)',
      type: 'string',
      group: 'i18n',
      description: 'عنوان المقال باللغة العربية',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'excerpt_ar',
      title: '🇸🇦 المقتطف (AR)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'ملخص قصير للمقال باللغة العربية (لبطاقات المقالات)',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'body_ar',
      title: '🇸🇦 نص المقال (AR, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'النص الكامل للمقال باللغة العربية.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_ar',
      title: '🇸🇦 Meta Title (AR)',
      type: 'string',
      group: 'i18n',
      description: 'العنوان التعريفي لمحركات البحث باللغة العربية (حتى 60 حرفاً).',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'meta_description_ar',
      title: '🇸🇦 Meta Description (AR)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'الوصف التعريفي لمحركات البحث باللغة العربية (حتى 160 حرفاً).',
      validation: (Rule) => Rule.max(160),
    }),

    // ── 🌍 Translations (Spanish) ────────────────
    defineField({
      name: 'title_es',
      title: '🇪🇸 Título (ES)',
      type: 'string',
      group: 'i18n',
      description: 'Título del artículo en español',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'excerpt_es',
      title: '🇪🇸 Extracto (ES)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Breve resumen del artículo en español (para tarjetas)',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'body_es',
      title: '🇪🇸 Cuerpo del Artículo (ES, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Texto completo del artículo en español en formato Markdown.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_es',
      title: '🇪🇸 Meta Title (ES)',
      type: 'string',
      group: 'i18n',
      description: 'Título de la página para motores de búsqueda en español (hasta 60 caracteres).',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'meta_description_es',
      title: '🇪🇸 Meta Description (ES)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Meta descripción para motores de búsqueda en español (hasta 160 caracteres).',
      validation: (Rule) => Rule.max(160),
    }),


    defineField({
      name: 'meta_title',
      title: 'Meta Title (Title Tag)',
      type: 'string',
      group: 'seo',
      description: 'Used for the browser title tag (建议 10~60 字符).',
      validation: (Rule) =>
        Rule.required()
          .error('SEO 错误：Meta Title 不能为空！')
          .min(10)
          .warning('SEO 提示：Meta Title 建议不少于 10 个字符')
          .max(60)
          .error('SEO 错误：Meta Title 超过 60 个字符，谷歌搜素结果会被截断！'),
    }),
    defineField({
      name: 'meta_description',
      title: 'Meta Description',
      type: 'text',
      group: 'seo',
      rows: 3,
      description: 'Used for the search engine results snippet (建议 50~160 字符).',
      validation: (Rule) =>
        Rule.required()
          .error('SEO 错误：Meta Description 不能为空！')
          .min(50)
          .warning('SEO 提示：Meta Description 建议不少于 50 个字符')
          .max(160)
          .error('SEO 错误：Meta Description 超过 160 个字符，谷歌搜素结果会被截断！'),
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      group: 'faq',
      description: 'Add Frequently Asked Questions for this post (SEO-optimized)',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_ru',
      title: 'FAQ Items (RU)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this post in Russian',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Вопрос',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Ответ',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_ar',
      title: 'FAQ Items (AR)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this post in Arabic',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'السؤال',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'الإجابة',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_es',
      title: 'FAQ Items (ES)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this post in Spanish',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Pregunta',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Respuesta',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'relatedProduct',
      title: 'Related Product',
      type: 'reference',
      to: [{ type: 'product' }],
      group: 'basic',
      description: 'Link this post to a related product (e.g. Quercetin product page)',
    }),
  ],
  orderings: [
    { title: 'Published Date (newest)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
    { title: 'Published Date (oldest)', name: 'publishedAtAsc', by: [{ field: 'publishedAt', direction: 'asc' }] },
    { title: 'Author Name (A-Z)', name: 'authorNameAsc', by: [{ field: 'author.name', direction: 'asc' }] },
    { title: 'Author Name (Z-A)', name: 'authorNameDesc', by: [{ field: 'author.name', direction: 'desc' }] },
    { title: 'Title (A-Z)', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', media: 'coverImage', date: 'publishedAt' },
    prepare({ title, media, date }) {
      return {
        title,
        subtitle: date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date',
        media,
      }
    },
  },
})
