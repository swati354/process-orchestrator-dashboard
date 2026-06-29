import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProcessesList } from '@/components/ProcessesList';
import { PdfViewer } from '@/components/PdfViewer';

type Tab = 'processes' | 'pdf';

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('processes');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'processes', label: 'Processes' },
    { id: 'pdf', label: 'PDF Viewer' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Tab bar */}
      <nav className="border-b border-gray-200 bg-white px-6">
        <div className="mx-auto max-w-7xl flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'processes' && <ProcessesList />}
        {activeTab === 'pdf' && <PdfViewer />}
      </div>
    </div>
  );
}

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

  return <AppShell />;
}

export function App() {
  return (
    <AuthProvider>
      <SignInGate />
    </AuthProvider>
  );
}