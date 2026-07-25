'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setReport(data);
      }
    } catch (err) {
      setError('Could not reach the audit service. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Page Pulse</h1>
        <p className="text-slate-500 mb-8">Paste a URL, get an instant page audit.</p>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition">
            {loading ? 'Auditing...' : 'Audit'}
          </button>
        </form>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse">
            <div className="h-4 w-1/2 bg-slate-200 rounded mb-3" />
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-3" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && !loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 truncate">{report.url}</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  report.httpStatus >= 200 && report.httpStatus < 300
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {report.httpStatus}
              </span>
            </div>

            {report.warning ? (
              <p className="text-sm text-slate-500">{report.warning}</p>
            ) : (
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <Row label="Response time" value={`${report.responseTimeMs} ms`} />
                <Row label="Title" value={report.title || '—'} />
                <Row label="Meta description" value={report.metaDescription || '—'} />
                <Row label="H1 count" value={report.h1Count} />
                <Row label="Word count" value={report.wordCount} />
                <Row label="Images missing alt" value={`${report.imagesMissingAlt} / ${report.totalImages}`} />
                <Row label="Canonical URL" value={report.canonicalUrl || 'Not set'} />
                <Row label="Mobile viewport tag" value={report.hasViewportMeta ? 'Present' : 'Missing'} />
                <Row label="Open Graph tags" value={report.ogTagsPresent ? 'Present' : 'Missing'} />
                {report.redirectCount > 0 && (
                  <Row label="Redirects followed" value={report.redirectCount} />
                )}
              </dl>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-6">
        Built for{' '}
        <a href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-600"
        >
          Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 text-right truncate">{value}</dd>
    </>
  );
}