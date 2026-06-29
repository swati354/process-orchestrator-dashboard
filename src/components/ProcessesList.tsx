import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { Processes } from '@uipath/uipath-typescript/processes';
import type { ProcessGetResponse } from '@uipath/uipath-typescript/processes';
import type { PaginatedResponse } from '@uipath/uipath-typescript/core';

const PAGE_SIZE = 25;

const INTERVAL_OPTIONS = [
  { label: '10 s', value: 10_000 },
  { label: '30 s', value: 30_000 },
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
];

function badge(label: string, color: string) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function PackageTypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;
  const map: Record<string, string> = {
    Process: 'bg-blue-100 text-blue-700',
    ProcessOrchestration: 'bg-purple-100 text-purple-700',
    WebApp: 'bg-teal-100 text-teal-700',
    Agent: 'bg-orange-100 text-orange-700',
    TestAutomationProcess: 'bg-yellow-100 text-yellow-700',
    Api: 'bg-indigo-100 text-indigo-700',
    MCPServer: 'bg-pink-100 text-pink-700',
    BusinessRules: 'bg-green-100 text-green-700',
    CaseManagement: 'bg-rose-100 text-rose-700',
  };
  return badge(type, map[type] ?? 'bg-gray-100 text-gray-700');
}

function FrameworkBadge({ fw }: { fw: string | undefined }) {
  if (!fw) return null;
  const map: Record<string, string> = {
    Windows: 'bg-sky-100 text-sky-700',
    Portable: 'bg-emerald-100 text-emerald-700',
    Legacy: 'bg-gray-100 text-gray-500',
  };
  return badge(fw, map[fw] ?? 'bg-gray-100 text-gray-600');
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface PageData {
  items: ProcessGetResponse[];
  totalCount: number | undefined;
  totalPages: number | undefined;
}

export function ProcessesList() {
  const { sdk, isAuthenticated } = useAuth();
  const processes = useMemo(() => new Processes(sdk), [sdk]);

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [interval, setInterval_] = useState(30_000);

  // Debounce search — reset to page 1 on change
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(async (): Promise<PageData> => {
    const options: Record<string, unknown> = {
      pageSize: PAGE_SIZE,
      jumpToPage: currentPage,
      orderby: 'name asc',
    };
    if (debouncedSearch.trim()) {
      options.filter = `contains(tolower(name), '${debouncedSearch.trim().toLowerCase().replace(/'/g, "''")}')`;
    }
    const result = (await processes.getAll(
      options as Parameters<typeof processes.getAll>[0]
    )) as PaginatedResponse<ProcessGetResponse>;
    return {
      items: result.items ?? [],
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }, [processes, currentPage, debouncedSearch]);

  const { data, isLoading, error, refetch, start, stop, isActive, lastUpdated } =
    usePolling<PageData>({
      fetchFn: fetchPage,
      interval,
      enabled: isAuthenticated,
      immediate: true,
      deps: [currentPage, debouncedSearch],
    });

  // Flicker prevention — never tear down the table during a poll cycle
  const lastDataRef = useRef<PageData | null>(null);
  const lastDepKeyRef = useRef(`${currentPage}|${debouncedSearch}`);
  const depKey = `${currentPage}|${debouncedSearch}`;
  if (depKey !== lastDepKeyRef.current) {
    lastDepKeyRef.current = depKey;
    lastDataRef.current = null;
  }
  if (data) lastDataRef.current = data;
  const display = lastDataRef.current;

  const items = display?.items ?? [];
  const totalCount = display?.totalCount;
  const totalPages = display?.totalPages;

  const start_ = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(start_ + items.length - 1, totalCount ?? 0);

  return (
    <div className="flex flex-col bg-gray-50" style={{ minHeight: 'calc(100vh - 49px)' }}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orchestrator Processes</h1>
            {totalCount !== undefined && (
              <p className="mt-0.5 text-sm text-gray-500">
                {totalCount.toLocaleString()} process{totalCount !== 1 ? 'es' : ''} total
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Interval selector */}
            <select
              value={interval}
              onChange={(e) => setInterval_(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"
              title="Poll interval"
            >
              {INTERVAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Pause / Resume */}
            <button
              type="button"
              onClick={isActive ? stop : start}
              title={isActive ? 'Pause polling' : 'Resume polling'}
              className={[
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {isActive ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Pause
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  Resume
                </>
              )}
            </button>

            {/* Manual refresh */}
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              title="Refresh now"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="mx-auto max-w-7xl mt-1.5 flex items-center gap-1.5">
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300',
              ].join(' ')}
            />
            <span className="text-xs text-gray-400">
              {isActive ? 'Live' : 'Paused'} · Last updated {formatTime(lastUpdated)}
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-0 table-fixed text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-64 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Version</th>
                <th className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Folder</th>
                <th className="w-44 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Package Type</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Framework</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Auto Update</th>
                <th className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && !display ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    {debouncedSearch ? 'No processes match your search.' : 'No processes found.'}
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.key ?? p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="truncate font-medium text-gray-900" title={p.name}>{p.name}</span>
                        {p.description && (
                          <span className="truncate text-xs text-gray-400" title={p.description}>{p.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 truncate block" title={p.packageVersion}>
                        {p.packageVersion ?? '—'}
                        {p.isLatestVersion && (
                          <span className="ml-1 text-green-600" title="Latest version">✓</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="truncate block text-gray-700" title={p.folderName}>{p.folderName ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PackageTypeBadge type={p.packageType as string | undefined} />
                    </td>
                    <td className="px-4 py-3">
                      <FrameworkBadge fw={p.targetFramework as string | undefined} />
                    </td>
                    <td className="px-4 py-3">
                      {p.autoUpdate ? (
                        <span className="text-green-600 text-xs font-medium">On</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.lastModifiedTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages !== undefined && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {items.length > 0 ? `Showing ${start_}–${end} of ${totalCount?.toLocaleString()}` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >«</button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >‹</button>
              <span className="px-3 py-1 text-gray-700 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >›</button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >»</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}