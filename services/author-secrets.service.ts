import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret } from '@/lib/secrets-crypto'
import {
  API_ERROR_CODE,
  OPENAI_KEY_MIN_LENGTH,
  OPENAI_KEY_PREFIX,
} from '@/shared/constants'

export class OpenAiNotConfiguredError extends Error {
  code = API_ERROR_CODE.OPENAI_NOT_CONFIGURED

  constructor() {
    super('OpenAI API key is not configured')
    this.name = 'OpenAiNotConfiguredError'
  }
}

function validateOpenAiKey(key: string): void {
  if (!key.startsWith(OPENAI_KEY_PREFIX) || key.length < OPENAI_KEY_MIN_LENGTH) {
    throw new Error('Invalid OpenAI API key format')
  }
}

function buildKeyHint(key: string): string {
  return `sk-…${key.slice(-4)}`
}

export class AuthorSecretsService {
  async getOpenAiStatus(authorId: string) {
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      select: { openAiKeyEncrypted: true, openAiKeyHint: true },
    })
    const configured = Boolean(author?.openAiKeyEncrypted)
    return {
      configured,
      ...(author?.openAiKeyHint ? { hint: author.openAiKeyHint } : {}),
    }
  }

  async saveOpenAiKey(authorId: string, key: string) {
    const trimmed = key.trim()
    validateOpenAiKey(trimmed)
    await prisma.author.update({
      where: { id: authorId },
      data: {
        openAiKeyEncrypted: encryptSecret(trimmed),
        openAiKeyHint: buildKeyHint(trimmed),
      },
    })
    return this.getOpenAiStatus(authorId)
  }

  async deleteOpenAiKey(authorId: string) {
    await prisma.author.update({
      where: { id: authorId },
      data: {
        openAiKeyEncrypted: null,
        openAiKeyHint: null,
      },
    })
  }

  async requireOpenAiKey(authorId: string): Promise<string> {
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      select: { openAiKeyEncrypted: true },
    })
    if (!author?.openAiKeyEncrypted) {
      throw new OpenAiNotConfiguredError()
    }
    return decryptSecret(author.openAiKeyEncrypted)
  }
}

export const authorSecretsService = new AuthorSecretsService()
