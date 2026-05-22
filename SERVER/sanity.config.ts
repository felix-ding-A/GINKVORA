import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { table } from '@sanity/table'
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
                S.documentList()
                  .title('Products')
                  .filter('_type == "product"')
              ),
            S.listItem()
              .title('📂 Categories')
              .child(
                S.documentList()
                  .title('Categories')
                  .filter('_type == "category"')
              ),
            S.divider(),
            S.listItem()
              .title('📝 Blog Posts')
              .child(
                S.documentList()
                  .title('Posts')
                  .filter('_type == "post"')
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
