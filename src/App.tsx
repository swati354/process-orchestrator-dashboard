import { AuthProvider, useAuth } from '@/hooks/useAuth';

/**
 * Reference UiPath PKCE OAuth gate. Not rendered by App() while the scaffold
 * is showing the "Generating your app" placeholder. When the real app entry
 * point is written, wrap authenticated views in <AuthProvider> and gate UI
 * with a component like this. The PKCE flow itself lives in
 * src/hooks/useAuth.tsx — do not reimplement it.
 */
function SignInGate() {
  const { isAuthenticated, isLoading, login, error } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={login}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in with UiPath
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">UiPath Coded Web App</h1>
      <p className="mt-2 text-sm text-gray-600">
        Replace this placeholder with your application UI.
      </p>
    </main>
  );
}

// Reference wiring: when replacing App() with the real entry point, the
// typical pattern is:
//
//   export function App() {
//     return (
//       <AuthProvider>
//         <SignInGate />
//       </AuthProvider>
//     );
//   }
//
// The AuthProvider import above is retained so this reference compiles
// against the scaffold even before App() is rewritten.
void AuthProvider;
void SignInGate;

export function App() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,140,66,0.18),transparent_60%)]"
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-orange-300/40" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30" />
          <svg
            className="relative h-10 w-10 animate-spin text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Generating your app
          </h1>
          <p className="max-w-md text-base text-slate-600">
            Nucleus is still building this. What you see now is the scaffold —
            this screen will update automatically as your real app comes online.
          </p>
        </div>

        <div className="flex items-center gap-2" aria-label="Working">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
