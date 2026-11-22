'use strict';
/* AVISOS no celular ("sua vez no desafio"), pelo navegador, sem instalar nada. O envio é feito pela função supabase/functions/avisar. */
/* chave pública dos avisos (VAPID). A chave privada fica só nos segredos do Supabase. */
const PUSH_KEY='BNNCHTT9NamY34VNICS_sFlP7NXFse1wBZhlKbswmVMTtYTzSH-Qf7b0BHTjuOBqm0h9nP_GcIjKbQjQPx78BLE';
const avOk=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&window.isSecureContext;
const avIOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
/* aberto dentro do WhatsApp, Instagram ou Facebook (navegador embutido): esses não deixam o site mandar avisos */
const avInApp=()=>/; wv\)|WhatsApp|FBAN|FBAV|Instagram|Line\//.test(navigator.userAgent);
let avReg=null;
function avKey(){ const s=PUSH_KEY.replace(/-/g,'+').replace(/_/g,'/'), raw=atob(s+'='.repeat((4-s.length%4)%4)); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function avSub(){ if(!avReg) return null; try{ return await avReg.pushManager.getSubscription(); }catch(e){ return null; } }
/* liga os avisos: pede permissão, inscreve o aparelho e guarda no Supabase com o nome da pessoa */
async function avAtivar(){
  const t=$('#avTxt');
  if(!avOk()){ avRender(); return; }
  dsNeedNick(async()=>{
    /* cada etapa tem seu nome, para a mensagem de erro dizer onde parou */
    let etapa='permissão';
    try{
      t.textContent='Ligando os avisos…';
      const p=await Notification.requestPermission();
      if(p!=='granted'){ t.textContent='Os avisos foram bloqueados. Para ligar, toque no cadeado ao lado do endereço do site e permita as notificações.'; return; }
      etapa='preparar o aparelho'; if(!avReg) avReg=await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      etapa='inscrever o aparelho'; const sub=(await avSub())||await avReg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:avKey()});
      etapa='guardar no servidor'; await rkFetch('rpc/salvar_inscricao',{body:{p_nome:myNick(),p_inscricao:sub.toJSON()}});
      store.set('ddb_avnome',myNick().toLowerCase()); toast('🔔 Avisos ligados!'); avRender();
    }catch(e){ t.textContent=`Não deu para ligar os avisos (parou em: ${etapa}). ${avInApp()?'Abra o jogo no Chrome (⋮ → Abrir no Chrome) e tente de novo.':'Confira a internet e tente de novo.'} Detalhe: ${e&&e.message||e}`; }
  });
}
async function avDesativar(){ const sub=await avSub(); if(sub){ rkFetch('rpc/remover_inscricao',{body:{p_endpoint:sub.endpoint}}).catch(()=>{}); try{ await sub.unsubscribe(); }catch(e){} } store.set('ddb_avnome',''); toast('🔕 Avisos desligados'); avRender(); }
async function avRender(){
  const box=$('#avBox'); if(!box) return; box.hidden=false; const b=$('#avBtn'), t=$('#avTxt');
  if(avInApp()){ b.hidden=true; t.textContent='🔔 Você abriu o jogo dentro do WhatsApp (ou de outro app), e por aqui não dá para receber avisos. Toque nos três pontinhos (⋮) e em "Abrir no Chrome", e ligue os avisos lá.'; return; }
  if(!avOk()){ b.hidden=true; t.textContent=avIOS()?'No iPhone, os avisos só funcionam com o jogo instalado na Tela de Início (no menu, toque em "📲 Instalar o jogo" para ver como). Sem isso, use o aviso pelo WhatsApp.':'Este navegador não mostra avisos. Use o aviso pelo WhatsApp.'; return; }
  const on=Notification.permission==='granted'&&!!(await avSub())&&!!store.get('ddb_avnome','');
  b.hidden=false; b.textContent=on?'🔕 Desligar avisos':'🔔 Me avisar quando for a minha vez';
  b.classList.toggle('primary',!on); b.onclick=on?avDesativar:avAtivar;
  t.textContent=on?'Avisos ligados neste aparelho: sua vez nos desafios, recordes batidos e o Desafio do dia de manhã.':Notification.permission==='denied'?'Os avisos estão bloqueados neste navegador. Para ligar, toque no cadeado ao lado do endereço do site e permita as notificações.':'Chega uma notificação quando for sua vez num desafio, quando alguém passar seu recorde, e de manhã quando sair o Desafio do dia. Funciona mesmo com o jogo fechado.';
}
/* aviso tocado: ?dia=1 abre o Desafio do dia; ?fase=3-8 abre a fase da campanha */
function avFromLink(){
  let q=null; try{ q=new URLSearchParams(location.search); }catch(e){ return; }
  if(!q.get('dia')&&!q.get('fase')) return;
  try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
  avGo('?'+q.toString());
}
/* abre o que o aviso fala: ?d=id (desafio), ?dia=1 (Desafio do dia), ?fase=3-8 (fase da campanha) */
function avGo(url){
  let q; try{ q=new URLSearchParams(String(url||'').split('?')[1]||''); }catch(e){ return; }
  const d=q.get('d'), fase=q.get('fase');
  if(d&&/^[0-9a-f]{8}$/.test(d)){ dsList(); dsOpen(d); return; }
  if(q.get('dia')){ closeEnd(); $('#goDaily').click(); return; }
  const m=/^(\d{1,2})-(\d{1,2})$/.exec(fase||''); if(!m) return; const w=+m[1], ph=+m[2];
  if(!CWORLDS[w-1]||!CWORLDS[w-1].phases[ph-1]) return; closeEnd(); openCamp(w); if(campOpen(campLoad('solo'),w,ph)) campIntro(w,ph);
}
setTimeout(avFromLink,700);
/* ===== histórico de avisos: sino 🔔 no menu, com quantos avisos novos chegaram desde a última vez que abriu ===== */
let AV_LIST=[];
const avAgo=iso=>{ const s=Math.max(0,(Date.now()-new Date(iso).getTime())/1000);
  return s<60?'agora':s<3600?`há ${Math.floor(s/60)} min`:s<86400?`há ${Math.floor(s/3600)} h`:s<172800?'ontem':`há ${Math.floor(s/86400)} dias`; };
function avBellLoad(){
  if(!rkOn()||!myNick()) return;
  rkFetch(`avisos_log?chave=eq.${encodeURIComponent(myNick().toLowerCase())}&select=titulo,corpo,url,quando&order=quando.desc&limit=50`)
    .then(r=>{ AV_LIST=r||[]; avBellRender(); }).catch(()=>{});
}
function avBellRender(){
  const b=$('#avBell'), n=$('#avBellN'); if(!b) return; b.hidden=!rkOn()||!myNick();
  const lido=store.get('ddb_avlido',''), novos=AV_LIST.filter(a=>a.quando>lido).length;
  n.hidden=!novos; n.textContent=novos>9?'9+':novos; b.classList.toggle('tem',!!novos);
}
function avBellOpen(){
  if(AV_LIST.length) store.set('ddb_avlido',AV_LIST[0].quando); avBellRender();
  const body='<h2>🔔 Avisos</h2>'+(AV_LIST.length?'<div class="avhist">'+AV_LIST.map((a,i)=>`<button type="button" class="avitem" data-i="${i}"><b>${esc(a.titulo)}</b><span>${esc(a.corpo)}</span><small>${avAgo(a.quando)}</small></button>`).join('')+'</div><p class="muted" style="font-size:12px">Os avisos ficam aqui por 30 dias. Toque num aviso para abrir.</p>'
    :'<p class="muted">Nenhum aviso ainda. Aqui aparecem os desafios, os recordes batidos e o Desafio do dia.</p>');
  openEnd(body,[{t:'Fechar',cls:'ghost',on:closeEnd}]);
  $$('#endBody .avitem').forEach(x=>x.addEventListener('click',()=>{ const a=AV_LIST[+x.dataset.i]; if(a&&a.url) avGo(a.url); else closeEnd(); }));
}
$('#avBell').addEventListener('click',avBellOpen);
if(rkOn()){ setTimeout(avBellLoad,2000); if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',e=>{ if(e.data&&e.data.t==='aviso') setTimeout(avBellLoad,1500); }); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) avBellLoad(); }); setInterval(()=>{ if(!document.hidden&&$('#home').classList.contains('active')) avBellLoad(); },60000); }
if(rkOn()&&avOk()){
  /* quem já ligou os avisos: mantém o aparelho registrado (e com o nome atual, se mudou no Perfil) */
  navigator.serviceWorker.getRegistration().then(async r=>{ avReg=r||null; if(!avReg||Notification.permission!=='granted') return;
    const sub=await avSub(), n=myNick().toLowerCase(), old=store.get('ddb_avnome','');
    if(sub&&old&&n&&old!==n) rkFetch('rpc/salvar_inscricao',{body:{p_nome:myNick(),p_inscricao:sub.toJSON()}}).then(()=>store.set('ddb_avnome',n)).catch(()=>{}); }).catch(()=>{});
}
