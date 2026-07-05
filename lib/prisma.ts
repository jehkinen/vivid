import { PrismaClient } from '@prisma/client'

const PRISMA_CLIENT_VERSION = 2

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  if (!client.postReference) {
    throw new Error(
      'Prisma client is missing postReference. Run `npx prisma generate` in vivid/ and restart the dev server.'
    )
  }
  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaVersion?: number
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  if (
    cached &&
    globalForPrisma.prismaVersion === PRISMA_CLIENT_VERSION &&
    cached.postReference
  ) {
    return cached
  }

  if (cached) {
    void cached.$disconnect().catch(() => {})
  }

  const client = createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
    globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION
  }

  return client
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, client)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
