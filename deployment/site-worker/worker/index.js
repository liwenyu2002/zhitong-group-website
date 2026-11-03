const ENTRY_ASSETS = /* ENTRY_ASSETS */ null;
const GROUP_SOURCE = 'https://raw.githubusercontent.com/liwenyu2002/zhitong-group-website/main';
const COOKIE_NAME = 'pmsg_gate_session';
const decoded = new Map();
const attempts = new Map();
const encoder = new TextEncoder();
const sessionLength = 8 * 60 * 60 * 1000;
let cachedSecret, cachedKey;
const types = {
  html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8',
  png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', svg:'image/svg+xml', webp:'image/webp',
  woff2:'font/woff2', mp4:'video/mp4', ico:'image/x-icon', txt:'text/plain; charset=utf-8'
};
const gatePolicy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'none'";

function error(status) {
  return new Response(JSON.stringify({ok:false}), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
function contentType(name) { return types[name.split('.').pop().toLowerCase()] || 'application/octet-stream'; }
function entryAsset(name, request, policy = false) {
  if (!ENTRY_ASSETS[name]) return error(404);
  if (!decoded.has(name)) decoded.set(name,Uint8Array.from(atob(ENTRY_ASSETS[name]),c=>c.charCodeAt(0)));
  const headers = new Headers({'Content-Type':contentType(name),'X-Content-Type-Options':'nosniff',
    'Cache-Control': policy ? 'private, no-store' : 'public, max-age=3600',
    'Referrer-Policy':'no-referrer','X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex, nofollow'});
  if (policy) headers.set('Content-Security-Policy',gatePolicy);
  return new Response(request.method === 'HEAD' ? null : decoded.get(name),{status:200,headers});
}
function tokenFor(request) {
  return (request.headers.get('Cookie') || '').split(';').map(v=>v.trim())
    .find(v=>v.startsWith(COOKIE_NAME+'='))?.slice(COOKIE_NAME.length+1) || '';
}
function base64url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function fromBase64url(value) {
  const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function signingKey(env) {
  if(cachedSecret!==env.PMSG_SESSION_SECRET) {
    cachedSecret=env.PMSG_SESSION_SECRET;
    cachedKey=crypto.subtle.importKey('raw',encoder.encode(cachedSecret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
  }
  return cachedKey;
}
async function authorized(request, env) {
  const token=tokenFor(request);
  if(!/^[a-z0-9]{6,10}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [expiry,nonce,signature]=token.split('.');
  const expires=parseInt(expiry,36), now=Date.now();
  if(!Number.isSafeInteger(expires) || expires<=now || expires>now+sessionLength+120000) return false;
  try {
    return await crypto.subtle.verify('HMAC',await signingKey(env),fromBase64url(signature),encoder.encode(expiry+'.'+nonce));
  } catch { return false; }
}
async function smallBody(request) {
  const stated=Number(request.headers.get('Content-Length') || 0);
  if(stated>1024 || !request.body) return null;
  const reader=request.body.getReader(), chunks=[];
  let length=0;
  while(true) {
    const {done,value}=await reader.read();
    if(done) break;
    length+=value.length;
    if(length>1024) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes=new Uint8Array(length); let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); } catch { return null; }
}
async function login(request,env,url) {
  if (request.method !== 'POST') return error(405);
  if (request.headers.get('Origin') !== url.origin) return error(403);
  if ((request.headers.get('Content-Type') || '').split(';')[0] !== 'application/json') return error(403);
  const ip=request.headers.get('CF-Connecting-IP') || 'unknown';
  const now=Date.now();
  let record=attempts.get(ip);
  if(!record || record.until<=now) record={count:0,until:now+60000};
  if(record.count>=12) return error(429);
  const input=await smallBody(request);
  if(typeof input?.passphrase!=='string') return error(400);
  const value=input.passphrase.normalize('NFC').trim();
  if(!value || value.length>128) return error(400);
  record.count++; attempts.set(ip,record);
  if(attempts.size>5000) for(const [key,item] of attempts) if(item.until<=now) attempts.delete(key);
  const key=await signingKey(env);
  const [candidate,expected]=await Promise.all([
    crypto.subtle.sign('HMAC',key,encoder.encode(value)),
    crypto.subtle.sign('HMAC',key,encoder.encode(env.PMSG_PASSWORD.normalize('NFC').trim()))
  ]);
  let difference=0; const a=new Uint8Array(candidate),b=new Uint8Array(expected);
  for(let i=0;i<a.length;i++) difference|=a[i]^b[i];
  if(difference!==0) return error(401);
  attempts.delete(ip);
  const expiry=(now+sessionLength).toString(36);
  const nonce=base64url(crypto.getRandomValues(new Uint8Array(16)));
  const payload=expiry+'.'+nonce;
  const signature=base64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload))));
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
    'Set-Cookie':`${COOKIE_NAME}=${payload}.${signature}; Path=/beyond; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionLength/1000}`
  }});
}
async function sourceFile(request,path,protectedFile) {
  const headers=new Headers({'Accept-Encoding':'identity'});
  const range=request.headers.get('Range');
  if(range) headers.set('Range',range);
  const query=new URL(request.url).search;
  const upstream=await fetch(GROUP_SOURCE+path+query,{
    method:request.method,headers,redirect:'follow',cf:{cacheEverything:true,cacheTtl:300}
  });
  const out=new Headers();
  for(const name of ['Content-Length','Content-Range','Accept-Ranges','ETag','Last-Modified','Content-Encoding']) {
    if(upstream.headers.has(name)) out.set(name,upstream.headers.get(name));
  }
  out.set('Content-Type',contentType(path));
  out.set('X-Content-Type-Options','nosniff');
  out.set('X-Frame-Options','SAMEORIGIN');
  out.set('Referrer-Policy','no-referrer');
  out.set('Cache-Control',protectedFile?'private, no-store':'public, max-age=300');
  if(protectedFile) out.set('X-Robots-Tag','noindex, nofollow');
  return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,headers:out});
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    let path;
    try { path=decodeURIComponent(url.pathname); } catch { return error(400); }
    if (path.includes('\\') || path.includes('\0') || path.split('/').some(part=>part.startsWith('.'))) return error(404);
    if (path==='/_entry/unlock') {
      if(!env.PMSG_PASSWORD || !env.PMSG_SESSION_SECRET) return error(503);
      return login(request,env,url);
    }
    if (!['GET','HEAD'].includes(request.method)) return error(405);
    if (path.startsWith('/_entry/')) return entryAsset(path.slice('/_entry/'.length),request);
    if (path==='/beyond') return Response.redirect(url.origin+'/beyond/',303);
    if (path.startsWith('/beyond/')) {
      const isRoot=path==='/beyond/';
      if(!env.PMSG_PASSWORD || !env.PMSG_SESSION_SECRET) return error(503);
      if(isRoot && (url.searchParams.get('gate')==='1' || !tokenFor(request))) return entryAsset('entry.html',request,true);
      const ok=await authorized(request,env);
      if(!ok) return isRoot ? entryAsset('entry.html',request,true) : error(401);
      const sourcePath=isRoot ? '/beyond/index.html' : path;
      return sourceFile(request,sourcePath,true);
    }
    if(path==='/') path='/index.html';
    const rootFiles=['/index.html','/favicon.ico','/favicon.png','/favicon-32.png','/apple-touch-icon.png'];
    if(rootFiles.includes(path) || ['/css/','/js/','/img/'].some(prefix=>path.startsWith(prefix))) return sourceFile(request,path,false);
    return error(404);
  }
};
