import { prisma } from '../lib/prisma'
import { postsService } from '../services/posts.service'

const slug = process.argv[2] || 'rgp-journal-import'

async function main(): Promise<void> {
  const post = await postsService.findOne({ slug })
  if (!post) {
    console.log(`Post with slug "${slug}" not found`)
    return
  }
  await postsService.hardDelete(post.id)
  console.log(`Deleted post: ${post.id} (${slug})`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
