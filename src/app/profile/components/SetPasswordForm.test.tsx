import { isValidElement, type ReactElement, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SetPasswordForm from './SetPasswordForm'

const mocks = vi.hoisted(() => ({
  values: [] as unknown[],
  refs: [] as { current: unknown }[],
  index: 0,
  refIndex: 0,
  auth: { currentUser: null as User | null },
  reauthenticate: vi.fn(),
  link: vi.fn(),
  credential: vi.fn(),
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
    useRef: (initial: unknown) => mocks.refs[mocks.refIndex++] ??= { current: initial },
  }
})
vi.mock('@/lib/db/firebase', () => ({ auth: mocks.auth }))
vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: mocks.credential },
  GoogleAuthProvider: vi.fn(),
  linkWithCredential: mocks.link,
  reauthenticateWithPopup: mocks.reauthenticate,
}))

type Props = { children?: ReactNode; [key: string]: unknown }
let user: User

function find(node: ReactNode, predicate: (element: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate)
      if (match) return match
    }
    return undefined
  }
  if (!isValidElement<Props>(node)) return undefined
  return predicate(node) ? node : find(node.props.children, predicate)
}

function render() {
  mocks.index = mocks.refIndex = 0
  return SetPasswordForm({ user })
}

function input(name: string, value: string) {
  const field = find(render(), element => element.props.name === name)
  expect(field).toBeDefined()
  ;(field!.props.onChange as (event: unknown) => void)({ target: { value } })
}

async function submit() {
  const form = find(render(), element => element.type === 'form')
  expect(form).toBeDefined()
  await (form!.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault: vi.fn() })
}

function fill() {
  input('newPassword', ' a strong password 123! ')
  input('confirmPassword', ' a strong password 123! ')
}

beforeEach(() => {
  mocks.values = []
  mocks.refs = []
  vi.resetAllMocks()
  user = {
    uid: 'existing-manager',
    email: 'manager@example.com',
    providerData: [{
      providerId: 'google.com', uid: 'google-manager', email: 'manager@example.com',
      displayName: 'Manager', phoneNumber: null, photoURL: null,
    }],
  } as User
  mocks.auth.currentUser = user
  mocks.credential.mockReturnValue({ providerId: 'password', signInMethod: 'password' })
})

describe('password setup for an existing Google account', () => {
  it('only offers setup to Google accounts without a password provider', () => {
    expect(render()).not.toBeNull()
    user = { ...user, providerData: [{ ...user.providerData[0], providerId: 'password' }] }
    expect(render()).toBeNull()
    user = { ...user, providerData: [] }
    expect(render()).toBeNull()
  })

  it('rejects mismatched confirmation without opening Google verification', async () => {
    fill()
    input('confirmPassword', 'different password')
    await submit()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toBe('Passwords do not match.')
    expect(mocks.reauthenticate).not.toHaveBeenCalled()
    expect(mocks.link).not.toHaveBeenCalled()
  })

  it('verifies Google before linking to the same UID and prevents duplicate submissions', async () => {
    fill()
    let finishVerification!: () => void
    mocks.reauthenticate.mockImplementationOnce(() => new Promise<void>(resolve => { finishVerification = resolve }))
    mocks.link.mockImplementationOnce(async () => {
      user.providerData.push({ ...user.providerData[0], providerId: 'password' })
    })
    const first = submit()
    const second = submit()
    expect(mocks.reauthenticate).toHaveBeenCalledOnce()
    expect(mocks.reauthenticate.mock.calls[0][0]).toBe(user)
    expect(mocks.link).not.toHaveBeenCalled()
    finishVerification()
    await Promise.all([first, second])
    expect(mocks.credential).toHaveBeenCalledWith('manager@example.com', ' a strong password 123! ')
    expect(mocks.link).toHaveBeenCalledOnce()
    expect(mocks.link).toHaveBeenCalledWith(user, mocks.credential.mock.results[0].value)
    expect(user.uid).toBe('existing-manager')
    expect(find(render(), element => element.props.role === 'status')).toBeDefined()
    expect(find(render(), element => element.type === 'form')).toBeUndefined()
  })

  it('does not link if Google verification is canceled and preserves input for retry', async () => {
    fill()
    mocks.reauthenticate.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' })
    await submit()
    expect(mocks.link).not.toHaveBeenCalled()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toContain('canceled')
    expect(find(render(), element => element.props.name === 'newPassword')?.props.value).toBe(' a strong password 123! ')
    expect(find(render(), element => element.props.role === 'status')).toBeUndefined()
  })

  it('does not link if the signed-in user changes during verification', async () => {
    fill()
    mocks.reauthenticate.mockImplementationOnce(async () => { mocks.auth.currentUser = null })
    await submit()
    expect(mocks.link).not.toHaveBeenCalled()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toContain('session has changed')
  })

  it('does not open verification for a stale user session', async () => {
    fill()
    mocks.auth.currentUser = null
    await submit()
    expect(mocks.reauthenticate).not.toHaveBeenCalled()
    expect(mocks.link).not.toHaveBeenCalled()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toContain('session has changed')
  })

  it.each([
    ['auth/weak-password', 'stronger password'],
    ['auth/credential-already-in-use', 'No accounts have been merged'],
  ])('surfaces %s without claiming successful setup', async (code, message) => {
    fill()
    mocks.link.mockRejectedValueOnce({ code })
    await submit()
    expect(find(render(), element => element.props.role === 'alert')?.props.children).toContain(message)
    expect(find(render(), element => element.props.role === 'status')).toBeUndefined()
  })
})
