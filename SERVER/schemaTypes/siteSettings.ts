// schemaTypes/siteSettings.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: () => '⚙️',
  fields: [
    defineField({ name: 'siteName', type: 'string', title: 'Site Name', initialValue: 'GINKVORA' }),
    defineField({ name: 'tagline', type: 'string', title: 'Tagline', initialValue: 'Pure Nature, Proven Science' }),
    defineField({ name: 'contactEmail', type: 'string', title: 'Contact Email' }),
    defineField({ name: 'phone', type: 'string', title: 'Phone' }),
    defineField({
      name: 'address',
      type: 'object',
      title: 'Address',
      fields: [
        defineField({ name: 'street', type: 'string', title: 'Street' }),
        defineField({ name: 'city', type: 'string', title: 'City' }),
        defineField({ name: 'country', type: 'string', title: 'Country' }),
      ],
    }),
    defineField({
      name: 'certifications',
      type: 'array',
      title: 'Certifications',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'name', type: 'string', title: 'Name' }),
          defineField({ name: 'logo', type: 'image', title: 'Logo' }),
          defineField({ name: 'href', type: 'url', title: 'Link' }),
        ],
      })],
    }),
    defineField({
      name: 'stats',
      type: 'array',
      title: 'Homepage Stats',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'value', type: 'string', title: 'Value' }),
          defineField({ name: 'suffix', type: 'string', title: 'Suffix (e.g. +, %)' }),
          defineField({ name: 'label', type: 'string', title: 'Label' }),
          defineField({ name: 'icon', type: 'string', title: 'Icon Emoji' }),
        ],
      })],
    }),
    defineField({
      name: 'seo',
      type: 'object',
      title: 'Global SEO',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Default Meta Title' }),
        defineField({ name: 'description', type: 'text', title: 'Default Meta Description', rows: 3 }),
        defineField({ name: 'ogImage', type: 'image', title: 'Default OG Image' }),
      ],
    }),
  ],
})
