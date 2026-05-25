// schemaTypes/author.ts
import { defineType, defineField } from 'sanity'

export const authorType = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: () => '👤',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'name' } }),
    defineField({ name: 'avatar', type: 'image', title: 'Avatar', options: { hotspot: true } }),
    defineField({ name: 'bio', type: 'text', title: 'Bio', rows: 3 }),
    defineField({ name: 'title', type: 'string', title: 'Job Title' }),
    defineField({
      name: 'credentials',
      type: 'string',
      title: 'Credentials',
      description: 'Professional credentials (e.g. "MD, PhD", "CNC", "RD, LDN")',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'avatar' },
  },
})
