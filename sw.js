'use strict';
/* recebe os avisos no celular (mesmo com o jogo fechado), abre o jogo ao tocar e guarda o jogo no aparelho para abrir sem internet.
   Sempre busca primeiro a versão nova na internet (o jogo continua sempre atualizado); a cópia guardada só é usada sem internet. */
const CACHE='duelo-jogo';
/* de fora que o jogo usa: bibliotecas do QR e a fonte */
const DE_FORA=/^https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
/* guarda tudo que o index.html carrega (lê as tags dele: arquivo novo entra sozinho) e mais o que é aberto depois */
async function guardarTudo(){
  const c=await caches.open(CACHE), base=self.registration.scope;
  const r=await fetch(base,{cache:'no-store'}); if(!r.ok) return; const html=await r.clone().text(); await c.put(base,r);
  const lista=new Set(['CHANGELOG.md','manifest.webmanifest','img/icone-192.png','img/icone-512.png']);
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) lista.add(m[1]);
  await Promise.all([...lista].map(u=>{ const url=new URL(u,base); if(url.origin!==location.origin&&(!DE_FORA.test(url.href)||url.pathname==='/')) return;
    return fetch(url,{cache:'no-store',mode:url.origin===location.origin?'same-origin':'cors'}).then(x=>{ if(x.ok) return c.put(url,x); }).catch(()=>{}); }));
}
/* cada arquivo do jogo vem com ?v=versão: guardou a versão nova, apaga as cópias das outras versões do mesmo arquivo */
function limparVersoes(c,url){ c.keys().then(ks=>ks.forEach(k=>{ const u=new URL(k.url); if(u.origin===url.origin&&u.pathname===url.pathname&&u.search!==url.search) c.delete(k); })).catch(()=>{}); }
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(guardarTudo().catch(()=>{})); });
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(l=>Promise.all(l.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
/* pede à internet; se demorar demais ou não tiver, usa a cópia guardada. O que chega da internet atualiza a cópia. */
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url), meu=url.origin===location.origin; if(!meu&&!DE_FORA.test(req.url)) return; /* Supabase e o resto: direto, sem guardar */
  const pagina=req.mode==='navigate', chave=pagina?self.registration.scope:req; /* ?d=…, ?s=…: a página é a mesma */
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const rede=fetch(req).then(r=>{ if(r.ok||r.type==='opaque'){ c.put(chave,r.clone()).catch(()=>{}); if(meu&&url.searchParams.has('v')) limparVersoes(c,url); } return r; });
    /* sem resposta em 4 s (internet muito fraca): mostra o guardado, se tiver, e a cópia se atualiza quando a resposta chegar */
    const guardado=await c.match(chave,{ignoreSearch:pagina});
    if(!guardado) return rede;
    rede.catch(()=>{}); e.waitUntil(rede.catch(()=>{}));
    return Promise.race([rede.catch(()=>guardado),new Promise(ok=>setTimeout(()=>ok(guardado),4000))]);
  })());
});
self.addEventListener('push',e=>{
  let d={}; try{ d=e.data?e.data.json():{}; }catch(err){ d={title:'Duelo de Blocos',body:e.data?e.data.text():''}; }
  /* jogo aberto: avisa a página para atualizar o sino 🔔 */
  e.waitUntil(Promise.all([self.registration.showNotification(d.title||'Duelo de Blocos',{body:d.body||'',tag:d.tag||'duelo',renotify:true,data:{url:d.url||'./'}}),
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.forEach(c=>c.postMessage({t:'aviso'})))]));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close(); const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    /* se o jogo já está aberto, usa a mesma aba */
    for(const c of list) if(c.url.startsWith(self.registration.scope)&&'focus' in c){ return c.navigate(url).then(w=>(w||c).focus()).catch(()=>c.focus()); }
    return self.clients.openWindow(url);
  }));
});
