import { prisma } from '../lib/prisma'
import { postsService } from '../services/posts.service'

const POST_SLUG = 'rgp-journal-import'

async function main() {
  const post = await prisma.post.findFirst({ where: { slug: POST_SLUG } })
  if (!post?.lexical) {
    console.log(`Post not found or has no content: ${POST_SLUG}`)
    return
  }
  const root = JSON.parse(post.lexical) as { root?: { children?: unknown[] } }
  if (!root?.root?.children || !Array.isArray(root.root.children)) {
    console.log('No root.children to clean')
    return
  }
  const before = root.root.children.length
  root.root.children = root.root.children.filter(
    (node) => (node as { type?: string }).type !== 'linebreak'
  )
  const removed = before - root.root.children.length
  if (removed === 0) {
    console.log('No linebreak blocks found')
    return
  }
  await postsService.update(post.id, { lexical: JSON.stringify(root) })
  console.log(`Removed ${removed} <br> blocks between paragraphs in post ${post.id} (${POST_SLUG})`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
