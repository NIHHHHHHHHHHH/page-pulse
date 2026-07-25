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
      setError('Could not reach the audit service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='m-10'>
      <h1 className='mb-10 text-5xl'>Page Pulse</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
        <button className='ml-5 mb-5' type="submit" disabled={loading}>
          {loading ? 'Auditing...' : 'Audit URL'}
        </button>
      </form>

      {error && <p>Error: {error}</p>}

      {report && (
        <div>
          <p>URL: {report.url}</p>
          <p>Status: {report.httpStatus}</p>
          <p>Response time: {report.responseTimeMs}ms</p>
          <p>Title: {report.title}</p>
          <p>Meta description: {report.metaDescription}</p>
          <p>H1 count: {report.h1Count}</p>
          <p>Images missing alt: {report.imagesMissingAlt} / {report.totalImages}</p>
          <p>Word count: {report.wordCount}</p>
          {report.warning && <p>Note: {report.warning}</p>}
        </div>
      )}
    </main>
  );
}