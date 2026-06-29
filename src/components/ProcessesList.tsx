import { useMemo, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Processes } from '@uipath/uipath-typescript/processes';
import type { ProcessGetResponse } from '@uipath/uipath-typescript/processes';
import type { PaginatedResponse } from '@uipath/uipath-typescript/core';

const PAGE_SIZE = 25;

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

export function ProcessesList() {
  const { sdk } = useAuth();
  const processes = useMemo(() => new Processes(sdk), [sdk]);

  const [items, setItems] = useState<ProcessGetResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const options: Record<string, unknown> = {
          pageSize: PAGE_SIZE,
          jumpToPage: page,
          orderby: 'name asc',
        };
        if (debouncedSearch.trim()) {
          options.filter = `contains(tolower(name), '${debouncedSearch.trim().toLowerCase().replace(/'/g, "''")}')`;
        }
        const result = (await processes.getAll(options as Parameters<typeof processes.getAll>[0])) as PaginatedResponse<ProcessGetResponse>;
        setItems(result.items ?? []);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load processes');
      } finally {
        setLoading(false);
      }
    },
    [processes, debouncedSearch]
  );

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(start + items.length - 1, totalCount ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orchestrator Processes</h1>
            {totalCount !== undefined && (
              <p className="mt-0.5 text-sm text-gray-500">{totalCount.toLocaleString()} process{totalCount !== 1 ? 'es' : ''} total</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => fetchPage(currentPage)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
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
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : !loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    {debouncedSearch ? 'No processes match your search.' : 'No processes found.'}
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.key ?? p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
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
        {(totalPages !== undefined && totalPages > 1) && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {items.length > 0 ? `Showing ${start}–${end} of ${totalCount?.toLocaleString()}` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <span className="px-3 py-1 text-gray-700 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}