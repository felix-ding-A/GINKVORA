// schemaTypes/author.ts
import { defineType, defineField } from 'sanity'

export const authorType = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: () => '👤',
  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'i18n',  title: '🌍 Translations (RU & AR)' },
  ],
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Name', group: 'basic', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', group: 'basic', options: { source: 'name' } }),
    defineField({ name: 'avatar', type: 'image', title: 'Avatar', group: 'basic', options: { hotspot: true } }),
    defineField({ name: 'bio', type: 'text', title: 'Bio', group: 'basic', rows: 3 }),
    defineField({ name: 'title', type: 'string', title: 'Job Title', group: 'basic' }),
    defineField({
      name: 'credentials',
      type: 'string',
      title: 'Credentials',
      group: 'basic',
      description: 'Professional credentials (e.g. "MD, PhD", "CNC", "RD, LDN")',
    }),

    // ── 🌍 Translations (Russian) ─────────────────
    defineField({ name: 'title_ru', type: 'string', title: '🇷🇺 Job Title (RU)', group: 'i18n' }),
    defineField({ name: 'bio_ru', type: 'text', title: '🇷🇺 Bio (RU)', group: 'i18n', rows: 3 }),

    // ── 🌍 Translations (Arabic) ─────────────────
    defineField({ name: 'title_ar', type: 'string', title: '🇸🇦 Job Title (AR)', group: 'i18n' }),
    defineField({ name: 'bio_ar', type: 'text', title: '🇸🇦 Bio (AR)', group: 'i18n', rows: 3 }),
  ],
  preview: {
    select: { title: 'name', media: 'avatar' },
  },
})
