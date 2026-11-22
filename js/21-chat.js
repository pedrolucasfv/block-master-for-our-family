'use strict';
/* CHAT DA SALA conectada: mensagens só na memória dos aparelhos da sala (nada vai para servidor nem fica guardado); somem quando a sala fecha */
/* Vai pela própria conexão da sala: {t:'chat',x:texto}. Quem criou a sala carimba quem mandou e repassa para todos (hostMsg). */
const CHAT=[], CHAT_MAX=200, CHAT_RAP=['👍','Bora!','Mais uma?','Boa jogada!','Já volto','Kkkkk'];
let chatNovas=0;
const chatAberto=()=>$('#chatOv').classList.contains('show');
function chatLimpar(){ CHAT.length=0; chatNovas=0; chatBadge(); $('#chatOv').classList.remove('show'); }
function chatBadge(){ $$('.chatbadge').forEach(b=>{ b.textContent=chatNovas>9?'9+':chatNovas||''; b.hidden=!chatNovas; }); }
/* botão para a barra de emojis da partida (emoBtns) */
function chatBtn(){ return NET.open&&!NET.isSpec?`<button type="button" class="emo chatb" aria-label="Chat da sala">💬<i class="chatbadge"${chatNovas?'':' hidden'}>${chatNovas||''}</i></button>`:''; }
function chatEnviar(txt){
  txt=String(txt||'').replace(/\s+/g,' ').trim().slice(0,CHAT_MAX); if(!txt||!NET.open||NET.isSpec) return false;
  send({t:'chat',x:txt}); chatRecv({t:'chat',x:txt,from:NET.role}); return true;
}
function chatRecv(m){
  const txt=String(m.x||'').slice(0,CHAT_MAX); if(!txt) return;
  const meu=m.from===NET.role; CHAT.push({from:m.from,nome:meu?'Você':nm(m.from),x:txt,quando:Date.now()}); if(CHAT.length>100) CHAT.shift();
  if(chatAberto()){ chatRender(); return; }
  if(!meu){ chatNovas++; chatBadge(); toast(`💬 ${nm(m.from)}: ${txt.length>60?txt.slice(0,60)+'…':txt}`); try{ SFX.pick(); }catch(e){} }
}
function chatRender(){
  const list=$('#chatList');
  list.innerHTML=CHAT.length?CHAT.map(c=>`<div class="chatmsg${c.from===NET.role?' meu':''}"><b>${esc(c.nome)}</b><span>${esc(c.x)}</span></div>`).join('')
    :'<p class="muted tcenter">Ninguém falou nada ainda. Mande um oi!</p>';
  list.scrollTop=list.scrollHeight;
}
function chatAbrir(){ if(!NET.open) return; chatNovas=0; chatBadge(); $('#toast').classList.remove('show'); $('#chatOv').classList.add('show'); chatRender(); }
function chatFechar(){ $('#chatOv').classList.remove('show'); }
$('#chatRap').innerHTML=CHAT_RAP.map(t=>`<button type="button" class="chip" data-x="${esc(t)}">${esc(t)}</button>`).join('');
$('#chatRap').addEventListener('click',e=>{ const b=e.target.closest('[data-x]'); if(b) chatEnviar(b.dataset.x); });
$('#chatForm').addEventListener('submit',e=>{ e.preventDefault(); const i=$('#chatIn'); if(chatEnviar(i.value)) i.value=''; i.focus(); });
$('#chatClose').addEventListener('click',chatFechar);
$('#chatOv').addEventListener('click',e=>{ if(e.target.id==='chatOv') chatFechar(); });
document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('.chatb')) chatAbrir(); });
