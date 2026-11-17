import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './page'

const mocks = vi.hoisted(() => ({
  values: [] as unknown[],
  index: 0,
  create: vi.fn(),
  signIn: vi.fn(),
  push: vi.fn(),
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = mocks.index++
      if (!(index in mocks.values)) mocks.values[index] = initial
      return [mocks.values[index], (value: unknown) => { mocks.values[index] = value }]
    },
  }
})
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mocks.create,
  signInWithEmailAndPassword: mocks.signIn,
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))
vi.mock('@/lib/db/firebase', () => ({ auth: 'auth' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/lib/analytics/events', () => ({
  AnalyticsEvents: { LoginSuccess: 'success', LoginFailed: 'failed' },
  trackEvent: vi.fn(),
}))

type Props = { children?: ReactNode; [key: string]: unknown }

function find(node: ReactNode, predicate: (element: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate)
      if (match) return match
    }
    return undefined
  }
  if (!isValidElement<Props>(node)) return undefined
  if (predicate(node)) return node
  return find(node.props.children, predicate)
}

function render() {
  mocks.index = 0
  return LoginPage()
}

function setInput(tree: ReactNode, placeholder: string, value: string) {
  const input = find(tree, element => element.props.placeholder === placeholder)
  expect(input).toBeDefined()
  ;(input!.props.onChange as (event: unknown) => void)({ target: { value } })
}

function registerMode() {
  const tree = render()
  const toggle = find(tree, element => element.type === 'button' && element.props.children === 'New to FM Tracker? Create an account')
  ;(toggle!.props.onClick as () => void)()
}

async function submit(tree: ReactNode) {
  const form = find(tree, element => element.type === 'form')
  await (form!.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault: vi.fn() })
}

beforeEach(() => {
  mocks.values = []
  mocks.index = 0
  vi.clearAllMocks()
})

describe('email registration', () => {
  it('creates an account and redirects with the trimmed email', async () => {
    registerMode()
    let tree = render()
    setInput(tree, 'you@club.com', ' manager@example.com ')
    setInput(tree, 'Enter password', 'password123')
    setInput(tree, 'Confirm password', 'password123')
    tree = render()
    await submit(tree)
    expect(mocks.create).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123')
    expect(mocks.signIn).not.toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith('/')
  })

  it('rejects mismatched passwords and reports Firebase errors', async () => {
    registerMode()
    let tree = render()
    setInput(tree, 'you@club.com', 'manager@example.com')
    setInput(tree, 'Enter password', 'password123')
    setInput(tree, 'Confirm password', 'different')
    await submit(render())
    expect(mocks.create).not.toHaveBeenCalled()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toBe('Passwords do not match.')

    tree = render()
    setInput(tree, 'Confirm password', 'password123')
    mocks.create.mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    await submit(render())
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toContain('already exists')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('continues to sign in existing users', async () => {
    const tree = render()
    setInput(tree, 'you@club.com', 'manager@example.com')
    setInput(tree, 'Enter password', 'password123')
    await submit(render())
    expect(mocks.signIn).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123')
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('clears registration errors when switching back to sign in', async () => {
    registerMode()
    const tree = render()
    setInput(tree, 'you@club.com', 'manager@example.com')
    setInput(tree, 'Enter password', 'password123')
    setInput(tree, 'Confirm password', 'different')
    await submit(render())
    const toggle = find(render(), element => element.type === 'button' && element.props.children === 'Already have an account? Sign in')
    ;(toggle!.props.onClick as () => void)()
    expect(find(render(), element => element.props.role === 'alert')).toBeUndefined()
    expect(find(render(), element => element.props.placeholder === 'Confirm password')).toBeUndefined()
    await submit(render())
    expect(mocks.signIn).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123')
  })
})
