'use strict';
/* SALA POR LINK: um link só para a sala inteira (até 6), que vale enquanto ela estiver aberta. Os códigos da conexão passam pelo Supabase. Banco: supabase/salas.sql */
/* A conexão em si continua direta entre os aparelhos (a mesma do QR). Quem criou a sala deixa sempre um código esperando o próximo que abrir o link (SL.pend);
   quando alguém responde, conecta essa pessoa e põe um código novo (nova_vaga). Se o banco ainda não tem o link da sala, cai no convite antigo de uma pessoa (slSendUma). */
let slPoll=0;
const SL={id:null,chave:null,pend:null,n:0,visto:0,busy:false,abrindo:false,tv:false}; /* tv: a tela aberta é a de conectar o espectador */
const slFail='Não conectou. Algumas redes de celular (4G/5G) bloqueiam a conexão direta: tentem com os dois no Wi-Fi, ou usem o QR estando juntos.';
function slLink(id){ return /^https?:/.test(location.href)?location.origin+location.pathname+'?s='+id:''; }
const slDorme=ms=>new Promise(r=>setTimeout(r,ms));
const slSemFuncao=e=>/PGRST202|404|Could not find the function/.test(String(e&&e.message));
function slMata(p){ if(p){ try{ p.dc&&p.dc.close(); }catch(e){} try{ p.pc.close(); }catch(e){} } }
function slStat(){
  const st=$('#pLinkStat'), b=$('#pLinkSend'); if(!st) return;
  if(SL.tv){ $('#pLinkStep').textContent='🔗 Ou abra o link da sala no computador';
    b.textContent='Mandar link da sala';
    $('#pLinkObs').textContent='Mande para você mesmo (no WhatsApp Web, por exemplo), abra no computador ligado na TV e escolha "📺 Assistir". Também dá para digitar o link no navegador.';
    st.innerHTML=''; if(SL.id){ st.textContent='✅ Link da sala: '; const l=document.createElement('b'); l.setAttribute('data-notr',''); l.style.userSelect='all'; l.style.wordBreak='break-all'; l.textContent=slLink(SL.id); st.appendChild(l); }
    return; }
  $('#pLinkStep').textContent='🌍 Alguém está longe? Mande o link da sala';
  $('#pLinkObs').textContent='O mesmo link serve para todo mundo (até 6 na sala) enquanto ela estiver aberta. Estão juntos? Use o QR abaixo.';
  b.textContent=SL.id?'Mandar o link da sala de novo':'Mandar link da sala no WhatsApp';
  st.textContent=SL.id?'✅ Link da sala ligado: quem abrir entra sozinho. Pode voltar para a sala e esperar lá.':'';
}
/* uma conexão nova esperando alguém; quando abre, vira jogador como no QR */
async function slOferta(){
  const pc=newPC(), pend={pc,dc:null,spec:false};
  const dc=pc.createDataChannel('duelo',{ordered:true}); pend.dc=dc; dc.onopen=()=>hostPeerOpen(pend);
  try{ await pc.setLocalDescription(await pc.createOffer()); await waitIce(pc); return {pend,code:await encodeSig({t:'o',sdp:slimSdp(pc.localDescription.sdp)})}; }
  catch(e){ slMata(pend); throw e; }
}
const slNaSala=()=>NET.role==='A'&&NET.open;
async function slAbrir(){
  const {pend,code}=await slOferta();
  let r; try{ r=await rkFetch('rpc/abrir_sala',{body:{p_oferta:code}}); }catch(e){ slMata(pend); throw e; }
  if(!slNaSala()){ slMata(pend); rkFetch('rpc/fechar_sala',{body:{p_id:r.id,p_chave:r.chave}}).catch(()=>{}); throw new Error('saiu'); }
  Object.assign(SL,{id:r.id,chave:r.chave,pend,n:0,visto:Date.now()});
  clearInterval(slPoll); slPoll=setInterval(slTick,3000);
}
/* a cada 3 s: alguém respondeu? conecta e põe código novo. Senão, de minuto em minuto avisa que a sala continua aberta */
async function slTick(){
  if(SL.busy||!SL.id) return; if(!slNaSala()){ slFechar(); return; }
  SL.busy=true;
  try{
    const s=(await rkFetch(`salas?id=eq.${SL.id}&select=n,resposta`))[0];
    if(!s){ slFechar(); slStat(); return; } /* a sala sumiu do banco: o link deixa de valer */
    if(s.resposta&&s.n===SL.n&&SL.pend){
      const p=SL.pend; SL.pend=null;
      try{ const m=await decodeSig(s.resposta); if(m.t==='a') await p.pc.setRemoteDescription({type:'answer',sdp:m.sdp}); }catch(e){}
      /* se em 1 minuto não virou jogador, fecha */
      setTimeout(()=>{ if(!Object.values(NET.peers).some(x=>x.pc===p.pc)) slMata(p); },60000);
    }
    if(!SL.pend){ const {pend,code}=await slOferta(); if(!SL.id){ slMata(pend); return; }
      try{ SL.n=await rkFetch('rpc/nova_vaga',{body:{p_id:SL.id,p_chave:SL.chave,p_oferta:code}}); SL.pend=pend; SL.visto=Date.now(); }catch(e){ slMata(pend); throw e; } }
    else if(Date.now()-SL.visto>60000){ await rkFetch('rpc/sala_viva',{body:{p_id:SL.id,p_chave:SL.chave}}); SL.visto=Date.now(); }
  }catch(e){} finally{ SL.busy=false; }
}
/* a sala fechou (closeNet): apaga o link */
function slFechar(){
  clearInterval(slPoll); if(SL.id) rkFetch('rpc/fechar_sala',{body:{p_id:SL.id,p_chave:SL.chave}}).catch(()=>{});
  slMata(SL.pend); Object.assign(SL,{id:null,chave:null,pend:null,n:0});
}
/* botão "Mandar link da sala": cria o link (na primeira vez) e manda */
async function slSend(){
  const st=$('#pLinkStat'); if(!slNaSala()){ st.textContent='Volte e crie a sala de novo.'; return; }
  if(SL.abrindo) return;
  if(!SL.id){ SL.abrindo=true; st.textContent='Preparando o link da sala…';
    try{ await slAbrir(); }catch(e){ SL.abrindo=false; if(slSemFuncao(e)&&!SL.tv){ slSendUma(); return; } st.textContent=e.message==='saiu'?'':'Sem internet agora. Tente de novo.'; return; }
    SL.abrindo=false; }
  shareText(`🎮 Entre na minha sala do Duelo de Blocos! Toque no link para jogar ou para assistir na TV (serve para todo mundo enquanto a sala estiver aberta):\n${slLink(SL.id)}`);
  slStat();
}
/* convite antigo, de uma pessoa só (enquanto o banco não tem o link da sala) */
async function slSendUma(){
  const pend=NET.pend, st=$('#pLinkStat'); if(!pend){ st.textContent='Volte e crie a sala de novo.'; return; }
  st.textContent='Preparando o convite…';
  for(let i=0;i<40&&!$('#pHostCode').value;i++) await slDorme(250);
  const code=$('#pHostCode').value; if(!code||NET.pend!==pend){ st.textContent='Ainda preparando. Tente de novo em alguns segundos.'; return; }
  let id; try{ id=await rkFetch('rpc/criar_sala',{body:{p_oferta:code}}); }catch(e){ st.textContent='Sem internet agora. Tente de novo.'; return; }
  shareText(`🎮 Entre na minha sala do Duelo de Blocos! Toque no link (vale para uma pessoa):\n${slLink(id)}`);
  st.textContent='⏳ Esperando a pessoa abrir o link… (pode deixar esta tela aberta)';
  const t0=Date.now(), iv=setInterval(()=>{
    if(NET.pend!==pend||Date.now()-t0>15*60000){ clearInterval(iv); return; }
    rkFetch(`salas?id=eq.${id}&select=resposta`).then(r=>{ const a=r&&r[0]&&r[0].resposta; if(!a||NET.pend!==pend) return;
      clearInterval(iv); st.textContent='A pessoa abriu o link. Conectando…'; hostAccept(a);
      setTimeout(()=>{ if(NET.pend===pend) st.textContent=slFail; },25000); }).catch(()=>{});
  },2000);
}
/* quem abriu o link: primeiro escolhe se vai jogar ou assistir (espectador: entra como jogador e, no "hello" com spec, quem criou troca para espectador).
   Link com &tv (de antes) vai direto para assistir */
function slFromLink(){
  let id=null, tv=false; try{ const q=new URLSearchParams(location.search); id=q.get('s'); tv=q.has('tv'); }catch(e){}
  if(!id||!/^[0-9a-f]{8}$/.test(id)) return;
  try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
  if(!rtcOk()) return;
  if(tv){ slEntrar(id,true); return; }
  const ov=$('#slOv'), vai=v=>{ ov.classList.remove('show'); if(v!=null) slEntrar(id,v); };
  $('#slJogar').onclick=()=>vai(false); $('#slAssistir').onclick=()=>vai(true); $('#slNao').onclick=()=>vai(null);
  ov.classList.add('show');
}
/* pega o código da vez, gera a resposta e devolve pelo Supabase. Se outra pessoa respondeu no mesmo instante, espera o código seguinte */
async function slEntrar(id,tv){
  guestStart(tv); const st=()=>$('#pGuestStatus'), semNet='Sem internet agora. Abra o link de novo daqui a pouco.';
  st().textContent='Abrindo o convite…';
  for(let vez=0;vez<30;vez++){
    if(!$('#connect').classList.contains('active')||NET.open) return; /* desistiu ou já entrou */
    let s; try{ s=(await rkFetch(`salas?id=eq.${id}&select=oferta,resposta,n`))[0]; }catch(e){ st().textContent=semNet; return; }
    if(!s){ st().textContent='Essa sala já foi fechada. Peça um link novo.'; return; }
    if(s.resposta){ st().textContent='Outra pessoa está entrando agora. Esperando a sua vez…'; await slDorme(2500); continue; }
    $('#pGuestCode').value=''; await guestUse(s.oferta);
    const code=$('#pGuestCode').value; if(!code) return; /* guestUse já mostrou o erro */
    $('#pGuestStep2').textContent='Conectando pelo link…';
    let r; try{ r=await rkFetch('rpc/responder_vaga',{body:{p_id:id,p_n:s.n||0,p_resposta:code}}); }
    catch(e){ if(!slSemFuncao(e)){ st().textContent=semNet; return; }
      try{ await rkFetch('rpc/responder_sala',{body:{p_id:id,p_resposta:code}}); r='ok'; }catch(e2){ st().textContent=semNet; return; } }
    if(r==='fechada'){ closeNet(); st().textContent='Essa sala já foi fechada (ou o convite já foi usado). Peça um link novo.'; return; }
    if(r==='ok'){ st().textContent='Resposta enviada. Conectando…';
      setTimeout(()=>{ if(!NET.open&&$('#connect').classList.contains('active')) st().textContent=slFail; },30000); return; }
    st().textContent='Outra pessoa está entrando agora. Esperando a sua vez…'; await slDorme(2500);
  }
  closeNet(); st().textContent='A sala não respondeu. Peça para quem criou abrir o jogo e tente o link de novo.';
}
$('#pLinkSend').addEventListener('click',slSend);
if(rkOn()) setTimeout(slFromLink,600);
