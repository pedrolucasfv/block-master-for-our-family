'use strict';
/* recebe os avisos no celular (mesmo com o jogo fechado) e abre o jogo ao tocar. Não guarda nada em cache: o jogo continua sempre atualizado. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
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
