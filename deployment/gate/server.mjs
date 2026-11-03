import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat, realpath } from 'node:fs/promises';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { isIP } from 'node:net';

const derive = promisify(scrypt);
const root = import.meta.dirname;
const port = Number(process.env.PMSG_PORT || 18770);
const origin = process.env.PMSG_ORIGIN;
if (!origin || new URL(origin).origin !== origin) throw new Error('PMSG_ORIGIN must be an origin.');
const publicHost = new URL(origin).host;
const secure = new URL(origin).protocol === 'https:';
if (!secure && !['127.0.0.1','localhost'].includes(new URL(origin).hostname)) throw new Error('HTTPS required.');
const siteRoot = await realpath(process.env.PMSG_SITE_ROOT || path.join(root, 'site'));
const secretFile = process.env.PMSG_SECRET_FILE;
if (!secretFile) throw new Error('PMSG_SECRET_FILE is required.');
const config = JSON.parse(await readFile(secretFile, 'utf8'));
const expected = Buffer.from(config.hash, 'hex');
const salt = Buffer.from(config.salt, 'hex');
if (expected.length !== 32 || salt.length < 16) throw new Error('Invalid server authentication configuration.');
const publicFiles = new Map([
  ['/_entry/entry.css', path.join(root, 'public/entry.css')],
  ['/_entry/entry.js', path.join(root, 'public/entry.js')],
  ['/_entry/eye-cloud.js', path.join(root, 'public/eye-cloud.js')],
  ['/_entry/eye-sculpture-v2.png', path.join(root, 'public/eye-sculpture-v2.png')]
]);
const sessions = new Map();
const attempts = new Map();
const sessionLifetime = 8 * 60 * 60 * 1000;
let inFlight = 0;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2', '.mp4':'video/mp4', '.ico':'image/x-icon' };
const gatePolicy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'none'";

function json(res, code, value, headers = {}) {
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(value));
}
function sessionFor(req) {
  const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('pmsg_gate_session='))?.slice(18);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const expires = sessions.get(token);
  if (!expires || expires < Date.now()) { sessions.delete(token); return null; }
  return token;
}
async function serve(req, res, file) {
  let info;
  try { info = await stat(file); } catch { return json(res, 404, { ok:false }); }
  if (!info.isFile()) return json(res, 404, { ok:false });
  const headers = { 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes' };
  let start = 0, end = info.size - 1, status = 200;
  if (req.headers.range) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!range || (!range[1] && !range[2])) return json(res, 416, { ok:false }, { 'Content-Range':`bytes */${info.size}` });
    start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
    end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return json(res, 416, { ok:false }, { 'Content-Range':`bytes */${info.size}` });
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') res.end();
  else createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
}
async function bodyFor(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024) throw new Error('body_limit');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function unlock(req, res) {
  if (req.headers.origin !== origin || req.headers['content-type']?.split(';')[0] !== 'application/json') return json(res, 403, { ok:false });
  const forwarded = req.headers['cf-connecting-ip'];
  const ip = typeof forwarded === 'string' && isIP(forwarded) ? forwarded : req.socket.remoteAddress;
  const now = Date.now();
  if (attempts.size > 10000) {
    for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    if (attempts.size > 10000) return json(res, 429, { ok:false }, { 'Retry-After':'60' });
  }
  let record = attempts.get(ip);
  if (!record || record.until < now) { record = { count:0, until:now + 60000 }; attempts.set(ip, record); }
  if (record.count >= 12 || inFlight >= 2) return json(res, 429, { ok:false }, { 'Retry-After':'60' });
  let input;
  try { input = await bodyFor(req); } catch { return json(res, 400, { ok:false }); }
  if (typeof input.passphrase !== 'string') return json(res, 400, { ok:false });
  const passphrase = input.passphrase.normalize('NFC').trim();
  if (!passphrase || passphrase.length > 128) return json(res, 400, { ok:false });
  record.count++;
  inFlight++;
  let match = false;
  try {
    const value = await derive(passphrase, salt, expected.length, config.parameters);
    match = timingSafeEqual(value, expected);
  } finally { inFlight--; }
  if (!match) return json(res, 401, { ok:false });
  attempts.delete(ip);
  for (const [token, expires] of sessions) if (expires < now) sessions.delete(token);
  if (sessions.size > 1000) sessions.delete(sessions.keys().next().value);
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, now + sessionLifetime);
  json(res, 200, { ok:true }, { 'Set-Cookie':`pmsg_gate_session=${token}; Path=/beyond; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetime / 1000}${secure ? '; Secure' : ''}` });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  try {
    if (req.headers.host !== publicHost) return json(res, 403, { ok:false });
    const url = new URL(req.url, origin);
    if (url.pathname === '/_entry/unlock' && req.method === 'POST') return await unlock(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { ok:false }, { Allow:'GET, HEAD' });
    if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
    if (publicFiles.has(url.pathname)) return await serve(req, res, publicFiles.get(url.pathname));
    if (url.pathname === '/' || url.pathname === '/beyond') { res.writeHead(303, { Location:'/beyond/' }).end(); return; }
    if (!url.pathname.startsWith('/beyond/')) return json(res, 404, { ok:false });
    const authorized = Boolean(sessionFor(req));
    if (url.pathname === '/beyond/' && (!authorized || url.searchParams.get('gate') === '1')) {
      res.setHeader('Content-Security-Policy', gatePolicy);
      return await serve(req, res, path.join(root, 'public/entry.html'));
    }
    if (!authorized) return json(res, 401, { ok:false });
    let relative;
    try { relative = decodeURIComponent(url.pathname.slice('/beyond/'.length)); } catch { return json(res, 400, { ok:false }); }
    if (relative.includes('\0') || relative.includes('\\') || relative.split('/').some(part => part.startsWith('.'))) return json(res, 404, { ok:false });
    let file = path.resolve(siteRoot, relative || 'index.html');
    if (!file.startsWith(siteRoot + path.sep)) return json(res, 404, { ok:false });
    try { file = await realpath(file); } catch { return json(res, 404, { ok:false }); }
    if (!file.startsWith(siteRoot + path.sep)) return json(res, 404, { ok:false });
    return await serve(req, res, file);
  } catch {
    if (!res.headersSent) json(res, 500, { ok:false });
    else res.destroy();
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, '127.0.0.1', () => console.log('Protected teaser ready: ' + origin + '/beyond/'));
