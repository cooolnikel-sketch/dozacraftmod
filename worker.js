/** Cloudflare Worker: secure cookie login + shared public config. Set all secrets in dashboard; never put them in this file. */
const COOKIE = '__Host-dozacraft_session';
const TTL = 7 * 24 * 60 * 60;
const DEFAULT_CONFIG = {
  projectName: 'DozaCraft', latestVersion: '1.2.4', latestMinecraft: '26.3',
  latestDownloadUrl: 'https://github.com/YOUR-USERNAME/DozaCraft/releases/latest/download/webcambubbles-1.2.4.jar',
  repositoryUrl: 'https://github.com/YOUR-USERNAME/DozaCraft',
  versions: [{mod:'1.2.4',minecraft:'26.3',loader:'Fabric',url:'https://github.com/YOUR-USERNAME/DozaCraft/releases/latest/download/webcambubbles-1.2.4.jar'}]
};
const enc = new TextEncoder();
function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.SITE_ORIGIN || '';
  if (origin && origin === allowed) return {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials':'true', 'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Vary':'Origin'};
  return {'Vary':'Origin'};
}
function response(data, status, headers={}) { return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}}); }
async function key(env) { return crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']); }
function b64url(bytes) { let s=''; for (const b of new Uint8Array(bytes)) s+=String.fromCharCode(b); return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function unb64url(s) { s=s.replace(/-/g,'+').replace(/_/g,'/'); s+='='.repeat((4-s.length%4)%4); return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
async function makeToken(env) { const payload=b64url(enc.encode(JSON.stringify({exp:Math.floor(Date.now()/1000)+TTL,nonce:crypto.randomUUID()}))); const sig=await crypto.subtle.sign('HMAC',await key(env),enc.encode(payload)); return payload+'.'+b64url(sig); }
async function validToken(request,env) { const cookie=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'=')); if(!cookie)return false; const token=cookie.slice(COOKIE.length+1), parts=token.split('.'); if(parts.length!==2)return false; try { const ok=await crypto.subtle.verify('HMAC',await key(env),unb64url(parts[1]),enc.encode(parts[0])); if(!ok)return false; const p=JSON.parse(new TextDecoder().decode(unb64url(parts[0]))); return p.exp>Math.floor(Date.now()/1000); } catch(_){return false;} }
function cookie(token,maxAge=TTL) { return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`; }
async function getConfig(env) { if(env.CONFIG_KV){const saved=await env.CONFIG_KV.get('site-config'); if(saved){try{return JSON.parse(saved)}catch(_){}}} return DEFAULT_CONFIG; }
function validConfig(c) { if(!c||typeof c!=='object'||typeof c.latestVersion!=='string'||typeof c.latestMinecraft!=='string'||!/^https:\/\//i.test(c.latestDownloadUrl||'')||!/^https:\/\//i.test(c.repositoryUrl||'')||!Array.isArray(c.versions)||c.versions.length>100)return false; return c.versions.every(v=>v&&typeof v.mod==='string'&&typeof v.minecraft==='string'&&typeof v.loader==='string'&&/^https:\/\//i.test(v.url||'')); }
export default { async fetch(request,env) {
  const headers=cors(request,env); const origin=request.headers.get('Origin');
  if(request.method==='OPTIONS') { if(!origin||origin!==env.SITE_ORIGIN)return new Response('Forbidden', {status:403}); return new Response(null,{status:204,headers}); }
  if(!env.SITE_ORIGIN||!env.ADMIN_USERNAME||!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return response({error:'Worker is not configured. Set SITE_ORIGIN and required secrets.'},503,headers);
  if(origin&&origin!==env.SITE_ORIGIN)return response({error:'Origin not allowed'},403,headers);
  const url=new URL(request.url);
  try {
    if(url.pathname==='/api/config'&&request.method==='GET')return response({config:await getConfig(env)},200,headers);
    if(url.pathname==='/api/login'&&request.method==='POST'){
      const body=await request.json();
      if(typeof body.username!=='string'||typeof body.password!=='string'||body.username!==env.ADMIN_USERNAME||body.password!==env.ADMIN_PASSWORD)return response({error:'Неверный логин или пароль.'},401,headers);
      const token=await makeToken(env); return response({ok:true},200,{...headers,'Set-Cookie':cookie(token)});
    }
    if(url.pathname==='/api/logout'&&request.method==='POST')return response({ok:true},200,{...headers,'Set-Cookie':cookie('',0)});
    if(url.pathname==='/api/me'&&request.method==='GET')return validToken(request,env)?response({authenticated:true},200,headers):response({error:'Требуется вход.'},401,headers);
    if(url.pathname==='/api/config'&&request.method==='PUT'){
      if(!await validToken(request,env))return response({error:'Сессия истекла. Войди снова.'},401,headers);
      if(!env.CONFIG_KV)return response({error:'Не подключено хранилище CONFIG_KV (Cloudflare KV).'},503,headers);
      const body=await request.json(); if(!validConfig(body.config))return response({error:'Некорректные настройки. Используй HTTPS-ссылки.'},400,headers);
      await env.CONFIG_KV.put('site-config',JSON.stringify(body.config)); return response({ok:true,config:body.config},200,headers);
    }
    return response({error:'Not found'},404,headers);
  } catch(e) { return response({error:'Server error'},500,headers); }
}};
