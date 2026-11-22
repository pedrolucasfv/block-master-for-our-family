'use strict';
/* CHAT DA SALA conectada: mensagens só na memória dos aparelhos da sala (nada vai para servidor nem fica guardado); somem quando a sala fecha */
/* Na sala, o chat fica fixo na aba "Sala", embaixo dos jogadores (#chatHome). Na partida, o 💬 da barra de emojis abre o mesmo chat numa janela (#chatOv):
   o miolo (#chatBody) muda de lugar entre os dois. */
/* Vai pela própria conexão da sala: {t:'chat',x:texto}. Quem criou a sala carimba quem mandou e repassa para todos (hostMsg).
   Quem criou guarda a conversa enquanto a sala existir e manda para quem entra depois ({t:'chatHist'}, em hostMsg 'hello'). */
const CHAT=[], CHAT_MAX=200, CHAT_RAP=['👍','Bora!','Mais uma?','Boa jogada!','Já volto','Kkkkk'];
let chatNovas=0;
const chatNaSala=()=>$('#lobby').classList.contains('active')&&LTAB==='sala';
const chatAberto=()=>$('#chatOv').classList.contains('show')||chatNaSala();
function chatLimpar(){ CHAT.length=0; chatNovas=0; chatBadge(); chatFechar(); chatRender(); }
function chatBadge(){ $$('.chatbadge').forEach(b=>{ b.textContent=chatNovas>9?'9+':chatNovas||''; b.hidden=!chatNovas; }); }
/* botão para a barra de emojis da partida (emoBtns) */
function chatBtn(){ return NET.open&&!NET.isSpec?`<button type="button" class="emo chatb" aria-label="Chat da sala">💬<i class="chatbadge"${chatNovas?'':' hidden'}>${chatNovas||''}</i></button>`:''; }
function chatEnviar(txt){
  txt=String(txt||'').replace(/\s+/g,' ').trim().slice(0,CHAT_MAX); if(!txt||!NET.open||NET.isSpec) return false;
  send({t:'chat',x:txt}); chatRecv({t:'chat',x:txt,from:NET.role}); return true;
}
function chatRecv(m){
  const txt=String(m.x||'').slice(0,CHAT_MAX); if(!txt) return;
  const meu=m.from===NET.role; CHAT.push({from:m.from,n:NET.names[m.from]||(meu?myNick():'')||nm(m.from),x:txt}); if(CHAT.length>100) CHAT.shift(); /* n: nome de verdade (vai no histórico de quem entrar depois) */
  if(chatAberto()){ chatRender(); return; }
  if(!meu){ chatNovas++; chatBadge(); toast(`💬 ${nm(m.from)}: ${txt.length>60?txt.slice(0,60)+'…':txt}`); try{ SFX.pick(); }catch(e){} }
}
/* quem criou a sala: manda a conversa até agora para quem acabou de entrar */
function chatHistPara(id){ if(NET.role==='A'&&CHAT.length) sendTo(id,{t:'chatHist',l:CHAT.map(c=>({n:c.n,x:c.x}))}); }
/* quem entrou: recebe a conversa de antes (aparece com um número no 💬, sem aviso) */
function chatHist(m){
  if(NET.role==='A'||!Array.isArray(m.l)) return;
  const l=m.l.slice(-100).map(c=>({from:null,h:true,n:String(c.n||'?').slice(0,16),x:String(c.x||'').slice(0,CHAT_MAX)})).filter(c=>c.x); if(!l.length) return;
  CHAT.splice(0,CHAT.length,...l,...CHAT.filter(c=>!c.h)); if(chatAberto()) chatRender(); else { chatNovas+=l.length; chatBadge(); }
}
function chatRender(){
  const list=$('#chatList');
  const ult=CHAT.map(c=>!!c.h).lastIndexOf(true);
  list.innerHTML=CHAT.length?CHAT.map((c,i)=>{ const meu=!c.h&&c.from===NET.role; return `<div class="chatmsg${meu?' meu':''}"><b>${esc(meu?'Você':c.n)}</b><span>${esc(c.x)}</span></div>`+(i===ult?'<p class="muted tcenter chatdiv">⬆ antes de você entrar</p>':''); }).join('')
    :'<p class="muted tcenter">Ninguém falou nada ainda. Mande um oi!</p>';
  list.scrollTop=list.scrollHeight;
}
function chatAbrir(){ if(!NET.open) return; chatNovas=0; chatBadge(); $('#toast').classList.remove('show'); $('.chatpanel').appendChild($('#chatBody')); $('#chatOv').classList.add('show'); chatRender(); }
function chatFechar(){ $('#chatOv').classList.remove('show'); $('#chatHome').appendChild($('#chatBody')); }
/* aba "Sala" à vista: a conversa está aberta ali (zera o número de novas) */
function chatNaAba(){ if(!chatNaSala()) return; chatFechar(); chatNovas=0; chatBadge(); chatRender(); }
chatFechar();
$('#chatRap').innerHTML=CHAT_RAP.map(t=>`<button type="button" class="chip" data-x="${esc(t)}">${esc(t)}</button>`).join('');
$('#chatRap').addEventListener('click',e=>{ const b=e.target.closest('[data-x]'); if(b) chatEnviar(b.dataset.x); });
$('#chatForm').addEventListener('submit',e=>{ e.preventDefault(); const i=$('#chatIn'); if(chatEnviar(i.value)) i.value=''; i.focus(); });
$('#chatClose').addEventListener('click',chatFechar);
$('#chatOv').addEventListener('click',e=>{ if(e.target.id==='chatOv') chatFechar(); });
document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('.chatb')) chatAbrir(); });
