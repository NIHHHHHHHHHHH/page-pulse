const axios = require('axios');
const cheerio = require('cheerio');

const REQUEST_TIMEOUT_MS = 8000;

async function fetchAndAuditUrl(targetUrl) {
  const startTime = Date.now();

  const response = await axios.get(targetUrl, {
    timeout: REQUEST_TIMEOUT_MS,
    responseType: 'text',
    // We want to inspect the response ourselves, even for 4xx/5xx,
    // instead of axios throwing on non-2xx.
    validateStatus: () => true,
    headers: {
      'User-Agent': 'PagePulse-Auditor/1.0'
    }
  });

  const responseTimeMs = Date.now() - startTime;
  const contentType = response.headers['content-type'] || '';

  const report = {
    url: targetUrl,
    httpStatus: response.status,
    responseTimeMs,
    contentType
  };

  // Only attempt HTML parsing if it's actually HTML.
  if (contentType.includes('text/html')) {
    const $ = cheerio.load(response.data);

    const title = $('title').first().text().trim() || null;

    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || null;

    const h1Count = $('h1').length;

    const totalImages = $('img').length;
    const imagesMissingAlt = $('img').filter((i, el) => {
      const alt = $(el).attr('alt');
      return alt === undefined || alt.trim() === '';
    }).length;

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.length > 0 ? bodyText.split(' ').length : 0;

    Object.assign(report, {
      title,
      metaDescription,
      h1Count,
      totalImages,
      imagesMissingAlt,
      wordCount
    });
  }

  return report;
}

module.exports = { fetchAndAuditUrl };