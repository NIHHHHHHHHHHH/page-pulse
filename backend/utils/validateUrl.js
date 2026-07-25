const dns = require('dns').promises;
const net = require('net');

// Private/reserved ranges we refuse to fetch - this is the SSRF guard.
// Without this, someone could point the tool at http://localhost:5000/health
// or http://169.254.169.254/ (cloud metadata endpoint) and use your server
// as a proxy into infrastructure it shouldn't be able to reach.
function isPrivateIp(ip) {
  if (net.isIP(ip) === 0) return false;

  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
  }
  // crude IPv6 loopback/local check
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fe80')) return true;

  return false;
}

function isSyntacticallyValidUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function assertUrlIsSafe(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw makeError('INVALID_URL', 'URL is required and must be a string.');
  }

  if (!isSyntacticallyValidUrl(rawUrl)) {
    throw makeError('INVALID_URL', 'URL must be a valid http:// or https:// address.');
  }

  const hostname = new URL(rawUrl).hostname;

  if (hostname === 'localhost') {
    throw makeError('BLOCKED_HOST', 'Requests to localhost are not allowed.');
  }

  let resolvedIps;
  try {
    // resolve() covers most cases, resolve4 as a fallback for hosts it chokes on
    resolvedIps = await dns.resolve(hostname).catch(() => dns.resolve4(hostname));
  } catch {
    throw makeError('DNS_FAILURE', `Could not resolve hostname: ${hostname}`);
  }

  const blocked = resolvedIps.some(isPrivateIp);
  if (blocked) {
    throw makeError('BLOCKED_HOST', 'This host resolves to a private or reserved IP address.');
  }
}

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

module.exports = { assertUrlIsSafe };