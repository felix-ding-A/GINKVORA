// schemaTypes/product.ts — Product schema for B2B plant extracts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: () => '🌿',
  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'technical', title: 'Technical Specs' },
    { name: 'media', title: 'Media' },
    { name: 'documents', title: 'Documents' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basic Info ────────────────────────────────
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      group: 'basic',
      description: 'e.g. "PQQ Disodium Salt" or "EGCG 98%"',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'cname',
      title: 'CNAME (Backend Record Name)',
      type: 'string',
      group: 'basic',
      description: '中文名称或内部备用名，仅在后台记录使用，前端不会展示。',
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      group: 'basic',
      description: 'Show on homepage and top of product listings',
      initialValue: false,
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'basic',
      rows: 3,
      description: 'One paragraph summary (shown in product cards)',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'array',
      group: 'basic',
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
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Important for SEO and accessibility'
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        }),
        // Supports video embed
        defineArrayMember({
          type: 'object',
          name: 'video',
          title: 'Video',
          fields: [
            {
              name: 'url',
              title: 'Video URL',
              type: 'url',
              description: 'Link to YouTube, Vimeo, or direct MP4/WebM video file'
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        }),
        // Supports standalone math block
        defineArrayMember({
          type: 'object',
          name: 'mathBlock',
          title: 'Math Block (Formula)',
          fields: [
            {
              name: 'expression',
              title: 'LaTeX Expression',
              type: 'string',
              description: 'e.g. E = mc^2'
            }
          ]
        })
      ],
    }),

    // ── Technical Specs ────────────────────────────
    defineField({
      name: 'botanicalName',
      title: 'Botanical / Chemical Name',
      type: 'string',
      group: 'technical',
      description: 'e.g. "Pyrroloquinoline quinone disodium salt" or Latin name',
    }),
    defineField({
      name: 'casNumber',
      title: 'CAS Number',
      type: 'string',
      group: 'technical',
      description: 'e.g. "122628-50-6"',
    }),
    defineField({
      name: 'activeIngredient',
      title: 'Active Ingredient',
      type: 'string',
      group: 'technical',
      description: 'Main active compound name',
    }),
    defineField({
      name: 'purity',
      title: 'Purity',
      type: 'string',
      group: 'technical',
      description: 'e.g. "≥ 99%" or "40% Glabridin"',
    }),
    defineField({
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'array',
      group: 'technical',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Parameter' }),
            defineField({ name: 'value', type: 'string', title: 'Value' }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
          },
        }),
      ],
      description: 'Add rows like: Appearance → White powder, Moisture → ≤ 5%',
    }),
    defineField({
      name: 'applications',
      title: 'Applications / Use Cases',
      type: 'array',
      group: 'technical',
      of: [defineArrayMember({ type: 'string' })],
      description: 'e.g. ["Dietary supplements", "Functional foods", "Cosmetics"]',
      options: {
        list: [
          { title: 'Dietary Supplements', value: 'Dietary Supplements' },
          { title: 'Functional Foods & Beverages', value: 'Functional Foods & Beverages' },
          { title: 'Pharmaceuticals', value: 'Pharmaceuticals' },
          { title: 'Cosmetics & Skincare', value: 'Cosmetics & Skincare' },
          { title: 'Hair Care', value: 'Hair Care' },
          { title: 'Pet Supplements', value: 'Pet Supplements' },
          { title: 'Sports Nutrition', value: 'Sports Nutrition' },
          { title: 'Animal Feed', value: 'Animal Feed' },
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      group: 'technical',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'ISO 9001:2015', value: 'ISO 9001:2015' },
          { title: 'GMP', value: 'GMP' },
          { title: 'FSSC 22000', value: 'FSSC 22000' },
          { title: 'Kosher', value: 'Kosher' },
          { title: 'Halal', value: 'Halal' },
          { title: 'Organic', value: 'Organic' },
          { title: 'Non-GMO', value: 'Non-GMO' },
          { title: 'Vegan', value: 'Vegan' },
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'minimumOrderQuantity',
      title: 'Minimum Order Quantity',
      type: 'string',
      group: 'technical',
      description: 'e.g. "1kg", "25kg"',
    }),
    defineField({
      name: 'packagingOptions',
      title: 'Packaging Options',
      type: 'array',
      group: 'technical',
      of: [defineArrayMember({ type: 'string' })],
      description: 'e.g. ["1kg bags", "25kg drums", "Custom packaging"]',
    }),
    defineField({
      name: 'shelfLife',
      title: 'Shelf Life',
      type: 'string',
      group: 'technical',
      description: 'e.g. "24 months from manufacture date"',
    }),
    defineField({
      name: 'storageConditions',
      title: 'Storage Conditions',
      type: 'string',
      group: 'technical',
      description: 'e.g. "Store in a cool, dry place, away from direct sunlight"',
    }),

    // ── Media ───────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Describe the image for accessibility and SEO',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
          ],
        }),
      ],
    }),

    // ── Documents ──────────────────────────────────
    defineField({
      name: 'coaFile',
      title: 'COA (Certificate of Analysis)',
      type: 'file',
      group: 'documents',
      description: 'Upload the Certificate of Analysis PDF',
    }),
    defineField({
      name: 'msdsFile',
      title: 'MSDS / SDS (Safety Data Sheet)',
      type: 'file',
      group: 'documents',
    }),
    defineField({
      name: 'specSheet',
      title: 'Product Specification Sheet',
      type: 'file',
      group: 'documents',
    }),

    // ── SEO ─────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Meta Title', description: 'Max 60 characters' }),
        defineField({ name: 'description', type: 'text', title: 'Meta Description', description: 'Max 160 characters', rows: 3 }),
      ],
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'purity',
      media: 'heroImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Product',
        subtitle: subtitle ? `Purity: ${subtitle}` : 'No purity set',
        media,
      }
    },
  },
})
