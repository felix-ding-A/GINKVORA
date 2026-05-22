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
        defineArrayMember({
          type: 'block',
          of: [
            {
              type: 'object',
              name: 'inlineFormula',
              title: 'Inline Formula (Math)',
              fields: [
                {
                  name: 'expression',
                  title: 'LaTeX Expression',
                  type: 'string',
                  description: 'e.g. \\alpha + \\beta = \\gamma'
                }
              ]
            }
          ]
        }),
        // Supports table using @sanity/table plugin
        defineArrayMember({ type: 'table', title: 'Table' }),
        // Supports images with caption and alt text
        defineArrayMember({
          type: 'image',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Important for SEO and accessibility'
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption'
            })
          ]
        }),
        // Supports video embed
        defineArrayMember({
          type: 'object',
          name: 'video',
          title: 'Video',
          fields: [
            defineField({
              name: 'url',
              title: 'Video URL',
              type: 'url',
              description: 'Link to YouTube, Vimeo, or direct MP4/WebM video file'
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption'
            })
          ]
        }),
        // Supports standalone math block
        defineArrayMember({
          type: 'object',
          name: 'mathBlock',
          title: 'Math Block (Formula)',
          fields: [
            defineField({
              name: 'expression',
              title: 'LaTeX Expression',
              type: 'string',
              description: 'e.g. E = mc^2'
            })
          ]
        })
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
