'use strict';
/* SALA POR LINK: troca os códigos da conexão (oferta e resposta) pelo Supabase, para entrar na sala de longe sem ler QR. Banco: supabase/salas.sql */
/* A conexão em si continua direta entre os aparelhos (a mesma do QR); o Supabase só guarda os dois códigos. */
let slPoll=0;
const slFail='Não conectou. Algumas redes de celular (4G/5G) bloqueiam a conexão direta: tentem com os dois no Wi-Fi, ou usem o QR estando juntos.';
function slLink(id){ return /^https?:/.test(location.href)?location.origin+location.pathname+'?s='+id:''; }
/* quem criou a sala: espera o código ficar pronto, guarda no Supabase, manda o link e fica esperando a resposta */
async function slSend(){
  const pend=NET.pend, st=$('#pLinkStat'); if(!pend){ st.textContent='Volte e crie a sala de novo.'; return; }
  st.textContent='Preparando o convite…';
  for(let i=0;i<40&&!$('#pHostCode').value;i++) await new Promise(r=>setTimeout(r,250));
  const code=$('#pHostCode').value; if(!code||NET.pend!==pend){ st.textContent='Ainda preparando. Tente de novo em alguns segundos.'; return; }
  let id; try{ id=await rkFetch('rpc/criar_sala',{body:{p_oferta:code}}); }catch(e){ st.textContent='Sem internet agora. Tente de novo.'; return; }
  shareText(`🎮 Entre na minha sala do Duelo de Blocos! Toque no link (vale para uma pessoa):\n${slLink(id)}`);
  st.textContent='⏳ Esperando a pessoa abrir o link… (pode deixar esta tela aberta)';
  clearInterval(slPoll); const t0=Date.now();
  slPoll=setInterval(()=>{
    if(NET.pend!==pend||Date.now()-t0>15*60000){ clearInterval(slPoll); return; }
    rkFetch(`salas?id=eq.${id}&select=resposta`).then(r=>{ const a=r&&r[0]&&r[0].resposta; if(!a||NET.pend!==pend) return;
      clearInterval(slPoll); st.textContent='A pessoa abriu o link. Conectando…'; hostAccept(a);
      setTimeout(()=>{ if(NET.pend===pend) st.textContent=slFail; },25000); }).catch(()=>{});
  },2000);
}
/* quem abriu o link: pega o código da sala, gera a resposta e devolve pelo Supabase */
async function slFromLink(){
  let id=null; try{ id=new URLSearchParams(location.search).get('s'); }catch(e){}
  if(!id||!/^[0-9a-f]{8}$/.test(id)) return;
  try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
  if(!rtcOk()) return;
  guestStart(false); const st=$('#pGuestStatus'); st.textContent='Abrindo o convite…';
  let s; try{ s=(await rkFetch(`salas?id=eq.${id}&select=oferta,resposta`))[0]; }catch(e){ st.textContent='Sem internet agora. Abra o link de novo daqui a pouco.'; return; }
  if(!s){ st.textContent='Esse convite expirou. Peça um link novo.'; return; }
  if(s.resposta){ st.textContent='Esse convite já foi usado por outra pessoa. Peça um link novo.'; return; }
  await guestUse(s.oferta);
  const code=$('#pGuestCode').value; if(!code) return; /* guestUse já mostrou o erro */
  $('#pGuestStep2').textContent='Conectando pelo link…';
  try{ await rkFetch('rpc/responder_sala',{body:{p_id:id,p_resposta:code}}); }catch(e){ st.textContent='Sem internet agora. Abra o link de novo daqui a pouco.'; return; }
  $('#pGuestStatus').textContent='Resposta enviada. Conectando…';
  setTimeout(()=>{ if(!NET.open&&$('#connect').classList.contains('active')) $('#pGuestStatus').textContent=slFail; },30000);
}
$('#pLinkSend').addEventListener('click',slSend);
if(rkOn()) setTimeout(slFromLink,600);
