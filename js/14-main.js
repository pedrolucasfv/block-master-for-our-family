'use strict';
/* inicialização e MODO TESTE (aparelhos de mentira via ?sim=n) */
/* ===================== inicialização ===================== */
window.addEventListener('resize',()=>{ grC=null; sizeCanvas(); layout(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&D&&(!D.live||D.cfg.npc)&&D.playing&&!D.paused) setPaused(true); });
applyLook(); sizeCanvas(); renderNight(); renderHome(); if(SIM==null) pvAquecer();
loadVoices();
['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,function once(){ ac(); setTimeout(warmSounds,50); if(!vPadLoading) loadVoices(); window.removeEventListener(ev,once); },{once:true}));
/* ================= MODO TESTE: aparelhos de mentira na sala =================
   Cada aparelho de teste é o próprio jogo aberto num quadro escondido (?sim=n), entrando na sala
   como convidado de verdade. As mensagens vão por postMessage em vez da conexão direta.
   Ele joga sozinho; o botão da esquerda troca a tela para você jogar por ele. */
let SIMS=[], SIMV=-1, simNext=0;
function devOn(){ return !SIM&&!!store.get('ddb_dev',false); }
/* "liberar tudo": mundos, fases, temas e dourados abertos só para ver. Não grava nada como ganho. */
function devAll(){ return devOn()&&!!store.get('ddb_devall',false); }
function renderDev(){ $('#devCard').hidden=!devOn(); const b=$('#tDevAll'); if(b) b.classList.toggle('on',devAll()); }
function setDevAll(on){ store.set('ddb_devall',!!on); fixSkin(); saveSet(); applyLook(); renderDev(); if($('#settings').classList.contains('active')) renderSettings(); }
$('#tDevAll').addEventListener('click',()=>{ setDevAll(!devAll()); toast(devAll()?'🔓 Tudo liberado para teste':'🔒 Voltou ao progresso de verdade'); });
renderDev();
{ let taps=0, tt=0; $('#setTitle').addEventListener('click',()=>{ if(SIM) return; const n=performance.now(); taps=n-tt<1500?taps+1:1; tt=n;
  if(taps>=7){ taps=0; const on=!devOn(); store.set('ddb_dev',on); renderDev(); toast(on?'🤖 Modo teste ligado':'Modo teste desligado'); if(!on){ SIMS.slice().forEach(simRemove); setDevAll(false); } } }); }
function simUrl(n){ const u=new URL(location.href); u.hash=''; u.searchParams.set('sim',n); return u.href; }
function simAdd(){
  if(NET.role!=='A') return;
  if(!/^(https?|file):$/.test(location.protocol)){ toast('O aparelho de teste só funciona com o jogo aberto pelo link do site.'); return; }
  if(NET.players.length+SIMS.filter(x=>!x.joined).length>=MAXP){ toast('A sala já tem 6 jogadores'); return; }
  let n=1; while(SIMS.some(x=>x.n===n)) n++;
  const fr=document.createElement('iframe'); fr.className='simfr'; fr.setAttribute('aria-hidden','true'); fr.tabIndex=-1;
  const sim={n,fr,dead:false,joined:false};
  sim.dc={readyState:'open',onmessage:null,onclose:null,send(txt){ if(!sim.dead&&fr.contentWindow) fr.contentWindow.postMessage({sim:'m',txt},'*'); },close(){ simDrop(sim); }};
  sim.pend={pc:{close(){ simDrop(sim); },_watch(){}},dc:sim.dc,spec:false};
  SIMS.push(sim); fr.src=simUrl(n); document.body.appendChild(fr); toast(`🤖 Ligando o Teste ${n}…`);
}
/* some sem avisar ninguém (sala fechada) */
function simDrop(sim){ if(sim.dead) return; sim.dead=true; sim.fr.remove(); SIMS=SIMS.filter(x=>x!==sim); if(SIMV>=SIMS.length) SIMV=-1; simSwRender(); }
/* o jogador de teste sai da sala */
function simRemove(sim){ if(sim.dead) return; const oc=sim.dc.onclose; simDrop(sim); if(oc) oc(); if($('#lobby').classList.contains('active')) renderLobby(); }
function simSwRender(){
  let b=$('#simSw'); if(!SIMS.length){ if(b) b.remove(); SIMV=-1; return; }
  if(!b){ b=document.createElement('button'); b.id='simSw'; b.addEventListener('click',()=>{ SIMV=SIMV+1>=SIMS.length?-1:SIMV+1; simSwRender(); }); document.body.appendChild(b); }
  b.innerHTML=SIMV<0?'📱 Eu<small>trocar ▸</small>':`🤖 Teste ${SIMS[SIMV].n}<small>trocar ▸</small>`;
  SIMS.forEach((x,i)=>{ x.fr.classList.toggle('on',i===SIMV); if(x.fr.contentWindow) x.fr.contentWindow.postMessage({sim:'ctl',on:i===SIMV},'*'); });
  cancelDrag();
}
if(!SIM) window.addEventListener('message',e=>{
  const sim=SIMS.find(x=>x.fr.contentWindow===e.source), d=e.data; if(!sim||!d||typeof d!=='object') return;
  if(d.sim==='ready'){ if(NET.role!=='A'){ simDrop(sim); return; } sim.joined=true; hostPeerOpen(sim.pend); if(!sim.dead){ sim.fr.contentWindow.postMessage({sim:'open'},'*'); simSwRender(); } }
  else if(d.sim==='m'){ if(sim.dc.onmessage) sim.dc.onmessage({data:d.txt}); }
  else if(d.sim==='bye') simRemove(sim);
});
$('#lobbySim').addEventListener('click',simAdd);
$('#lobbySimDel').addEventListener('click',()=>{ SIMS.slice().forEach(simRemove); });
$('#pHostSim').addEventListener('click',()=>{ if(NET.role!=='A') hostRoomInit(); simAdd(); });
/* ---- dentro do aparelho de teste ---- */
function simBoot(){
  const P=window.parent; let dc=null;
  window.addEventListener('message',e=>{ if(e.source!==P) return; const d=e.data; if(!d||typeof d!=='object') return;
    if(d.sim==='open'){ if(dc&&dc.onopen) dc.onopen(); }
    else if(d.sim==='m'){ if(dc&&dc.onmessage) dc.onmessage({data:d.txt}); }
    else if(d.sim==='ctl'){ SIMCTL=!!d.on; muted=!SIMCTL; if(!SIMCTL) cancelDrag(); } });
  dc={readyState:'open',onopen:null,onmessage:null,onclose:null,send(txt){ P.postMessage({sim:'m',txt},'*'); },close(){ P.postMessage({sim:'bye'},'*'); }};
  closeNet(); NET.wantSpec=false; NET.link={pc:{close(){},_watch(){}},dc}; guestDC(dc);
  P.postMessage({sim:'ready'},'*');
  setInterval(simBot,450);
}
/* o robô: escolhe peça e lugar sozinho, num ritmo de gente */
function simBot(){
  if(SIMCTL||!NET.open) return; const t=performance.now(); if(t<simNext) return;
  if($('#lobby').classList.contains('active')){ /* times: entra no time com menos gente */
    const ty=NET.lobby&&NET.lobby.type; if((ty==='tlive'||ty==='tsplit')&&!(NET.teams&&NET.teams[NET.role])){
      const cnt=k=>Object.values(NET.teams||{}).filter(x=>x===k).length; send({t:'team',v:cnt('la')<cnt('az')?'la':'az'}); simNext=t+1500; } return; }
  if(!IN||drag) return;
  if(IN.tap){ for(const s of [0,1,2]) if(IN.tap(s)){ simNext=t+900+Math.random()*700; return; } }
  const opts=[];
  for(const s of [0,1,2,'h']){ if(!IN.canDrag(s)) continue; const p=IN.piece(s); if(!p) continue;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(IN.check(p,r,c)===true) opts.push([s,r,c]); }
  if(opts.length){ const o=opts[Math.floor(Math.random()*opts.length)]; IN.drop(o[0],o[1],o[2]); simNext=t+1300+Math.random()*1200; return; }
  if(IN.toHold&&!IN.piece('h')){ for(const s of [0,1,2]) if(IN.canDrag(s)&&IN.piece(s)&&IN.toHold(s)){ simNext=t+1000; return; } }
  simNext=t+800;
}
if(SIM) simBoot();
