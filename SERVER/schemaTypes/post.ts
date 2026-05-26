// schemaTypes/post.ts — Blog post schema
import { defineType, defineField, defineArrayMember } from 'sanity'
import { CustomMarkdownInput } from './components/CustomMarkdownInput'

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
      name: 'updatedAt',
      title: 'Updated At (dateModified)',
      type: 'datetime',
      description: 'Last update time of this post for schema.org dateModified.',
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
      title: 'Body (Markdown)',
      type: 'markdown',
      components: {
        input: CustomMarkdownInput,
      },
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
    defineField({
      name: 'seoTitle',
      title: 'SEO Title (Title Tag)',
      type: 'string',
      description: 'Used for the browser title tag. Keep it under 60 characters.',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description (Meta Description)',
      type: 'text',
      rows: 3,
      description: 'Used for the search engine results snippet. Keep it under 160 characters.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
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
      name: 'relatedProduct',
      title: 'Related Product',
      type: 'reference',
      to: [{ type: 'product' }],
      description: 'Link this post to a related product (e.g. Quercetin product page)',
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
