import { vi } from "vitest"

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}))

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ type: "credentials", id: "credentials" })),
}))

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}))

// Mock groq-sdk
vi.mock("groq-sdk", () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

// Set default env vars for tests
process.env.GROQ_API_KEY = "test-groq-key"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/leadflow"
process.env.AUTH_SECRET = "test-auth-secret"
