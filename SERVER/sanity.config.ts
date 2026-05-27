import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { table } from '@sanity/table'
import { markdownSchema } from 'sanity-plugin-markdown'
import { schemaTypes } from './schemaTypes'
import { GenerateWithAIAction } from './actions/generateWithAI'

export default defineConfig({
  name: 'default',
  title: 'GINKVORA CMS',

  // ✅ GINKVORA Sanity Project
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'h5gs7zpr',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('GINKVORA Content')
          .items([
            S.listItem()
              .title('🌿 Products')
              .child(
                S.documentTypeList('product')
                  .title('Products')
              ),
            S.listItem()
              .title('📂 Categories')
              .child(
                S.documentTypeList('category')
                  .title('Categories')
              ),
            S.divider(),
            S.listItem()
              .title('📝 Blog Posts')
              .child(
                S.documentTypeList('post')
                  .title('Posts')
              ),
            S.listItem()
              .title('👤 Authors')
              .child(
                S.documentTypeList('author')
                  .title('Authors')
              ),
            S.divider(),
            S.listItem()
              .title('⚙️ Site Settings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
          ]),
    }),
    visionTool(),
    table(),
    markdownSchema(),
  ],

  document: {
    actions: (prev, context) => {
      return context.schemaType === 'post' || context.schemaType === 'product'
        ? [...prev, GenerateWithAIAction]
        : prev
    }
  },

  schema: {
    types: schemaTypes,
  },
})
