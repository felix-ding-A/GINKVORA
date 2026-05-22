// schemaTypes/post.ts — Blog post schema
import { defineType, defineField, defineArrayMember } from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in listing cards',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time (minutes)',
      type: 'number',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
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
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Meta Title' }),
        defineField({ name: 'description', type: 'text', title: 'Meta Description', rows: 3 }),
      ],
    }),
  ],
  orderings: [
    { title: 'Published Date (newest)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
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
