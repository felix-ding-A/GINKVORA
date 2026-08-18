// schemaTypes/index.ts — Exports all schema types
import { productType } from './product'
import { categoryType } from './category'
import { postType } from './post'
import { siteSettingsType } from './siteSettings'
import { authorType } from './author'
import { leadType } from './lead'

export const schemaTypes = [
  productType,
  categoryType,
  postType,
  siteSettingsType,
  authorType,
  leadType,
]
