// schemaTypes/category.ts
import { defineType, defineField } from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Product Category',
  type: 'document',
  icon: () => '📂',
  fields: [
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'icon',
      title: 'Icon Emoji',
      type: 'string',
      description: 'Emoji icon, e.g. 💊 🌿 ✨ 🐾',
    }),
    defineField({
      name: 'color',
      title: 'Accent Color (hex)',
      type: 'string',
      description: 'e.g. #7cb87a',
    }),
    defineField({
      name: 'order',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower number = shown first',
      initialValue: 10,
    }),
  ],
  orderings: [
    { title: 'Sort Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'description' },
    prepare({ title, subtitle }) {
      return { title, subtitle }
    },
  },
})
