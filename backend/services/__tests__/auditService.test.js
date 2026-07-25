jest.mock('axios');

jest.mock('../../utils/validateUrl', () => ({
  assertUrlIsSafe: jest.fn((url) => {
    if (url === 'not-a-url' || !url.startsWith('http')) {
      const err = new Error('Invalid URL');
      err.code = 'INVALID_URL';
      return Promise.reject(err);
    }
    return Promise.resolve();
  })
}));

const axios = require('axios');
const { fetchAndAuditUrl } = require('../auditService');

describe('fetchAndAuditUrl', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('happy path: parses a valid HTML page correctly', async () => {
    const fakeHtml = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="A test description" />
          <link rel="canonical" href="https://example.com/" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <h1>Hello</h1>
          <h1>World</h1>
          <img src="a.jpg" alt="described" />
          <img src="b.jpg" />
          <p>Some sample body text for word counting purposes here.</p>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: fakeHtml,
      request: { res: { responseUrl: 'https://example.com/' } }
    });

    const report = await fetchAndAuditUrl('https://example.com');

    expect(report.httpStatus).toBe(200);
    expect(report.title).toBe('Test Page');
    expect(report.metaDescription).toBe('A test description');
    expect(report.h1Count).toBe(2);
    expect(report.totalImages).toBe(2);
    expect(report.imagesMissingAlt).toBe(1);
    expect(report.canonicalUrl).toBe('https://example.com/');
    expect(report.hasViewportMeta).toBe(true);
    expect(report.wordCount).toBeGreaterThan(0);
  });

  test('failure case: rejects an invalid URL before making any request', async () => {
    await expect(fetchAndAuditUrl('not-a-url')).rejects.toMatchObject({
      code: 'INVALID_URL'
    });

    // Should fail validation before ever calling axios.
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('failure case: classifies a request timeout correctly', async () => {
    axios.get.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout of 8000ms exceeded' });

    await expect(fetchAndAuditUrl('https://slow-site.example.com')).rejects.toMatchObject({
      code: 'TIMEOUT'
    });
  });
});