import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

type ApiHandler<T = void> = T extends void
  ? (request: NextRequest) => Promise<NextResponse>
  : (request: NextRequest, context: T) => Promise<NextResponse>

export function apiHandler<T = void>(handler: ApiHandler<T>): ApiHandler<T> {
  return (async (request: NextRequest, context?: T) => {
    try {
      return await handler(request, context as T)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.') || 'root',
          message: err.message,
        }))

        return NextResponse.json(
          {
            error: 'Validation failed',
            errors,
          },
          { status: 400 }
        )
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined
          const field = target ? target.join('.') : 'field'
          const message =
            field === 'slug'
              ? 'A tag with this slug already exists. Choose a different slug.'
              : `${field} must be unique`
          return NextResponse.json(
            { error: message, errors: [{ field, message }] },
            { status: 409 }
          )
        }

        if (error.code === 'P2025') {
          return NextResponse.json(
            {
              error: 'Record not found',
            },
            { status: 404 }
          )
        }

        return NextResponse.json(
          {
            error: 'Database error',
            message: error.message,
          },
          { status: 500 }
        )
      }

      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: error.message || 'Internal server error',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      )
    }
  }) as ApiHandler<T>
}