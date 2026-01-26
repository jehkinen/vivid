import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await hash('jehkinen@gmail.com', 10)
  await prisma.author.upsert({
    where: { email: 'jehkinen@gmail.com' },
    create: {
      id: createId(),
      name: 'Andrei',
      slug: 'andrei',
      email: 'jehkinen@gmail.com',
      passwordHash,
    },
    update: { name: 'Andrei', slug: 'andrei', passwordHash },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
