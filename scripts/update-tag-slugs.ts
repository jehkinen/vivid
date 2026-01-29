import { prisma } from '../lib/prisma'
import { slugify } from '../lib/utils'

async function main() {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  const used = new Set<string>()
  const updates: { id: string; name: string; oldSlug: string; newSlug: string }[] = []

  for (const tag of tags) {
    const baseSlug = slugify(tag.name)
    let newSlug = baseSlug
    let n = 2
    while (used.has(newSlug)) {
      newSlug = `${baseSlug}-${n}`
      n += 1
    }
    used.add(newSlug)
    if (newSlug !== tag.slug) {
      updates.push({ id: tag.id, name: tag.name, oldSlug: tag.slug, newSlug })
    }
  }

  if (updates.length === 0) {
    console.log('All tag slugs are already up to date.')
    return
  }

  for (const u of updates) {
    await prisma.tag.update({
      where: { id: u.id },
      data: { slug: u.newSlug },
    })
    console.log(`"${u.name}": ${u.oldSlug} → ${u.newSlug}`)
  }

  console.log(`Updated ${updates.length} tag slug(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
