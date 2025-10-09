import type { CollectionSlug, FieldHook } from 'payload'
import { deepMerge, Field } from 'payload'
import { getPayload } from 'payload'

const format = (val: string): string =>
  val
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')

async function isTitleFound(title: string, collection: CollectionSlug) {
  const db = await getPayload({
    config: await import('../payload.config.js').then((m) => m.default),
  })
  const titleFound = await db.find({
    collection: collection,
    where: {
      slug: {
        equals: title,
      },
    },
  })

  if (titleFound.docs.length > 0) return true
  return false
}

async function getUniqueSlug(slug: string, collection: CollectionSlug) {
  let i = 2
  let isFound = await isTitleFound(slug, collection)
  const regex = /^.*-\d+$/

  while (isFound) {
    if (regex.test(slug)) {
      const match = slug.match(regex)
      if (match) {
        i = parseInt(match?.[0]?.split('-')?.pop() || '0') + 1
      }
      slug = slug.replace(/\d+$/, '')
      slug += `${i}`
    } else {
      slug += `-${i}`
    }
    isFound = await isTitleFound(slug, collection)
  }

  return slug
}

const formatSlug =
  (collection: CollectionSlug, fallback: string): FieldHook =>
  ({ operation, value, originalDoc, data }) => {
    if (typeof value === 'string') return getUniqueSlug(format(value), collection)

    if (operation === 'create') {
      const fallbackData = data?.[fallback] || originalDoc?.[fallback]

      if (fallbackData && typeof fallbackData === 'string') {
        return getUniqueSlug(format(fallbackData), collection)
      }
    }

    return value
  }

type Slug = (
  collectionSlug: CollectionSlug,
  fieldToUse?: string,
  overrides?: Partial<Field>,
) => Field

export const slugField: Slug = (collectionSlug, fieldToUse = 'title', overrides = {}) =>
  deepMerge(
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug(collectionSlug, fieldToUse)],
      },
      index: true,
      label: 'Slug',
    },
    overrides,
  )
