'use strict';
/* DESAFIO A DISTÂNCIA (Supabase): melhor de 5 entre duas pessoas, cada uma joga a rodada quando puder; aviso pelo WhatsApp */
/* Cada rodada usa as mesmas peças para os dois (semente do desafio + número da rodada). Quem criou joga primeiro;
   os pontos do outro na rodada só aparecem depois que você joga a sua. Banco: supabase/desafios.sql */
const DS_TIMES=[0,1,2,3]; /* opções de tempo (TIMES/TIME_L): 2 min, 3 min, 5 min, sem limite */
const dsKey=()=>myNick().toLowerCase();
function dsLink(id){ return /^https?:/.test(location.href)?location.origin+location.pathname+'?d='+id:''; }
function dsSide(d){ const k=dsKey(); return d.a===k?'a':d.b===k?'b':null; }
function dsWins(d){ let wa=0,wb=0; d.rodadas.forEach(r=>{ if(r[0]!=null&&r[1]!=null){ if(r[0]>r[1]) wa++; else if(r[1]>r[0]) wb++; } }); return [wa,wb]; }
function dsOther(d,side){ return side==='a'?(d.b_nome||'quem aceitar'):d.a_nome; }
function dsMyTurn(d){ const s=dsSide(d); return !!s&&d.vez===s&&(s==='a'||!!d.b); }
function dsGet(id){ return rkFetch(`desafios?id=eq.${encodeURIComponent(id)}&select=*`).then(r=>r&&r[0]); }
function dsMine(){ const k=encodeURIComponent(dsKey()); return Promise.all([rkFetch(`desafios?a=eq.${k}&select=*&order=atualizado.desc&limit=30`),rkFetch(`desafios?b=eq.${k}&select=*&order=atualizado.desc&limit=30`)])
  .then(([x,y])=>x.concat(y).sort((p,q)=>q.atualizado.localeCompare(p.atualizado))); }
/* sem nome não dá para desafiar: pede um nome (o mesmo do Perfil) */
function dsNeedNick(cb){
  if(myNick()){ cb(); return; }
  openEnd('<h2>Qual é o seu nome?</h2><p class="muted">É assim que os outros vão ver você nos desafios e no ranking.</p><input class="code nick" id="dsNick" maxlength="16" autocomplete="nickname" style="width:100%;margin-top:10px">',
    [{t:'Continuar',cls:'primary',on:()=>{ const v=$('#dsNick').value.trim().slice(0,16); if(!v){ toast('Escreva um nome'); return; } store.set('ddb_nick',v); closeEnd(); cb(); }},{t:'Voltar',cls:'ghost',on:closeEnd}]);
  setTimeout(()=>{ const i=$('#dsNick'); if(i) i.focus(); },100);
}
function dsShare(d,kind){
  const side=dsSide(d), [wa,wb]=dsWins(d), me=side==='b'?d.b_nome:d.a_nome, my=side==='b'?wb:wa, ot=side==='b'?wa:wb, l=dsLink(d.id), r=d.rodadas.length;
  let t;
  if(kind==='convite') t=`⚔️ ${me} te desafiou no Duelo de Blocos! Melhor de 5, ${TIME_L[d.tempo]} por rodada. Toque para jogar:`;
  else if(d.vez==='fim') t=d.vencedor==='empate'?`⚔️ Nosso desafio no Duelo de Blocos terminou empatado: ${my} × ${ot}!`:`⚔️ Desafio no Duelo de Blocos: ${d.vencedor===side?'eu venci':'você venceu'} por ${Math.max(wa,wb)} × ${Math.min(wa,wb)}! Revanche?`;
  else if(d.rodadas.length===1&&side==='a') t=`⚔️ ${me} te desafiou no Duelo de Blocos! Melhor de 5, ${TIME_L[d.tempo]} por rodada. Já joguei a rodada 1, sua vez:`;
  else t=`⚔️ Joguei minha parte no nosso desafio do Duelo de Blocos. Sua vez (rodada ${r})! Placar: ${me} ${my} × ${ot} ${dsOther(d,side)}.`;
  shareText(t+(l?'\n'+l:''));
}
/* cartão de um desafio: placar, rodadas e o que dá para fazer */
function dsOpen(id,delay){
  openEnd('<h2>⚔️ Desafio</h2><p class="muted">Carregando…</p>',[{t:'Fechar',cls:'ghost',on:closeEnd}]);
  setTimeout(()=>dsGet(id).then(d=>{
    if(!d){ openEnd('<h2>⚔️ Desafio</h2><p class="reason">Esse desafio não existe mais.</p>',[{t:'Fechar',cls:'ghost',on:closeEnd}]); return; }
    const side=dsSide(d), [wa,wb]=dsWins(d), my=side==='b'?wb:wa, ot=side==='b'?wa:wb, mi=side==='b'?1:0, last=d.rodadas.length-1;
    let body=`<h2>⚔️ ${esc(d.a_nome)} × ${esc(d.b_nome||'?')}</h2><p class="muted">Melhor de 5 · ${TIME_L[d.tempo]} por rodada</p>`;
    body+=`<div class="endscore">${wa} × ${wb}</div>`;
    if(d.vez==='fim') body+=`<div class="winner ${d.vencedor===side?'win':d.vencedor==='empate'?'':'lose'}">${d.vencedor==='empate'?'Empate!':d.vencedor===side?'Você venceu! 🏆':`${esc(d.vencedor==='a'?d.a_nome:d.b_nome)} venceu`}</div>`;
    body+='<div class="rank">'+d.rodadas.map((r,i)=>{ const open=i===last&&d.vez!=='fim';
      let pa=r[0]==null?'—':fmtN(r[0]), pb=r[1]==null?'—':fmtN(r[1]);
      /* rodada em andamento: os pontos do outro ficam escondidos até você jogar */
      if(open&&side&&r[mi]==null){ if(side==='a'&&r[1]!=null) pb='✔ jogou'; if(side==='b'&&r[0]!=null) pa='✔ jogou'; }
      const mark=!open&&r[0]!=null&&r[1]!=null?(r[0]>r[1]?' ◀':r[1]>r[0]?' ▶':' ='):'';
      return `<div class="kv"><span>Rodada ${i+1}${mark}</span><b>${pa} × ${pb}</b></div>`; }).join('')+'</div>';
    const btns=[];
    if(!side) body+=`<p class="muted">Você não está neste desafio.</p>`;
    else if(d.vez!=='fim'){
      if(dsMyTurn(d)) btns.push({t:`Jogar rodada ${last+1}`,cls:'primary',on:()=>dsPlay(d)});
      else body+=`<p class="muted">${!d.b?'Esperando alguém aceitar o convite.':`Vez de ${esc(dsOther(d,side))}. Avise pelo WhatsApp!`}</p>`;
      if(!d.b) btns.push({t:'Mandar convite no WhatsApp',on:()=>dsShare(d,'convite')});
      else if(!dsMyTurn(d)) btns.push({t:'Avisar no WhatsApp',cls:'primary',on:()=>dsShare(d,'vez')});
    } else btns.push({t:'Compartilhar resultado',on:()=>dsShare(d,'fim')},{t:'Revanche',cls:'primary',on:()=>dsNew(d.tempo,dsOther(d,side))});
    btns.push({t:'Meus desafios',cls:'ghost',on:dsList});
    openEnd(body,btns);
  }).catch(()=>openEnd('<h2>⚔️ Desafio</h2><p class="reason">Sem internet agora. Tente de novo daqui a pouco.</p>',[{t:'Fechar',cls:'ghost',on:closeEnd}])),delay||0);
}
/* começa a rodada: se sair no meio, ela vale os pontos que tinha (fica anotada e é enviada depois) */
function dsPlay(d){
  const r=d.rodadas.length; store.set('ddb_dspend',{id:d.id,r,s:0}); closeEnd(); ac();
  startDuel({type:'chal',opts:Object.assign(defOpts(),{time:d.tempo,play:0}),seed:'X|'+d.id+'|'+r,label:`Desafio · Rodada ${r}`,code:'',chal:{id:d.id,r,d}});
}
function dsSend(id,r,s){ store.set('ddb_dspend',null); rkQueue('jogar_rodada',{p_id:id,p_nome:myNick(),p_rodada:r,p_pontos:s}); }
/* fim da partida (chamado no duelEnd) */
function dsRoundEnd(d){ const c=d.cfg.chal; dsSend(c.id,c.r,d.score); }
function dsEndBtns(d){ const c=d.cfg.chal;
  return [{t:'Avisar no WhatsApp',cls:'primary',on:()=>dsGet(c.id).then(x=>dsShare(x||c.d,'vez')).catch(()=>dsShare(c.d,'vez'))},
    {t:'Ver desafio',on:()=>{ D=null; IN=null; dsList(); dsOpen(c.id,store.get('ddb_rkq',[]).length?1500:0); }},
    {t:'Menu',cls:'ghost',on:goHome}]; }
/* saiu no meio de uma rodada (ou fechou o jogo): manda o que tinha */
function dsCheckPend(){ const p=store.get('ddb_dspend',null); if(!p||(D&&D.cfg&&D.cfg.type==='chal'&&!D.over)) return; dsSend(p.id,p.r,p.s||0); toast(`Você saiu no meio da rodada ${p.r} do desafio: ela foi enviada com ${fmtN(p.s||0)} pontos.`); }
/* cria o desafio: com rival (alguém da lista) ou sem (convite por link, entra quem abrir primeiro) */
function dsNew(tempo,rival){
  dsNeedNick(()=>{
    openEnd('<h2>⚔️ Novo desafio</h2><p class="muted">Criando…</p>',[]);
    rkFetch('rpc/criar_desafio',{body:{p_nome:myNick(),p_tempo:tempo==null?dsTempo():tempo,p_rival:rival||null}}).then(id=>dsOpen(id))
      .catch(()=>openEnd('<h2>⚔️ Novo desafio</h2><p class="reason">Não deu para criar agora. Confira a internet e tente de novo.</p>',[{t:'Fechar',cls:'ghost',on:closeEnd}]));
  });
}
const dsTempo=()=>store.get('ddb_dstempo',0);
let DS_PEOPLE=[], DS_LIST=[];
/* tela de desafios: os meus (sua vez, esperando, terminados) e a lista de jogadores para desafiar */
function dsList(){
  dsNeedNick(()=>{ closeEnd(); dsCheckPend(); show('chal'); avRender();
    $('#chalTime').innerHTML=DS_TIMES.map(t=>`<button type="button" data-v="${t}" class="${dsTempo()===t?'sel':''}">${TIME_L[t]}</button>`).join('');
    $$('#chalTime button').forEach(b=>b.addEventListener('click',()=>{ store.set('ddb_dstempo',+b.dataset.v); $$('#chalTime button').forEach(x=>x.classList.toggle('sel',x===b)); }));
    $('#chalMine').innerHTML='<p class="muted">Carregando seus desafios…</p>'; $('#chalPeople').innerHTML='<p class="muted">Carregando jogadores…</p>';
    setTimeout(()=>{
      dsMine().then(list=>{ DS_LIST=list; dsRenderMine(); dsRenderPeople(); dsBadge(list.filter(dsMyTurn).length); })
        .catch(()=>{ $('#chalMine').innerHTML='<div class="card"><p class="reason">Sem internet agora. Volte e tente de novo daqui a pouco.</p></div>'; });
      rkFetch('jogadores?select=nome,chave,estrelas&order=atualizado.desc&limit=100').then(r=>{ DS_PEOPLE=r.filter(x=>x.chave!==dsKey()); dsRenderPeople(); })
        .catch(()=>{ $('#chalPeople').innerHTML='<p class="muted">Sem internet agora.</p>'; });
    },store.get('ddb_rkq',[]).length?1500:0);
  });
}
function dsRenderMine(){
  const row=d=>{ const side=dsSide(d), [wa,wb]=dsWins(d), my=side==='b'?wb:wa, ot=side==='b'?wa:wb;
    const st=d.vez==='fim'?(d.vencedor===side?'🏆 venceu':d.vencedor==='empate'?'empate':'perdeu'):dsMyTurn(d)?'▶ sua vez':!d.b?'esperando alguém aceitar':`vez de ${dsOther(d,side)}`;
    return `<button type="button" class="kv dsrow" data-id="${esc(d.id)}"><span>vs ${esc(dsOther(d,side))} · <b>${my} × ${ot}</b></span><b>${esc(st)}</b></button>`; };
  const L=DS_LIST, turn=L.filter(dsMyTurn), wait=L.filter(d=>d.vez!=='fim'&&!dsMyTurn(d)), done=L.filter(d=>d.vez==='fim').slice(0,10);
  const sec=(t,a)=>a.length?`<div class="card"><h2>${t}</h2><div class="rank">${a.map(row).join('')}</div></div>`:'';
  $('#chalMine').innerHTML=sec('▶ Sua vez',turn)+sec('⏳ Esperando',wait)+sec('Terminados',done);
  $$('#chalMine .dsrow').forEach(b=>b.addEventListener('click',()=>dsOpen(b.dataset.id)));
}
function dsRenderPeople(){
  const box=$('#chalPeople'), q=($('#chalFind').value||'').trim().toLowerCase();
  const busy=new Set(DS_LIST.filter(d=>d.vez!=='fim').map(d=>dsSide(d)==='a'?d.b:d.a));
  const list=DS_PEOPLE.filter(p=>!q||p.chave.includes(q));
  box.innerHTML=list.length?'<div class="rank">'+list.slice(0,40).map(p=>`<div class="kv"><span>${esc(p.nome)}${p.estrelas?` <small class="muted">${p.estrelas}⭐</small>`:''}${busy.has(p.chave)?' <small class="muted">· em andamento</small>':''}</span><button type="button" class="btn small dsgo" data-n="${esc(p.nome)}" style="width:auto">Desafiar</button></div>`).join('')+'</div>'
    :`<p class="muted">${q?'Ninguém com esse nome.':'Ainda não tem ninguém na lista. Quem coloca o nome no Perfil e joga aparece aqui.'}</p>`;
  $$('#chalPeople .dsgo').forEach(b=>b.addEventListener('click',()=>dsNew(null,b.dataset.n)));
}
$('#chalFind').addEventListener('input',dsRenderPeople);
$('#chalInvite').addEventListener('click',()=>dsNew(null,null));
function dsBadge(n){ const b=$('#goChal'); if(b) b.textContent=n?`⚔️ Desafios · ${n} na sua vez`:'⚔️ Desafios a distância'; }
/* abriu o jogo por um link de desafio (?d=...) */
function dsFromLink(){
  let id=null; try{ id=new URLSearchParams(location.search).get('d'); }catch(e){}
  if(!id||!/^[0-9a-f]{8}$/.test(id)) return;
  try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
  dsNeedNick(()=>{ rkFetch('rpc/entrar_desafio',{body:{p_id:id,p_nome:myNick()}}).catch(()=>{}).then(()=>dsOpen(id)); });
}
if(rkOn()){
  const b=$('#goChal'); if(b){ b.hidden=false; b.addEventListener('click',dsList); }
  setTimeout(()=>{ dsCheckPend(); if(myNick()) dsMine().then(l=>dsBadge(l.filter(dsMyTurn).length)).catch(()=>{}); },2500);
  setTimeout(dsFromLink,600);
}
