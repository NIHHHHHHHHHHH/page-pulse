const axios = require('axios');
const cheerio = require('cheerio');
const { assertUrlIsSafe } = require('../utils/validateUrl');

const REQUEST_TIMEOUT_MS = 8000;  // most sites respond well under this, don't want the audit hanging

async function fetchAndAuditUrl(targetUrl) {
  await assertUrlIsSafe(targetUrl); // throws INVALID_URL / BLOCKED_HOST / DNS_FAILURE

  const startTime = Date.now();
  let response;

  try {
    response = await axios.get(targetUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      responseType: 'text',
      validateStatus: () => true,
      maxRedirects: 5,
      headers: { 'User-Agent': 'PagePulse-Auditor/1.0' }
    });
  } catch (err) {
     // axios uses these codes specifically; anything else we treat as a generic fetch failure
    if (err.code === 'ECONNABORTED') {
      throw makeError('TIMEOUT', `Request timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    if (err.code === 'ENOTFOUND') {
      throw makeError('DNS_FAILURE', `Could not resolve host for ${targetUrl}.`);
    }
    throw makeError('FETCH_FAILED', `Failed to fetch URL: ${err.message}`);
  }

  const responseTimeMs = Date.now() - startTime;
  const contentType = response.headers['content-type'] || '';

  const report = {
    url: targetUrl,
    httpStatus: response.status,
    responseTimeMs,
    contentType
  };

  if (!contentType.includes('text/html')) {
    return { ...report, warning: 'Response is not HTML - skipped content parsing.' };
  }

  const $ = cheerio.load(response.data);

  const title = $('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const h1Count = $('h1').length;
  const totalImages = $('img').length;
  const imagesMissingAlt = $('img').filter((i, el) => {
    const alt = $(el).attr('alt');
    return alt === undefined || alt.trim() === '';
  }).length;

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.length > 0 ? bodyText.split(' ').length : 0;

  return {
    ...report,
    title,
    metaDescription,
    h1Count,
    totalImages,
    imagesMissingAlt,
    wordCount
  };
}

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

module.exports = { fetchAndAuditUrl };