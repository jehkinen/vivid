import { runImportForPostId } from './import-ghost'
import { prisma } from '../lib/prisma'

let ghostPostId = process.argv[2]
if (!ghostPostId) {
  console.error('Usage: npm run import:ghost:test -- <ghostPostId>')
  console.error('   Or: npm run import:ghost:test -- "http://localhost:2368/ghost/#/editor/post/<id>"')
  process.exit(1)
}
const editorPostMatch = ghostPostId.match(/editor\/post\/([a-f0-9]+)/i)
if (editorPostMatch) {
  ghostPostId = editorPostMatch[1]
}

runImportForPostId(ghostPostId)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
