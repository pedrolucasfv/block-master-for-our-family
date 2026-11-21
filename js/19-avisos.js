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
  if(!avOk()){ b.hidden=true; t.textContent=avIOS()?'No iPhone, os avisos só funcionam com o jogo adicionado à Tela de Início (Compartilhar → Adicionar à Tela de Início). Sem isso, use o aviso pelo WhatsApp.':'Este navegador não mostra avisos. Use o aviso pelo WhatsApp.'; return; }
  const on=Notification.permission==='granted'&&!!(await avSub())&&!!store.get('ddb_avnome','');
  b.hidden=false; b.textContent=on?'🔕 Desligar avisos':'🔔 Me avisar quando for a minha vez';
  b.classList.toggle('primary',!on); b.onclick=on?avDesativar:avAtivar;
  t.textContent=on?'Avisos ligados neste aparelho: quando for sua vez num desafio, chega uma notificação.':Notification.permission==='denied'?'Os avisos estão bloqueados neste navegador. Para ligar, toque no cadeado ao lado do endereço do site e permita as notificações.':'Chega uma notificação quando for sua vez num desafio, mesmo com o jogo fechado.';
}
if(rkOn()&&avOk()){
  /* quem já ligou os avisos: mantém o aparelho registrado (e com o nome atual, se mudou no Perfil) */
  navigator.serviceWorker.getRegistration().then(async r=>{ avReg=r||null; if(!avReg||Notification.permission!=='granted') return;
    const sub=await avSub(), n=myNick().toLowerCase(), old=store.get('ddb_avnome','');
    if(sub&&old&&n&&old!==n) rkFetch('rpc/salvar_inscricao',{body:{p_nome:myNick(),p_inscricao:sub.toJSON()}}).then(()=>store.set('ddb_avnome',n)).catch(()=>{}); }).catch(()=>{});
}
