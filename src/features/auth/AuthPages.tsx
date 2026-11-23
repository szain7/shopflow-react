import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from 'react-router'
import { ApiRequestError } from '../../api/client'
import { loginBodySchema } from '../../api/schemas'
import { sessionActions } from '../../app/store'
import { useShopSelector, useShopStore } from '../../app/store-hooks'
import {
  focusMain,
  inputClass,
  primaryClass,
} from '../../components/ui/commerce'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { demoCredentials } from '../../mocks/demo-credentials'
import { BrowseMessage, RetryMessage } from '../browse/BrowseMessage'
import { browseError } from '../browse/browse-queries'
import { safeReturnPath } from './return-path'

export function RequireSession() {
  const session = useShopSelector((state) => state.session)
  const { pathname, search, hash } = useLocation()
  if (session) return <Outlet />
  const params = new URLSearchParams({ returnTo: pathname + search + hash })
  return <Navigate to={`/login?${params}`} replace />
}

type Field = 'email' | 'password'
type FieldErrors = Partial<Record<Field, string>>
const invalidMessages = {
  email: 'Enter a valid email address.',
  password: 'Enter your password.',
}

export function LoginPage({
  showDemoCredentials,
}: {
  showDemoCredentials: boolean
}) {
  useDocumentTitle('Sign in | Shopflow')
  const store = useShopStore()
  const signedIn = useShopSelector((state) => Boolean(state.session))
  const [search] = useSearchParams()
  const destination = safeReturnPath(search.get('returnTo'))
  const [fields, setFields] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const active = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => () => active.current?.abort(), [])
  if (signedIn) return <Navigate to={destination} replace />

  function showFields(errors: FieldErrors) {
    setFields(errors)
    formRef.current
      ?.querySelector<HTMLInputElement>(
        errors.email ? '#login-email' : '#login-password',
      )
      ?.focus()
  }

  async function submit(form: HTMLFormElement) {
    if (active.current) return
    const data = new FormData(form)
    const email = data.get('email')
    const password = data.get('password')
    const credentials = loginBodySchema.safeParse({
      email: typeof email === 'string' ? email.trim() : email,
      password,
    })
    setMessage('')
    setFields({})
    if (!credentials.success) {
      const errors: FieldErrors = {}
      for (const { path } of credentials.error.issues) {
        if (path[0] === 'email' || path[0] === 'password')
          errors[path[0]] = invalidMessages[path[0]]
      }
      showFields(errors)
      return
    }
    const controller = new AbortController()
    active.current = controller
    setPending(true)
    try {
      const { token, user } = await store.api.login(credentials.data, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted)
        store.dispatch(sessionActions.signedIn({ token, userId: user.id }))
    } catch (error) {
      if (!controller.signal.aborted) {
        if (error instanceof ApiRequestError && error.failure.kind === 'http') {
          const { status, fields } = error.failure
          if (status === 400 && (fields?.email || fields?.password)) {
            showFields({
              email: fields.email ? invalidMessages.email : undefined,
              password: fields.password
                ? 'Check your password and try again.'
                : undefined,
            })
          } else {
            setMessage(
              status === 401
                ? 'Email or password is incorrect.'
                : error.message,
            )
            focusMain()
          }
        } else {
          setMessage(
            error instanceof Error
              ? browseError(error)
              : 'Sign-in failed. Try again.',
          )
          focusMain()
        }
      }
    } finally {
      active.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-5 text-3xl font-bold">Sign in</h1>
      <form
        ref={formRef}
        noValidate
        className="grid gap-4 rounded-xl border border-line bg-panel p-5 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(event.currentTarget)
        }}
      >
        <div className="grid gap-1">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
            aria-invalid={Boolean(fields.email)}
            aria-describedby={fields.email ? 'email-error' : undefined}
          />
          {fields.email && (
            <p id="email-error" role="alert" className="text-status-error">
              {fields.email}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            aria-invalid={Boolean(fields.password)}
            aria-describedby={fields.password ? 'password-error' : undefined}
          />
          {fields.password && (
            <p id="password-error" role="alert" className="text-status-error">
              {fields.password}
            </p>
          )}
        </div>
        {message && (
          <p role="alert" className="text-status-error">
            {message}
          </p>
        )}
        <button type="submit" className={primaryClass} disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
        {(import.meta.env.DEV || import.meta.env.VITE_PUBLIC_DEMO === 'true') &&
          showDemoCredentials && (
            <div className="grid gap-1 border-t border-line pt-4 text-sm text-muted">
              <p className="font-semibold text-ink">Demo Credentials</p>
              <p className="wrap-break-word">
                Email: <code>{demoCredentials.email}</code>
              </p>
              <p>
                Password: <code>{demoCredentials.password}</code>
              </p>
            </div>
          )}
      </form>
    </section>
  )
}

export function AccountPage() {
  useDocumentTitle('Account | Shopflow')
  const store = useShopStore()
  const scope = useShopSelector((state) => state.session?.cacheScope)
  const query = useQuery({
    queryKey: ['private', scope, 'account'],
    queryFn: ({ signal }) => store.api.getMe({ signal }),
    enabled: Boolean(scope),
    staleTime: 0,
    retry: false,
  })
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Account</h1>
      {query.isPending && <BrowseMessage>Loading account…</BrowseMessage>}
      {query.isError && (
        <RetryMessage
          message={browseError(query.error)}
          retrying={query.isFetching}
          onRetry={() => {
            void query.refetch()
          }}
        />
      )}
      {query.isSuccess && (
        <div className="rounded-xl border border-line bg-panel p-5">
          <p className="font-semibold">{query.data.name}</p>
          <p className="break-all text-muted">{query.data.email}</p>
        </div>
      )}
    </section>
  )
}

export function SessionLinks() {
  const store = useShopStore()
  const signedIn = useShopSelector((state) => Boolean(state.session))
  const linkClass =
    'rounded-sm px-1 py-2 font-semibold text-brand focus-visible:outline-2 focus-visible:outline-brand'
  return signedIn ? (
    <>
      <Link className={linkClass} to="/account">
        Account
      </Link>
      <button
        className={linkClass}
        type="button"
        onClick={() => {
          store.dispatch(sessionActions.signedOut())
          focusMain()
        }}
      >
        Sign out
      </button>
    </>
  ) : (
    <Link className={linkClass} to="/login">
      Sign in
    </Link>
  )
}
