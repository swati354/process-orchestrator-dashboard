import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type PdfSource = { type: 'file'; file: File } | { type: 'url'; url: string } | null;

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

export function PdfViewer() {
  const [source, setSource] = useState<PdfSource>(null);
  const [urlInput, setUrlInput] = useState('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDocument = () => {
    setNumPages(null);
    setPageNumber(1);
    setPageInputValue('1');
    setLoadError(null);
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetDocument();
    setSource({ type: 'file', file });
  }, []);

  const handleUrlLoad = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    resetDocument();
    setSource({ type: 'url', url: trimmed });
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPageInputValue('1');
    setLoadError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    setLoadError(err.message || 'Failed to load PDF');
  };

  const goTo = (n: number) => {
    if (!numPages) return;
    const clamped = Math.max(1, Math.min(numPages, n));
    setPageNumber(clamped);
    setPageInputValue(String(clamped));
  };

  const handlePageInputBlur = () => {
    const n = parseInt(pageInputValue, 10);
    if (!isNaN(n)) goTo(n);
    else setPageInputValue(String(pageNumber));
  };

  const pdfFile =
    source?.type === 'file'
      ? source.file
      : source?.type === 'url'
      ? source.url
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-3">
          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            Open file…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* URL input */}
          <div className="flex items-center gap-1">
            <input
              type="url"
              placeholder="Or enter PDF URL…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
              className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleUrlLoad}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 font-medium"
            >
              Load
            </button>
          </div>

          {pdfFile && numPages !== null && (
            <>
              <div className="h-5 w-px bg-gray-300" />

              {/* Page navigation */}
              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => goTo(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                >
                  ‹
                </button>
                <span className="text-gray-500">Page</span>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={handlePageInputBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageInputBlur()}
                  className="w-12 rounded border border-gray-300 px-1.5 py-0.5 text-center text-sm focus:border-blue-500 focus:outline-none"
                />
                <span className="text-gray-500">of {numPages}</span>
                <button
                  type="button"
                  onClick={() => goTo(pageNumber + 1)}
                  disabled={pageNumber >= numPages}
                  className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                >
                  ›
                </button>
              </div>

              <div className="h-5 w-px bg-gray-300" />

              {/* Zoom controls */}
              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))}
                  disabled={scale <= MIN_SCALE}
                  className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold"
                >
                  −
                </button>
                <span className="w-12 text-center text-gray-600 font-mono">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))}
                  disabled={scale >= MAX_SCALE}
                  className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setScale(1.0)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>

              {source?.type === 'file' && (
                <>
                  <div className="h-5 w-px bg-gray-300" />
                  <span className="max-w-xs truncate text-sm text-gray-500" title={(source as { type: 'file'; file: File }).file.name}>
                    {(source as { type: 'file'; file: File }).file.name}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Viewer area */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {!pdfFile ? (
          <div
            className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-white py-20 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file?.type === 'application/pdf') {
                resetDocument();
                setSource({ type: 'file', file });
              }
            }}
          >
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Drop a PDF here or click to open</p>
              <p className="mt-1 text-xs text-gray-400">Or enter a URL in the toolbar above</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <div className="mx-auto w-fit">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                  Loading PDF…
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
                loading={
                  <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                    Rendering page…
                  </div>
                }
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}