import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';

const mocks = vi.hoisted(() => ({
  values: [] as unknown[],
  index: 0,
  create: vi.fn(),
  signIn: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = mocks.index++;
      if (!(index in mocks.values)) mocks.values[index] = initial;
      return [mocks.values[index], (value: unknown) => { mocks.values[index] = value; }];
    },
  };
});
vi.mock('react-native', () => ({
  KeyboardAvoidingView: 'div', Platform: { OS: 'ios' }, Pressable: 'button',
  ScrollView: 'div', Text: 'span', TextInput: 'input', View: 'div',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'div' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'div' }));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mocks.create,
  signInWithEmailAndPassword: mocks.signIn,
  sendPasswordResetEmail: mocks.reset,
}));
vi.mock('../lib/firebase', () => ({ getFirebaseAuth: () => 'auth' }));
vi.mock('../components/ui', () => ({ Button: 'Button', Icon: 'Icon' }));
vi.mock('../theme', () => ({ colors: {}, styles: {} }));

type Props = { children?: ReactNode; [key: string]: unknown };

function find(node: ReactNode, predicate: (element: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return undefined;
  }
  if (!isValidElement<Props>(node)) return undefined;
  if (predicate(node)) return node;
  return find(node.props.children, predicate);
}

function render() {
  mocks.index = 0;
  return LoginScreen();
}

function press(tree: ReactNode, title: string) {
  const button = find(tree, element => element.props.title === title);
  expect(button).toBeDefined();
  (button!.props.onPress as () => void)();
}

function setInput(tree: ReactNode, label: string, value: string) {
  const input = find(tree, element => element.props.accessibilityLabel === label);
  expect(input).toBeDefined();
  (input!.props.onChangeText as (text: string) => void)(value);
}

beforeEach(() => {
  mocks.values = [];
  mocks.index = 0;
  vi.clearAllMocks();
});

describe('email registration', () => {
  it('creates an account with the trimmed email', async () => {
    press(render(), 'New to FM Tracker? Create an account');
    const tree = render();
    setInput(tree, 'Email', ' manager@example.com ');
    setInput(tree, 'Password', 'password123');
    setInput(tree, 'Confirm password', 'password123');
    press(render(), 'Create account');
    await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123'));
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords and reports Firebase errors', async () => {
    press(render(), 'New to FM Tracker? Create an account');
    let tree = render();
    setInput(tree, 'Email', 'manager@example.com');
    setInput(tree, 'Password', 'password123');
    setInput(tree, 'Confirm password', 'different');
    press(render(), 'Create account');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(find(render(), element => element.props.accessibilityRole === 'alert')?.props.children).toBe('Passwords do not match.');

    tree = render();
    setInput(tree, 'Confirm password', 'password123');
    mocks.create.mockRejectedValueOnce({ code: 'auth/weak-password' });
    press(render(), 'Create account');
    await vi.waitFor(() => expect(find(render(), element => element.props.accessibilityRole === 'alert')?.props.children).toContain('too weak'));
  });

  it('retains sign-in and password reset', async () => {
    const tree = render();
    setInput(tree, 'Email', 'manager@example.com');
    setInput(tree, 'Password', 'password123');
    press(render(), 'Sign in');
    await vi.waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123'));
    await vi.waitFor(() => expect(find(render(), element => element.props.title === 'Forgot password?')?.props.disabled).toBe(false));
    press(render(), 'Forgot password?');
    await vi.waitFor(() => expect(mocks.reset).toHaveBeenCalledWith('auth', 'manager@example.com'));
  });

  it('clears registration errors when switching back to sign in', async () => {
    press(render(), 'New to FM Tracker? Create an account');
    const tree = render();
    setInput(tree, 'Email', 'manager@example.com');
    setInput(tree, 'Password', 'password123');
    setInput(tree, 'Confirm password', 'different');
    press(render(), 'Create account');
    press(render(), 'Already have an account? Sign in');
    expect(find(render(), element => element.props.accessibilityRole === 'alert')).toBeUndefined();
    expect(find(render(), element => element.props.accessibilityLabel === 'Confirm password')).toBeUndefined();
    press(render(), 'Sign in');
    await vi.waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('auth', 'manager@example.com', 'password123'));
  });
});
