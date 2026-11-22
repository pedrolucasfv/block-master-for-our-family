'use strict';
/* CONEXÃO WebRTC, QR, sala com vários jogadores, mensagens, resultados, abas da sala */
/* ===================== CONEXÃO (WebRTC) ===================== */
const IDS='ABCDEF', MAXP=6;
const LIMITS={live:[2,6],coop:[2,4],halves:[2,4],versus:[2,4],tlive:[2,6],tsplit:[2,6],camp:[1,4]};
const NET={prof:{},role:null,open:false,session:'',round:0,peers:{},pend:null,link:null,players:[],names:{},daily:{},
  rematch:{me:false},rematchReq:new Set(),ser:{},lastWinner:null,lobby:{type:'live',opts:defOpts()},cur:null,match:null,room:{matches:[]}};
function rawSend(dc,txt){ if(dc&&dc.readyState==='open'){ try{ dc.send(txt); }catch(e){} } }
/* quem criou manda para todos (ou só para "to"); convidado manda para quem criou, que repassa */
function send(obj){
  obj.from=obj.from||NET.role;
  if(D&&D.cfg.npc&&!NET.open){ npcHear(obj); return; } /* duelo contra o robô: nada sai pela rede */
  if(NET.role==='A'){ if(obj.to){ sendTo(obj.to,obj); if((obj.t==='atk'||obj.t==='pw'||obj.t==='blk')&&obj.to!=='S'&&NET.peers.S) sendTo('S',obj); return; } const txt=JSON.stringify(obj); for(const id in NET.peers) rawSend(NET.peers[id].dc,txt); }
  else if(NET.link) rawSend(NET.link.dc,JSON.stringify(obj));
}
function sendTo(id,obj){ obj.from=obj.from||NET.role; if(NET.role==='A'&&NET.peers[id]) rawSend(NET.peers[id].dc,JSON.stringify(obj)); }
function relay(m,except){ const txt=JSON.stringify(m); for(const id in NET.peers) if(id!==except) rawSend(NET.peers[id].dc,txt); }
function b64u(u8){ let s=''; for(let i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function fromB64u(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const bin=atob(s); return Uint8Array.from(bin,c=>c.charCodeAt(0)); }
const canZip='CompressionStream' in window&&'DecompressionStream' in window;
async function encodeSig(obj){
  const json=JSON.stringify(obj);
  if(canZip){ try{ const buf=await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer(); return 'Z'+b64u(new Uint8Array(buf)); }catch(e){} }
  return 'J'+b64u(new TextEncoder().encode(json));
}
async function decodeSig(str){
  str=str.replace(/\s+/g,''); const k=str[0], data=fromB64u(str.slice(1));
  if(k==='Z') return JSON.parse(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text());
  if(k==='J') return JSON.parse(new TextDecoder().decode(data));
  throw new Error('código não reconhecido');
}
function slimSdp(sdp){ return sdp.split('\r\n').filter(l=>!/^a=(extmap-allow-mixed|msid-semantic)/.test(l)).join('\r\n'); }
function renderQr(el,text){
  if(typeof window.qrcode!=='function'){ el.innerHTML='<p class="muted">Use Copiar ou Compartilhar.</p>'; return; }
  try{ const q=qrcode(0,'L'); q.addData(text); q.make(); el.innerHTML=`<div class="qr"><img alt="QR code da conexão" src="${q.createDataURL(6,3)}"></div>`; }
  catch(e){ el.innerHTML='<p class="muted">Use Copiar ou Compartilhar.</p>'; }
}
async function copyText(text,btn){
  let ok=false; try{ await navigator.clipboard.writeText(text); ok=true; }catch(e){}
  if(!ok){ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{ ok=document.execCommand('copy'); }catch(e){} ta.remove(); }
  if(btn){ const o=btn.textContent; btn.textContent=ok?'Copiado':'Selecione e copie'; setTimeout(()=>btn.textContent=o,1500); }
}
let stream=null, scanning=false, detector=null;
async function scan(onText,errEl){
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){ errEl.textContent=mediaWhy('cam',null)+' Por enquanto, use Copiar e colar.'; return; }
  /* resolução maior ajuda nos QR densos; Samsung com várias câmeras às vezes abre a grande-angular (sem foco de perto),
     então, se houver mais de uma câmera traseira, troca para a principal ("camera2 0") */
  const V={facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}};
  try{ stream=await navigator.mediaDevices.getUserMedia({video:V,audio:false}); }
  catch(e){ try{ stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}); }
    catch(e2){ errEl.textContent=mediaWhy('cam',e2)+' Por enquanto, use Copiar e colar.'; return; } }
  try{ const cur=stream.getVideoTracks()[0], devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'&&/back|traseira|rear|environment/i.test(d.label));
    const main=devs.find(d=>/\b0\b/.test(d.label))||devs[0], curId=cur.getSettings().deviceId;
    if(devs.length>1&&main&&main.deviceId&&main.deviceId!==curId){ const s2=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:main.deviceId},width:{ideal:1920},height:{ideal:1080}},audio:false}); stream.getTracks().forEach(t=>t.stop()); stream=s2; } }catch(e){}
  try{ const tr=stream.getVideoTracks()[0], cap=tr.getCapabilities?tr.getCapabilities():{}; if(cap.focusMode&&cap.focusMode.includes('continuous')) await tr.applyConstraints({advanced:[{focusMode:'continuous'}]}); }catch(e){}
  const video=$('#video'), canvas=$('#canvas'), ctx=canvas.getContext('2d',{willReadFrequently:true});
  video.srcObject=stream; $('#scanner').classList.add('show'); try{ await video.play(); }catch(e){}
  if('BarcodeDetector' in window&&!detector){ try{ detector=new BarcodeDetector({formats:['qr_code']}); }catch(e){ detector=null; } }
  scanning=true;
  const tick=async()=>{
    if(!scanning) return;
    if(video.readyState>=2){
      let found=null;
      if(detector){ try{ const c=await detector.detect(video); if(c.length) found=c[0].rawValue; }catch(e){ detector=null; } }
      if(!found&&typeof window.jsQR==='function'){
        const sc=Math.min(1,800/Math.max(video.videoWidth,video.videoHeight)); canvas.width=Math.round(video.videoWidth*sc); canvas.height=Math.round(video.videoHeight*sc);
        ctx.drawImage(video,0,0,canvas.width,canvas.height); const img=ctx.getImageData(0,0,canvas.width,canvas.height);
        const r=jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'}); if(r&&r.data) found=r.data;
      }
      if(found){ stopScan(); onText(found); return; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function stopScan(){ scanning=false; if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } $('#scanner').classList.remove('show'); }
$('#scanCancel').addEventListener('click',stopScan);
/* ---------- sala com vários jogadores ----------
   Quem cria a sala é o centro: cada convidado tem uma conexão direta só com ele (um par de QR por convidado).
   O criador repassa as mensagens entre os convidados. Ids: A (criador), B, C, D, E, F. */
function myNick(){ return String(store.get('ddb_nick','')||'').trim().slice(0,16); }
function nm(id,you=true){ if(!id) return 'Alguém'; if(id==='npc') return npcName(); if(!you&&D&&D.cfg.npc&&id===NET.role) return myNick()||'Você'; if(you&&id===NET.role) return 'Você'; const n=NET.names[id]; return n||('Jogador '+(IDS.indexOf(id)+1)); }
function myDaily(){ const dl=store.get('ddb_daily',{}), tk=diaBR(), r=dl[tk+'|R']; return {key:tk,t:r?r.score:null,s:null}; }
function rtcOk(){ if(typeof RTCPeerConnection!=='function'){ toast('Este navegador não permite conexão direta.'); return false; } return true; }
/* onGone: a conexão caiu de vez (falhou, fechou, ou ficou "desconectada" por mais de 15 s) */
function newPC(onFail,onGone){
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]}); let t=0;
  pc.onconnectionstatechange=()=>{ const st=pc.connectionState; clearTimeout(t);
    if(st==='failed'&&onFail) onFail();
    if(pc._gone) pc._gone(st); };
  pc._watch=fn=>{ pc._gone=st=>{ clearTimeout(t); if(st==='failed'||st==='closed') fn(); else if(st==='disconnected') t=setTimeout(()=>{ if(pc.connectionState!=='connected') fn(); },15000); }; };
  return pc;
}
function waitIce(pc,ms=5000){ return new Promise(res=>{ if(pc.iceGatheringState==='complete') return res(); const t=setTimeout(res,ms); pc.addEventListener('icegatheringstatechange',()=>{ if(pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }); }); }
function resetConnectUI(){ $('#pHostBox').hidden=true; $('#pGuestBox').hidden=true; $('#pGuest1').hidden=false; $('#pGuest2').hidden=true; ['#pHostCode','#pHostPaste','#pGuestPaste','#pGuestCode'].forEach(s=>$(s).value=''); ['#pHostQr','#pGuestQr'].forEach(s=>$(s).innerHTML=''); ['#pHostStatus','#pGuestStatus','#pHostWait'].forEach(s=>$(s).textContent=''); }
function closeNet(){
  const kill=c=>{ if(!c) return; try{ c.dc&&c.dc.close(); }catch(e){} try{ c.pc&&c.pc.close(); }catch(e){} };
  const was=NET.open; NET.open=false;
  Object.values(NET.peers).forEach(kill); kill(NET.pend); kill(NET.link);
  if(typeof chatLimpar==='function') chatLimpar(); /* o chat é só da sala: some quando ela fecha (o aparelho de teste fecha antes do chat carregar) */
  NET.peers={}; NET.pend=null; NET.link=null; NET.players=[]; NET.role=null; NET.match=null; NET.isSpec=false; NET.wantSpec=false; NET.specOn=false;
  return was;
}
/* "Jogar com alguém": criar/entrar direto do menu; se já estiver numa sala, só volta para ela */
function renderWith(){ const on=NET.open; $('#withConn').hidden=on; $('#withLobby').hidden=!on; }
$('#withLobby').addEventListener('click',()=>{ if(NET.open) toLobby(); else renderWith(); });

/* ----- criador da sala ----- */
function hostRoomInit(){
  closeNet(); NET.role='A'; NET.session=Math.random().toString(36).slice(2,10); NET.round=0;
  NET.players=['A']; NET.prof={}; NET.teams={}; NET.names={A:myNick()}; NET.daily={A:myDaily()}; NET.ser={}; NET.room={matches:[]}; NET.rematchReq=new Set(); NET.lastWinner=null;
}
async function hostNewOffer(spec){
  $('#pHostSim').hidden=!!spec||!devOn();
  if(!spec&&NET.players.length>=MAXP){ toast('A sala já tem 6 jogadores'); return; }
  $('#connTitle').textContent='Jogar conectado';
  resetConnectUI(); $('#pHostBox').hidden=false; show('connect');
  clearInterval(slPoll); $('#pLinkBox').hidden=!!spec||!rkOn(); $('#pLinkStat').textContent='';
  if(NET.pend){ try{ NET.pend.pc.close(); }catch(e){} }
  const pc=newPC(()=>{ if(NET.pend===pend) $('#pHostStatus').textContent='A conexão falhou. Volte e gere um novo código.'; }), pend={pc,dc:null}; NET.pend=pend;
  pend.spec=!!spec;
  const dc=pc.createDataChannel('duelo',{ordered:true}); pend.dc=dc; dc.onopen=()=>hostPeerOpen(pend);
  $('#pHostStep').textContent=spec?'1. Mostre este código para a webcam do computador (espectador)':NET.open?`1. Mostre este código para o jogador ${NET.players.length+1}`:'1. Mostre este código para o outro celular';
  $('#pHostStep2').textContent=spec?'2. Leia com a câmera o QR que aparece na TV':'2. Leia a resposta do outro celular';
  try{
    await pc.setLocalDescription(await pc.createOffer()); $('#pHostWait').textContent='Procurando rotas de conexão…'; await waitIce(pc);
    if(NET.pend!==pend) return;
    const code=await encodeSig({t:'o',sdp:slimSdp(pc.localDescription.sdp)}); $('#pHostCode').value=code; renderQr($('#pHostQr'),code); $('#pHostWait').textContent='';
  }catch(e){ $('#pHostWait').textContent='Erro: '+e.message; }
}
async function hostAccept(text){
  const pend=NET.pend; if(!pend){ $('#pHostStatus').textContent='Gere um código novo primeiro.'; return; }
  try{ const m=await decodeSig(text); if(m.t!=='a') throw new Error('isso é um código de sala, não de resposta');
    await pend.pc.setRemoteDescription({type:'answer',sdp:m.sdp}); $('#pHostStatus').textContent='Conectando…';
  }catch(e){ $('#pHostStatus').textContent='Código inválido: '+e.message; }
}
function hostPeerOpen(pend){
  if(NET.pend===pend) NET.pend=null;
  const reject=spec=>{ try{ pend.dc.send(JSON.stringify({t:'full',spec:spec?1:0})); }catch(e){} setTimeout(()=>{ try{ pend.pc.close(); }catch(e){} },400); };
  let id;
  if(pend.spec){ if(NET.peers.S){ reject(true); return; } id='S'; }
  else { id=[...IDS].find(x=>!NET.players.includes(x)); if(!id){ reject(false); return; } }
  const peer={pc:pend.pc,dc:pend.dc,id}; NET.peers[id]=peer;
  if(id!=='S'){ NET.players.push(id); NET.names[id]=''; }
  pend.dc.onmessage=e=>{ let m; try{ m=JSON.parse(e.data); }catch(err){ return; } m.from=peer.id; hostMsg(m,peer.id); };
  pend.dc.onclose=()=>hostPeerGone(peer.id); pend.pc._watch(()=>{ try{ pend.dc.close(); }catch(e){} hostPeerGone(peer.id); });
  const first=!NET.open; NET.open=true;
  welcomePeer(id);
  if(id==='S'){ toast('📺 Espectador conectado'); SFX.win(); sendRoster(); }
  else { sendRoster(); toast(first?'Conectado!':'Novo jogador na sala'); SFX.win(); }
  if(first||$('#connect').classList.contains('active')) toLobby();
}
function welcomePeer(id){
  sendTo(id,{t:'welcome',id,spec:id==='S',session:NET.session,players:NET.players,names:NET.names,daily:NET.daily,lobby:NET.lobby,room:NET.room});
  const mp=myProfile(); sendTo(id,{t:'prof',photo:mp.photo,atk:mp.atk,combo:mp.combo});
  for(const k in NET.prof) if(k!==id&&NET.players.includes(k)){ const q=NET.prof[k]; sendTo(id,{t:'prof',from:k,photo:q.photo,atk:q.atk,combo:q.combo}); }
  /* espectador que chega com a partida em andamento */
  if(id==='S'&&NET.cur&&(D||SH)) sendTo('S',{...NET.cur,t:'cfg',late:1});
}
/* um aparelho entrou como jogador mas é o espectador (ou o contrário): troca o id para S */
function convertToSpec(id){
  const peer=NET.peers[id]; if(!peer) return;
  if(NET.peers.S){ sendTo(id,{t:'full',spec:1}); setTimeout(()=>{ try{ peer.pc.close(); }catch(e){} },400); return; }
  delete NET.peers[id]; NET.players=NET.players.filter(x=>x!==id); delete NET.names[id]; delete NET.prof[id];
  peer.id='S'; NET.peers.S=peer; welcomePeer('S'); sendRoster(); toast('📺 Espectador conectado');
  if($('#lobby').classList.contains('active')) renderLobby();
}
function hostPeerGone(id){
  if(!NET.peers[id]) return;
  if(id==='S'){ delete NET.peers.S; toast('📺 O espectador saiu'); sendRoster(); return; }
  delete NET.peers[id]; delete NET.prof[id]; if(NET.teams) delete NET.teams[id]; NET.players=NET.players.filter(x=>x!==id); NET.rematchReq.delete(id);
  toast(`${nm(id)} saiu da sala`); sendRoster();
  const M=NET.match;
  if(D&&D.live&&D.opps[id]&&!D.opps[id].info){ const m={t:'end',from:id,seed:D.cfg.seed,info:{reason:'quit',score:D.opps[id].score,lines:0,combo:0,placed:0,timeline:[[0,0]],goalTime:null}}; relay(m,null); onEnd(m); }
  else if(M&&M.type==='live'&&!M.infos[id]) noteEnd(id,{reason:'quit',score:0,combo:0},M.seed);
  if(SH&&SH.host&&!SH.over&&SH.ids.includes(id)) hostEnd('oppQuit',null,id);
}
function sendRoster(){ if(NET.role!=='A') return; NET.names.A=myNick(); NET.daily.A=myDaily(); send({t:'roster',players:NET.players,names:NET.names,daily:NET.daily,teams:NET.teams,spec:!!NET.peers.S}); NET.specOn=!!NET.peers.S; renderNames(); }
function sendProfile(){ const p=myProfile(); send({t:'prof',photo:p.photo,atk:p.atk,combo:p.combo}); }
function storeProf(m){ if(!m.from||m.from===NET.role) return; NET.prof[m.from]={photo:m.photo||'',atk:m.atk||'',combo:m.combo||''}; renderNames(true); }
function renderNames(av){
  if($('#lobby').classList.contains('active')) renderLobby();
  if(D&&D.live&&D.others) D.others.forEach(id=>oppSet(id,D.opps[id].score,null,{label:nm(id),av:!!av}));
  if(av&&SH&&SH.type==='versus') SH.ids.forEach(id=>{ if(id!==SH.me) oppSet(id,0,null,{av:true}); });
}
/* criar sala: vai direto para a sala (sozinho nela); o QR/link para chamar alguém só aparece em "+ Adicionar jogador" */
$('#pHost').addEventListener('click',()=>{ if(!rtcOk()) return; if(NET.open){ toLobby(); return; } hostRoomInit(); NET.open=true; LTAB='sala'; toLobby(); });
$('#pHostScan').addEventListener('click',()=>scan(hostAccept,$('#pHostStatus')));
$('#pHostConnect').addEventListener('click',()=>{ const v=$('#pHostPaste').value.trim(); if(v) hostAccept(v); });
$('#pHostCopy').addEventListener('click',e=>copyText($('#pHostCode').value,e.currentTarget));
$('#pHostShare').addEventListener('click',()=>shareText($('#pHostCode').value));

/* ----- convidado ----- */
function guestStart(spec){ if(!rtcOk()) return; if(NET.open){ if(NET.isSpec) show('spec'); else toLobby(); return; } closeNet(); ac(); NET.wantSpec=!!spec; resetConnectUI(); $('#pGuestBox').hidden=false;
  $('#connTitle').textContent=spec?'Modo espectador':'Jogar conectado';
  $('#pGuestStep1').textContent=spec?'1. Leia, pela webcam, o código do celular de quem criou a sala':'1. Leia o código do celular que criou a sala';
  $('#pGuestStep2').textContent=spec?'2. Peça para quem criou a sala ler este QR com o celular':'2. Mostre esta resposta para o outro celular';
  $('#pGuestQr').classList.toggle('bigqr',!!spec); show('connect'); }
$('#pGuest').addEventListener('click',()=>guestStart(false));
$('#pSpec').addEventListener('click',()=>guestStart(true));
async function guestUse(text){
  try{ const m=await decodeSig(text); if(m.t!=='o') throw new Error('isso é um código de resposta, não de sala');
    const ws=NET.wantSpec; closeNet(); NET.wantSpec=ws; const pc=newPC(()=>{ $('#pGuestStatus').textContent='A conexão falhou. Volte e tente de novo.'; }); NET.link={pc,dc:null};
    pc.ondatachannel=e=>guestDC(e.channel); pc._watch(()=>{ const c=NET.link&&NET.link.dc; if(c&&c.onclose) c.onclose(); });
    await pc.setRemoteDescription({type:'offer',sdp:m.sdp}); await pc.setLocalDescription(await pc.createAnswer());
    $('#pGuestStatus').textContent='Procurando rotas de conexão…'; await waitIce(pc);
    const code=await encodeSig({t:'a',sdp:slimSdp(pc.localDescription.sdp)}); $('#pGuestCode').value=code; renderQr($('#pGuestQr'),code);
    $('#pGuest1').hidden=true; $('#pGuest2').hidden=false;
  }catch(e){ $('#pGuestStatus').textContent='Código inválido: '+e.message; }
}
function guestDC(ch){
  if(!NET.link) return; NET.link.dc=ch;
  ch.onopen=()=>{ toast(NET.wantSpec?'Conectado! Abrindo o modo espectador…':'Conectado! Entrando na sala…'); send({t:'hello',spec:!!NET.wantSpec,name:myNick(),daily:myDaily(),last:store.get('ddb_lastOnline',null)}); };
  ch.onmessage=e=>{ let m; try{ m=JSON.parse(e.data); }catch(err){ return; } guestMsg(m); };
  ch.onclose=()=>{ if(!NET.open) return; NET.open=false; toast('A sala foi fechada ou a conexão caiu');
    if(NET.isSpec){ closeNet(); show('home'); return; }
    if(D&&D.live&&!D.over) toast('Conexão perdida. A partida continua só no seu aparelho.');
    if(SH&&!SH.over) sharedOver({reason:'disc',winner:null,sc:SH.view?SH.view.sc:0,scs:SH.view?SH.view.scs:{},ids:SH.ids,lines:0,combo:0,timeline:[[0,0]]});
    if(['lobby','connect','settings'].some(s=>$('#'+s).classList.contains('active'))&&!(D||SH)){ closeNet(); show('home'); } };
}
$('#pGuestScan').addEventListener('click',()=>scan(guestUse,$('#pGuestStatus')));
$('#pGuestUse').addEventListener('click',()=>{ const v=$('#pGuestPaste').value.trim(); if(v) guestUse(v); });
$('#pGuestCopy').addEventListener('click',e=>copyText($('#pGuestCode').value,e.currentTarget));
$('#pGuestShare').addEventListener('click',()=>shareText($('#pGuestCode').value));
$('#connBack').addEventListener('click',()=>{ stopScan();
  if(NET.role==='A'&&NET.open){ if(NET.pend){ try{ NET.pend.pc.close(); }catch(e){} NET.pend=null; } toLobby(); return; }
  if(!NET.open) closeNet(); show('with'); });

/* ----- mensagens ----- */
function hostMsg(m,from){
  switch(m.t){
    case 'prof': storeProf(m); relay(m,from); break;
    case 'hello': if(m.spec&&from!=='S'){ convertToSpec(from); break; } if(from==='S') break; NET.names[from]=String(m.name||'').slice(0,16); NET.daily[from]=m.daily||null; sendRoster(); compareLast(m.last); chatHistPara(from); break;
    case 'team': if(from==='S') break; NET.teams[from]=m.v==='la'?'la':'az'; sendRoster(); break;
    case 'nick': if(from==='S') break; NET.names[from]=String(m.name||'').slice(0,16); sendRoster(); break;
    case 'act': if(SH&&SH.host) hostAct(from,m.a); break;
    case 'quit': if(SH&&SH.host&&!SH.over) hostEnd('oppQuit',null,from); break;
    case 'rematch': NET.rematchReq.add(from); toast(`${nm(from)} quer revanche`); refreshEnd(); break;
    case 'atk': case 'pw': case 'blk': if(m.to===NET.role) common(m); else sendTo(m.to,m); if(m.to!=='S'&&NET.peers.S) sendTo('S',m); break;
    case 'cmb': if(NET.peers.S) sendTo('S',m); break;
    case 'st': case 'end': case 'emo': case 'goldWon': case 'pause': case 'resume': relay(m,from); common(m); break;
    case 'chat': if(from==='S') break; m.from=from; relay(m,from); common(m); break; /* carimba quem mandou: ninguém fala no nome de outro */
  }
}
function guestMsg(m){
  if(m.t==='welcome'&&m.spec){ NET.role='S'; NET.isSpec=true; NET.open=true; NET.session=m.session; NET.players=m.players; NET.names=m.names||{}; NET.daily=m.daily||{};
    NET.lobby={type:m.lobby.type,opts:Object.assign(defOpts(),m.lobby.opts)}; NET.room=m.room||{matches:[]}; NET.prof={}; specEnter(); return; }
  if(NET.isSpec){ specMsg(m); return; }
  if(m.t==='welcome'&&NET.wantSpec) return; /* espera quem criou trocar para espectador */
  switch(m.t){
    case 'welcome': NET.role=m.id; NET.open=true; NET.session=m.session; NET.players=m.players; NET.names=m.names||{}; NET.daily=m.daily||{};
      NET.lobby={type:m.lobby.type,opts:Object.assign(defOpts(),m.lobby.opts),w:m.lobby.w||1,ph:m.lobby.ph||1}; NET.room=m.room||{matches:[]}; NET.ser={}; NET.names[m.id]=myNick(); NET.prof={}; sendProfile(); toLobby(); SFX.win(); break;
    case 'full': toast(m.spec?'Esta sala já tem um espectador':'A sala está cheia (máximo de 6 jogadores)'); closeNet(); show('with'); break;
    case 'roster': NET.players=m.players; NET.names=m.names||{}; NET.daily=m.daily||{}; NET.teams=m.teams||{}; NET.specOn=!!m.spec; renderNames(); break;
    case 'lobbyCfg': NET.lobby={type:m.type,opts:Object.assign(defOpts(),m.opts),w:m.w||1,ph:m.ph||1,cs:m.cs||null}; if($('#lobby').classList.contains('active')) renderLobby(); break;
    case 'cfg': NET.cur=m; if(m.newSeries) NET.ser={}; beginOnline(m); break;
    case 'lobby': toLobby(); break;
    case 'room': NET.room=m.room||{matches:[]}; if($('#lobby').classList.contains('active')) renderLobby(); break;
    case 'sync': if(SH&&!SH.host) applySync(m); break;
    default: common(m);
  }
}
function common(m){
  const f=m.from;
  switch(m.t){
    case 'st': onSt(m); break;
    case 'end': onEnd(m); break;
    case 'atk': if(m.to===NET.role) receiveAttack(m.n,f); break;
    case 'pw': if(m.to===NET.role) receivePower(m.k,m.side,f); break;
    case 'blk': if(m.to===NET.role) toast(`🛡️ ${nm(f)} bloqueou seu ataque com o escudo`); break;
    case 'gold': applyGold(m.y,m.x); break;
    case 'goldWon': if(D&&!D.over){ removeGold(); toast(goldTxt(`${nm(f)} pegou o bloco dourado`)); } break;
    case 'emo': bigEmoji(m.e); break;
    case 'chat': chatRecv(m); break;
    case 'chatHist': chatHist(m); break;
    case 'prof': storeProf(m); break;
    case 'pause': setPaused(true,f||true); break;
    case 'resume': setPaused(false,f||true); break;
  }
}
function onSt(m){
  const f=m.from; if(!D||!D.live||!D.opps[f]||(m.seed&&m.seed!==D.cfg.seed)) return;
  const o=D.opps[f]; o.score=m.s; o.mini=m.m; if(m.b) o.b=m.b; o.c=m.c|0; o.k=m.k|0;
  oppSet(f,m.s,m.m); updTeamLine(); if(D.spect&&D.watch===f) renderSpect();
  if(D.teams&&!D.over){ const g=GOALS[D.o.goal]; if(g&&teamSum(D.myTeam)>=g) duelEnd('goal'); }
  const w=$('#waitList'); if(w) w.innerHTML=waitListHTML();
}
function onEnd(m){
  const f=m.from; noteEnd(f,m.info,m.seed);
  if(!D||!D.live||!D.opps[f]||(m.seed&&m.seed!==D.cfg.seed)) return;
  D.opps[f].info=m.info; oppSet(f,m.info.score,null,{done:true});
  const w=$('#waitList'); if(w) w.innerHTML=waitListHTML();
  if(!D.over){
    if(m.info.reason==='goal'){ D.goalBy=f; duelEnd('oppGoal'); }
    else if(passedOpp()) duelEnd('passed');
    else if(m.info.reason==='quit') toast(`${nm(f)} saiu da partida`);
    else if(!stillPlaying().length){ const best=Math.max(0,...D.others.map(id=>D.opps[id].info).filter(x=>x.reason!=='quit').map(x=>x.score)); $('#subTxt').textContent='Para vencer: passe '+fmtN(best); toast(`Todos terminaram. Passe ${fmtN(best)} para vencer`); }
    else toast(`${nm(f)} terminou com ${fmtN(m.info.score)}`);
  }
  if(D.over){ if(D.spect&&D.watch===f) pickWatch(); if(!stillPlaying().length||$('#end').classList.contains('show')) showDuelEnd(); }
  saveLastOnline();
}
function compareLast(theirs){
  const mine=store.get('ddb_lastOnline',null);
  if(NET.players.length!==2||!mine||!theirs||mine.id!==theirs.id||mine.compared||!mine.info||!theirs.info) return;
  const res=resOf(liveRank({me:mine.info,op:theirs.info}),'me'); addNight(res);
  toast(`Última partida: Você ${fmtN(mine.info.score)} × ${fmtN(theirs.info.score)}`);
  mine.compared=true; store.set('ddb_lastOnline',mine);
}
function saveLastOnline(){ if(D&&D.live&&D.info&&!D.cfg.npc){ store.set('ddb_lastOnline',{id:D.cfg.seed,info:D.info,compared:!!D.resolved}); } }

/* ----- resultados da sala (o criador anota e manda para todos) ----- */
function noteEnd(id,info,seed){
  const M=NET.match; if(NET.role!=='A'||!M||M.type!=='live'||M.done||!M.ids.includes(id)||(seed&&seed!==M.seed)) return;
  M.infos[id]=info;
  if(M.ids.every(x=>M.infos[x])){ M.done=true; const rank=liveRank(M.infos);
    if(M.teams){ const tr=teamResult(M.infos,M.teams), per={}; M.ids.forEach(id=>per[id]=M.infos[id].score||0); const rec=teamRec('tlive',M.label,M.teams,tr.sum,tr.winner,per,null); rec.rows.forEach((r,i)=>{ const id=Object.keys(M.teams)[i]; r.c=M.infos[id].combo||0; r.q=M.infos[id].reason==='quit'?1:0; }); recordMatch(rec); return; }
    recordMatch({type:'live',label:M.label,date:Date.now(),rows:rank.map(r=>({n:nm(r.id,false),s:r.info.score||0,p:r.place,c:r.info.combo||0,q:r.info.reason==='quit'?1:0}))}); }
}
function recordMatch(rec){ if(NET.role!=='A') return; NET.room.matches.push(rec); send({t:'room',room:NET.room}); if($('#lobby').classList.contains('active')) renderLobby(); }
function roomStats(){
  const P={}, get=n=>P[n]||(P[n]={n,w:0,pts:0,c:0,g:0}); let coopBest=null;
  NET.room.matches.forEach(m=>{
    if(m.rows){ m.rows.forEach(r=>{ const p=get(r.n); p.g++; p.pts+=r.s; p.c=Math.max(p.c,r.c||0); }); const top=m.rows.filter(r=>r.p===1); if(m.tw){ if(top.length<m.rows.length) top.forEach(r=>get(r.n).w++); } else if(top.length===1) get(top[0].n).w++; }
    else { (m.names||[]).forEach(n=>get(n).g++); if(!coopBest||m.team>coopBest.team) coopBest=m; } });
  return {list:Object.values(P).sort((a,b)=>b.w-a.w||b.pts-a.pts),coopBest};
}
function roomShareText(){
  const ms=NET.room.matches, {list,coopBest}=roomStats();
  let t=`🧱 Duelo de Blocos · resultados da sala\n${ms.length} partida${ms.length>1?'s':''}\n\n🏆 Ranking\n`;
  t+=list.map((p,i)=>`${['🥇','🥈','🥉'][i]||(i+1)+'º'} ${p.n} · ${p.w} vitória${p.w===1?'':'s'} · ${fmtN(p.pts)} pts${p.c?' · combo x'+p.c:''}`).join('\n');
  const mc=list.reduce((a,p)=>p.c>(a?a.c:0)?p:a,null); if(mc) t+=`\n\n🔥 Maior combo: ${mc.n} (x${mc.c})`;
  if(coopBest) t+=`${mc?'\n':'\n\n'}🤝 Melhor co-op: ${fmtN(coopBest.team)} pontos (${coopBest.names.join(', ')})`;
  t+='\n\n📜 Partidas\n'+ms.map((m,i)=>`${i+1}. ${m.label}: `+(m.tm?`${TEAM.az.e} ${m.tm.az.join(' + ')} ${fmtN(m.tm.sAz)} × ${fmtN(m.tm.sLa)} ${m.tm.la.join(' + ')} ${TEAM.la.e}`:m.rows?m.rows.map(r=>`${r.n} ${fmtN(r.s)}${r.q?' (saiu)':''}`).join(' × '):`${fmtN(m.team)} pontos da equipe (${m.names.join(', ')})`)).join('\n');
  const l=gameLink(); if(l) t+='\n\n'+l; return t;
}
$('#roomShare').addEventListener('click',()=>{ if(NET.room.matches.length) shareText(roomShareText()); });

/* ----- sala ----- */
function toLobby(){
  closeEnd(); $('#pauseOv').classList.remove('show'); chatFechar(); myEndOff(); cancelDrag(); D=null; SH=null; IN=null; MK=null;
  if(!NET.open){ show('home'); return; }
  NET.rematch={me:false}; if(NET.role==='A') NET.rematchReq=new Set();
  $('#lobbyStart').hidden=NET.role!=='A'; $('#lobbyGuest').hidden=NET.role==='A';
  $('#nickIn').value=myNick();
  sendLobby(); renderLobby(); show('lobby');
  if(!myNick()) toast('Escolha um apelido para todos saberem quem é você');
}
/* times: cada um toca no time que quer; quem não escolher vai para o time menor ao começar */
function teamsFinal(){ const T={}, c={az:0,la:0}; NET.players.forEach(id=>{ const k=NET.teams&&NET.teams[id]; if(k){ T[id]=k; c[k]++; } });
  NET.players.forEach(id=>{ if(!T[id]){ const k=c.az<=c.la?'az':'la'; T[id]=k; c[k]++; } }); return T; }
function renderTeamBox(){
  const box=$('#teamBox'), on=isTeamType(NET.lobby.type); box.hidden=!on; if(!on) return;
  const T=NET.teams||{}, me=NET.role, free=NET.players.filter(id=>!T[id]);
  box.innerHTML=`<label class="muted" style="font-size:13px">Escolha seu time</label><div class="teams">${['az','la'].map(k=>`<button type="button" class="teamBtn ${T[me]===k?'sel':''}" data-t="${k}" style="--tc:${TEAM[k].c}"><b>${TEAM[k].e} ${TEAM[k].n}</b>${NET.players.filter(id=>T[id]===k).map(id=>`<span>${avatarHTML(id,18)}${esc(nm(id))}</span>`).join('')||'<span class="muted">ninguém ainda</span>'}</button>`).join('')}</div>`+(free.length?`<p class="muted">Sem time: ${free.map(id=>esc(nm(id))).join(', ')}. Vão para o time menor ao começar.</p>`:'');
  box.querySelectorAll('.teamBtn').forEach(b=>b.addEventListener('click',()=>pickTeam(b.dataset.t)));
}
function pickTeam(k){ NET.teams=NET.teams||{}; NET.teams[NET.role]=k; if(NET.role==='A') sendRoster(); else { send({t:'team',v:k}); renderLobby(); } }
function sendLobby(){ if(NET.role==='A') send({t:'lobbyCfg',type:NET.lobby.type,opts:NET.lobby.opts,w:NET.lobby.w||1,ph:NET.lobby.ph||1,cs:NET.lobby.type==='camp'?campLoad('group').stars:null}); }
let nickT=0;
$('#nickIn').addEventListener('input',()=>{ clearTimeout(nickT); nickT=setTimeout(()=>{
  const v=$('#nickIn').value.trim().slice(0,16); store.set('ddb_nick',v); if(!NET.open) return;
  NET.names[NET.role]=v; if(NET.role==='A') sendRoster(); else { send({t:'nick',name:v}); renderLobby(); } },350); });
function renderLobby(){
  renderNight();
  const host=NET.role==='A', ids=NET.players, n=ids.length, L=NET.lobby;
  $('#lobbyConn').textContent=(host?'Você criou a sala':'Você entrou na sala')+` · ${n} jogador${n>1?'es':''}`;
  $('#lobbyPlayers').innerHTML=ids.map(id=>`<span>${avatarHTML(id,20)}${id==='A'?'👑 ':''}${esc(nm(id,false))}${id===NET.role?' (você)':''}</span>`).join('');
  $('#lobbyAdd').hidden=!host||n>=MAXP; $('#lobbyAdd').classList.toggle('primary',n<2); $('#lobbySpec').hidden=!host||!!NET.peers.S;
  $('#lobbySimRow').hidden=!host||!devOn(); $('#lobbySim').hidden=n>=MAXP; $('#lobbySimDel').hidden=!SIMS.length;
  if(NET.specOn||NET.peers.S) $('#lobbyPlayers').insertAdjacentHTML('beforeend','<span>📺 Espectador</span>');
  const tk=diaBR(), fmtD=v=>v!=null?fmtN(v):'–';
  $('#lobbyDaily').innerHTML=ids.map(id=>{ const d=id===NET.role?myDaily():(NET.daily[id]&&NET.daily[id].key===tk?NET.daily[id]:{}); return `<div class="kv"><span>${esc(nm(id))}</span><b>${fmtD(d.t)}</b></div>`; }).join('')+'<p class="muted">Pontos no Desafio do dia de hoje. Traço quer dizer que ainda não jogou.</p>';
  $('#lobbyCard').classList.toggle('ro',!host);
  /* estilos de jogo agrupados: individual, em times e em cooperação */
  const tc={az:0,la:0}; Object.values(teamsFinal()).forEach(k=>tc[k]++);
  $('#typeSeg').innerHTML=TYPE_GROUPS.map(([g,ks])=>`<div class="tgroup"><small>${g}</small><div class="seg tpics">${ks.map(k=>`<button type="button" data-k="${k}" class="${L.type===k?'sel':''}">${modePic(k,n,tc)}<span>${TYPES[k]}</span></button>`).join('')}</div></div>`).join('');
  if(host) $$('#typeSeg button').forEach(b=>b.addEventListener('click',()=>{ L.type=b.dataset.k; sendLobby(); renderLobby(); }));
  const [lo,hi]=LIMITS[L.type]; let warn=n<Math.max(2,lo)?'Chame mais alguém: precisa de pelo menos 2 jogadores.':n>hi?`${TYPES[L.type]} aceita até ${hi} jogadores.`:'';
  if(!warn&&isTeamType(L.type)){ const T=teamsFinal(), c={az:0,la:0}; Object.values(T).forEach(k=>c[k]++); if(!c.az||!c.la) warn='Cada time precisa de pelo menos 1 jogador.'; else if(L.type==='tsplit'&&(c.az>3||c.la>3)) warn='No tabuleiro dividido, cada time pode ter até 3 jogadores.'; }
  renderTeamBox();
  $('#typeHint').innerHTML=`<span class="tbig">${modePic(L.type,n,tc)}</span>`+esc(TYPE_HINT[L.type])+(warn?`<br><b class="err">${esc(warn)}</b>`:'');
  /* aba Sala: o estilo que quem criou escolheu, com a explicação e (nos times) a escolha do time */
  $('#salaModeT').textContent=TYPES[L.type]; $('#salaModeHint').innerHTML=`<span class="tbig">${modePic(L.type,n,tc)}</span><p class="muted">${esc(TYPE_HINT[L.type])}</p>`;
  $('#lobbyStart').disabled=!!warn; $('#lobbyWarn').hidden=!warn; $('#lobbyWarn').textContent=warn||'';
  if(L.type==='camp'){
    const st=host?campLoad('group'):{stars:L.cs||{},att:{}}; L.w=L.w||1; if(!CWORLDS[L.w-1]||!campWOpen(st,L.w)) L.w=1; if(!campOpen(st,L.w,L.ph||1)) L.ph=1;
    $('#lobbyOpts').innerHTML=`<div class="optrow"><label>Mundo e fase do grupo · ${campTotal(st)} ⭐</label><div class="wtabs">${campWTabs(st,L.w)}</div><div class="campmap campsel">${campNodes(st,L.w)}</div></div>`;
    $$('#lobbyOpts .wtab').forEach(b=>{ if(!host||b.classList.contains('soon')){ b.style.pointerEvents='none'; return; } b.addEventListener('click',()=>{ if(b.classList.contains('locked')){ toast(campWLockMsg(+b.dataset.w)); return; } L.w=+b.dataset.w; L.ph=1; sendLobby(); renderLobby(); }); });
    $$('#lobbyOpts .cnode').forEach(b=>{ b.classList.toggle('sel',+b.dataset.ph===(L.ph||1)); if(host) b.addEventListener('click',()=>{ L.ph=+b.dataset.ph; sendLobby(); renderLobby(); }); else b.style.pointerEvents='none'; });
    $('#lobbyOpts').firstElementChild.classList.add('opane'); $('#lobbyOpts').firstElementChild.dataset.pane='fase';
  } else buildOpts($('#lobbyOpts'),L.opts,L.type,host?{onChange:sendLobby}:{ro:true});
  lobbyTabs();
  const ms=NET.room.matches; $('#roomCard').hidden=!ms.length;
  if(ms.length){ const {list}=roomStats(); $('#roomList').innerHTML=`<p class="muted">${ms.length} partida${ms.length>1?'s':''} nesta sala</p>`+list.slice(0,6).map((p,i)=>`<div class="kv"><span>${i+1}º ${esc(p.n)}</span><b>${p.w} V · ${fmtN(p.pts)}</b></div>`).join(''); }
}
/* abas da sala (Sala, Partida, Placar) e sub-abas da partida (Estilo, Regras/Fase, Modificadores — as opções "Conectados" ficam dentro de Modificadores) */
const TYPE_GROUPS=[['Individual',['live','versus']],['Em times',['tlive','tsplit']],['Cooperação',['coop','halves','camp']]];
const OPT_TABS=[['estilo','Estilo de jogo'],['fase','Fase'],['regras','Regras'],['mods','Modificadores']];
let LTAB='partida', OTAB='estilo';
function lobbyTabs(){
  $$('#lobbyTabs button').forEach(b=>b.classList.toggle('sel',b.dataset.tab===LTAB));
  $$('#lobby .ltab').forEach(d=>d.hidden=d.dataset.tab!==LTAB);
  const panes=[...$$('#lobbyCard .opane')].filter(p=>p.innerHTML.trim()), have=new Set(panes.map(p=>p.dataset.pane));
  if(!have.has(OTAB)) OTAB='estilo';
  $('#optTabs').innerHTML=OPT_TABS.filter(([k])=>have.has(k)).map(([k,n])=>`<button type="button" data-p="${k}" class="${k===OTAB?'sel':''}">${n}</button>`).join('');
  $$('#lobbyCard .opane').forEach(p=>p.hidden=p.dataset.pane!==OTAB);
  $$('#optTabs button').forEach(b=>b.addEventListener('click',()=>{ OTAB=b.dataset.p; lobbyTabs(); }));
  chatNaAba();
}
$$('#lobbyTabs button').forEach(b=>b.addEventListener('click',()=>{ LTAB=b.dataset.tab; lobbyTabs(); }));
$('#lobbyStart').addEventListener('click',()=>{ ac(); hostStart(false); });
$('#lobbyLeave').addEventListener('click',()=>{ closeNet(); show('with'); });
$('#lobbySet').addEventListener('click',()=>openSettings('lobby'));
$('#lobbyAdd').addEventListener('click',()=>{ if(NET.role==='A') hostNewOffer(); });
$('#lobbySpec').addEventListener('click',()=>{ if(NET.role==='A') hostNewOffer(true); });
function hostStart(rematch){
  const L=NET.lobby, ids=NET.players.slice(), [lo,hi]=LIMITS[L.type];
  if(ids.length<lo||ids.length>hi){ toast(ids.length<lo?'Precisa de pelo menos 2 jogadores':`${TYPES[L.type]} aceita até ${hi} jogadores`); return; }
  NET.round++;
  let teams=null;
  if(isTeamType(L.type)){ teams=teamsFinal(); const c={az:0,la:0}; Object.values(teams).forEach(k=>c[k]++); if(!c.az||!c.la){ toast('Cada time precisa de pelo menos 1 jogador'); NET.round--; return; } if(L.type==='tsplit'&&(c.az>3||c.la>3)){ toast('No tabuleiro dividido, até 3 por time'); NET.round--; return; } NET.teams=teams; sendRoster(); }
  const size=L.type==='halves'&&ids.length>2?10:L.type==='tsplit'&&teams&&Math.max(...['az','la'].map(k=>Object.values(teams).filter(x=>x===k).length))===3?9:8;
  const cfg={t:'cfg',type:L.type,opts:{...L.opts},seed:'N|'+NET.session+'|'+NET.round,round:NET.round,newSeries:!rematch,hc:null,players:ids,size,teams};
  if(L.type==='camp'){ const w=L.w||1, ph=L.ph||1, def=CWD(w).phases[ph-1], st=campLoad('group'), k=ck(w,ph); st.att[k]=(st.att[k]||0)+1; campSave('group',st);
    cfg.opts=campOpts(def); cfg.size=ids.length>2&&def.setup!=='puzzle'?10:8; cfg.camp={w,ph,helps:campHelps(st),slot:'group',att:st.att[k]}; }
  if(!rematch) NET.ser={};
  if(L.type==='live'&&L.opts.handicap&&rematch&&NET.lastWinner) cfg.hc=NET.lastWinner;
  NET.cur=cfg; send(cfg); beginOnline(cfg);
}
function beginOnline(cfg){
  NET.rematch={me:false}; NET.rematchReq=new Set(); closeEnd(); $('#pauseOv').classList.remove('show');
  NET.match={type:cfg.type==='tlive'?'live':cfg.type,seed:cfg.seed,ids:cfg.players.slice(),infos:{},label:TYPES[cfg.type]+' · R'+cfg.round,done:false,teams:cfg.teams||null};
  if(cfg.type==='live'||cfg.type==='tlive') startDuel({type:'live',opts:cfg.opts,seed:cfg.seed,label:TYPES[cfg.type]+' · R'+cfg.round,handicapMe:cfg.type==='live'&&cfg.hc===NET.role,players:cfg.players,teams:cfg.teams||null});
  else startShared(cfg);
}
function requestRematch(){
  if(!NET.open){ toast('Sem conexão'); return; }
  NET.rematch.me=true; send({t:'rematch'}); toast('Pedido de revanche enviado para quem criou a sala'); refreshEnd();
}
function refreshEnd(){ if(!$('#end').classList.contains('show')) return; if(D&&D.live&&D.info) showDuelEnd(); else if(SH&&SH.overInfo) showSharedEnd(SH.overInfo); }
function seriesN(){ return SERIES_N[(NET.cur&&NET.cur.opts.series)||0]||1; }
function seriesAdd(winner){ const n=seriesN(); if(n<2) return; const need=Math.ceil(n/2); if(Object.values(NET.ser).some(v=>v>=need)) NET.ser={}; if(winner) NET.ser[winner]=(NET.ser[winner]||0)+1; }
function seriesLine(){
  const n=seriesN(); if(n<2) return '';
  if(NET.cur&&NET.cur.teams){ const need=Math.ceil(n/2), ch=['az','la'].find(k=>(NET.ser[k]||0)>=need); return `<p class="muted">${ch?TEAM[ch].n+' venceu a série! ':SERIES_L[NET.cur.opts.series]+': '}${TEAM.az.n} ${NET.ser.az||0} · ${TEAM.la.n} ${NET.ser.la||0}</p>`; } const need=Math.ceil(n/2), ids=(NET.cur&&NET.cur.players)||[], champ=ids.find(id=>(NET.ser[id]||0)>=need);
  const txt=ids.map(id=>`${nm(id)} ${NET.ser[id]||0}`).join(' · ');
  return `<p class="muted">${champ?(champ===NET.role?'Você venceu a série! ':esc(nm(champ))+' venceu a série! '):SERIES_L[NET.cur.opts.series]+': '}${esc(txt)}</p>`;
}
function liveRecord(res,me,rank){
  addNight(res); const top=rank.filter(r=>r.place===1), w=top.length===1?top[0].id:null; seriesAdd(w); NET.lastWinner=w;
  addHist({date:Date.now(),kind:'live',label:'Duelo ao vivo · '+PLAYS[D.o.play]+(rank.length>2?` · ${rank.length} jogadores`:''),code:'',score:me.score,lines:me.lines,combo:me.combo,result:res});
  store.set('ddb_lastOnline',{id:D.cfg.seed,info:me,compared:true});
}
