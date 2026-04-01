import type { Role, VerificationStatus } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      verificationStatus: VerificationStatus | null
    } & DefaultSession['user']
  }

  interface User {
    role?: Role
    verificationStatus?: VerificationStatus | null
  }
}
