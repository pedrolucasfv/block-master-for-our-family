'use strict';
/* RANKING online (Supabase): recorde de cada fase da campanha, total de estrelas e recorde do Sozinho. Sem internet, guarda e envia depois. */
/* Endereço e chave pública do projeto no Supabase (Project Settings → API Keys: "Publishable key" ou, na aba Legacy, "anon public"). A chave "anon" é pública de propósito: quem protege os dados são as regras de supabase/ranking.sql. */
const SUPA_URL='https://udduiuoausbswczewcng.supabase.co';
const SUPA_KEY='sb_publishable_mSdw3fWJ7a6qJGC7XW2slg_HrE8anNh';
const rkOn=()=>!!(SUPA_URL&&SUPA_KEY)&&!SIM;
/* token do PIN do nome atual (js/20-pin.js); vazio se este aparelho não entrou com o PIN */
function pinTok(){ return store.get('ddb_pins',{})[myNick().toLowerCase()]||''; }
function rkFetch(path,opt){
  opt=opt||{}; const h={apikey:SUPA_KEY,'Content-Type':'application/json'}; if(/^eyJ/.test(SUPA_KEY)) h.Authorization='Bearer '+SUPA_KEY; /* chave antiga (anon) também vai no Authorization; a nova (sb_publishable_) só no apikey */
  const tk=pinTok(); if(tk) h['x-pin']=tk; /* o banco confere se este aparelho pode gravar com o nome (supabase/pin-e-progresso.sql) */
  /* sem resposta em 12 s (internet ruim ou servidor demorando): desiste, para a tela não ficar "Carregando…" para sempre */
  const ab=typeof AbortController==='function'?new AbortController():null, tm=ab&&setTimeout(()=>ab.abort(),12000);
  return fetch(SUPA_URL.replace(/\/$/,'')+'/rest/v1/'+path,{method:opt.body?'POST':'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined,signal:ab?ab.signal:undefined})
    .finally(()=>clearTimeout(tm))
    /* erro: a mensagem do banco vai junto ("pin: ..." quando falta o PIN) */
    .then(r=>{ if(!r.ok) return r.text().then(t=>{ throw new Error('ranking '+r.status+' '+t); }); return r.text().then(t=>t?JSON.parse(t):null); });
}
/* fila de envios: fica no aparelho até conseguir mandar (jogou sem internet, manda quando voltar) */
let rkBusy=false;
function rkQueue(fn,args){ const q=store.get('ddb_rkq',[]); q.push({fn,args}); store.set('ddb_rkq',q.slice(-200)); rkFlush(); }
function rkShift(){ const q=store.get('ddb_rkq',[]); q.shift(); store.set('ddb_rkq',q); }
function rkFlush(){
  if(!rkOn()||rkBusy||!navigator.onLine) return; const q=store.get('ddb_rkq',[]); if(!q.length) return;
  rkBusy=true;
  rkFetch('rpc/'+q[0].fn,{body:q[0].args}).then(()=>{ rkShift(); rkBusy=false; rkFlush(); })
    /* recusado pelo servidor (nome ou valor inválido): descarta para não travar a fila; falha de rede: tenta depois.
       Recusado por falta de PIN: guarda à parte (ddb_rkpin) e manda de novo quando entrar com o PIN */
    .catch(e=>{ rkBusy=false; if(/ranking 4/.test(e.message)){ if(/pin:/.test(e.message)){ const p=store.get('ddb_rkpin',[]); p.push(q[0]); store.set('ddb_rkpin',p.slice(-100)); if(pinTok()) pinPerdeu(); } rkShift(); rkFlush(); } });
}
window.addEventListener('online',rkFlush);
/* o valor que conta em cada fase é o mesmo das estrelas: peças, tempo, linhas ou tentativas */
function rkMetric(def,cp,att){ const by=def.st.by; return by==='pieces'?{v:cp.placed,menor:true}:by==='time'?{v:Math.round(cp.el/100)/10,menor:true}:by==='lines'?{v:cp.lines,menor:false}:{v:att||1,menor:true}; }
function rkFmt(def,v){ const by=def.st.by; return by==='pieces'?`${v} peças`:by==='time'?(def.setup==='puzzle'?`${String(v).replace('.',',')} s`:fmtT(v*1000)):by==='lines'?`${v} linhas`:`${v} ${v==1?'tentativa':'tentativas'}`; }
/* total de estrelas e recorde do Sozinho; manda só quando muda */
function rkSyncMe(){
  if(!rkOn()) return; const nome=myNick(); if(!nome) return;
  const bs=store.get('ddb_bests',{}), solo=Math.max(soloStats().bestScore||0,...Object.keys(bs).filter(k=>k.startsWith('sozinho|')).map(k=>bs[k]||0),0);
  const est=campTotal(campLoad('solo')), key=[nome.toLowerCase(),est,solo].join('|');
  if(store.get('ddb_rksync','')!==key){ store.set('ddb_rksync',key); rkQueue('salvar_jogador',{p_nome:nome,p_estrelas:est,p_solo:solo}); } else rkFlush();
  /* foto do perfil: vai junto uma miniatura (para as listas); a grande só é baixada quando alguém toca para ampliar */
  const ph=store.get('ddb_photo',''), pk=[nome.toLowerCase(),ph.length,ph.slice(-24)].join('|');
  if(store.get('ddb_rkfoto','')!==pk) rkMini(ph).then(mini=>{ store.set('ddb_rkfoto',pk); rkQueue('salvar_foto',{p_nome:nome,p_foto:ph,p_mini:mini}); }).catch(()=>{});
}
function rkMini(url){ return new Promise((res,rej)=>{ if(!url){ res(''); return; } const im=new Image(); im.onerror=rej;
  im.onload=()=>{ const S=64, c=document.createElement('canvas'); c.width=c.height=S; c.getContext('2d').drawImage(im,0,0,S,S); res(c.toDataURL('image/jpeg',.7)); }; im.src=url; }); }
/* fim de uma fase da campanha jogada sozinho */
function rkCampEnd(info,cfg){
  if(!rkOn()||!cfg.solo) return; const nome=myNick();
  if(info.win&&nome){ const w=cfg.camp.w||1, ph=cfg.camp.ph, def=CWD(w).phases[ph-1], m=rkMetric(def,info.cp||{},cfg.camp.att);
    /* quebra-cabeça: desde a 1.14 vale o tempo (antes eram tentativas); o recorde guardado aqui ganha outra chave (lk) para não misturar */
    const k=w+'-'+ph, lk=def.setup==='puzzle'?k+'t':k, mine=store.get('ddb_rkbest',{}), old=mine[lk], s=info.stars||1;
    if(!old||s>old.s||(s===old.s&&(m.menor?m.v<old.v:m.v>old.v))){ mine[lk]={s,v:m.v}; store.set('ddb_rkbest',mine); rkQueue('enviar_recorde',{p_nome:nome,p_fase:k,p_estrelas:s,p_valor:m.v,p_menor:m.menor}); } }
  rkSyncMe();
}
/* Desafio do dia: a chave do jogo é "AAAA-MM-DD" (com tempo) ou "AAAA-MM-DD|S" (sem tempo) */
const rkDayOf=key=>({dia:String(key).split('|')[0],v:'t'}); /* um modo só desde a 1.7 (no banco, var 't') */
/* fim de uma partida do Desafio do dia: manda o resultado (só a partida jogada agora; o que foi jogado antes da versão 1.7 não entra) */
function rkDailyEnd(d){ if(!rkOn()||!myNick()) return; const k=rkDayOf(d.cfg.key); rkQueue('enviar_diario',{p_nome:myNick(),p_dia:k.dia,p_var:k.v,p_pontos:d.score,p_linhas:d.eng.lines}); }
const rkDayAdd=(dia,n)=>{ const [y,m,dd]=dia.split('-').map(Number); return todayKey(new Date(y,m-1,dd+n)); };
const rkMonth=(dia,n)=>{ const [y,m]=dia.split('-').map(Number); return todayKey(new Date(y,m-1+n,1)); };
const RK_MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
/* ranking do Desafio do dia, na caixa sel: um calendário do mês (toque num dia para ver o ranking dele; ponto = dias em que você jogou, 🥇 = dias em que você ficou em 1º)
   e duas abas: "Dia" (pódio e lista do dia escolhido, com a sua posição mesmo fora do top 10) e "Vitórias do mês" (quantas vezes cada um ficou em 1º) */
const RK_SEM=['D','S','T','Q','Q','S','S'];
function rkDailyBox(sel,key){
  const box=$(sel); if(!box) return; if(!rkOn()){ box.hidden=true; return; }
  const k=rkDayOf(key), hoje=diaBR(), st={modo:'dia',dia:k.dia,mes:rkMonth(k.dia,0)}, venc={}, me=myNick().toLowerCase();
  box.innerHTML=`<div class="tabs rktabs"><button type="button" data-m="dia" class="sel">📅 Ranking do dia</button><button type="button" data-m="mes">🥇 Vitórias do mês</button></div>
    <div class="rkcal"><div class="rkmes"><button type="button" class="chip" data-d="-1" aria-label="Mês anterior">‹</button><b></b><button type="button" class="chip" data-d="1" aria-label="Próximo mês">›</button></div><div class="rkgrid"></div></div>
    <p class="rkdia"></p><div class="rklist"></div>`+rkNoNick();
  const list=box.querySelector('.rklist'), lab=box.querySelector('.rkmes b'), next=box.querySelector('[data-d="1"]'), grid=box.querySelector('.rkgrid'), dl=store.get('ddb_daily',{});
  const nomeDia=d=>{ const [y,m,dd]=d.split('-').map(Number); return d===hoje?'Hoje':d===rkDayAdd(hoje,-1)?'Ontem':`${dd} de ${RK_MES[m-1]}`; };
  /* desenha o mês: dias futuros apagados, hoje com contorno, o escolhido preenchido */
  const cal=()=>{ const [y,m]=st.mes.split('-').map(Number), first=new Date(y,m-1,1).getDay(), n=new Date(y,m,0).getDate();
    lab.textContent=`${RK_MES[m-1][0].toUpperCase()+RK_MES[m-1].slice(1)} de ${y}`; next.disabled=st.mes>=rkMonth(hoje,0);
    let h=RK_SEM.map(x=>`<span class="wd">${x}</span>`).join('')+'<span></span>'.repeat(first);
    for(let d=1;d<=n;d++){ const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, fut=ds>hoje, won=venc[ds]===me&&ds<hoje&&me;
      h+=`<button type="button" data-day="${ds}" class="${ds===hoje?'today':''}${st.modo==='dia'&&ds===st.dia?' sel':''}${dl[ds+'|R']?' played':''}"${fut?' disabled':''}>${d}${won?'<i>🥇</i>':''}</button>`; }
    grid.innerHTML=h;
    grid.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{ st.dia=b.dataset.day; st.modo='dia'; tabs(); load(); }));
  };
  /* quem ficou em 1º em cada dia do mês (para a medalha no calendário) */
  const vencMes=()=>{ const [y,m]=st.mes.split('-').map(Number), fim=`${st.mes.slice(0,8)}${String(new Date(y,m,0).getDate()).padStart(2,'0')}`;
    if(venc['_'+st.mes]) return; venc['_'+st.mes]=1;
    rkFetch(`diario?dia=gte.${st.mes}&dia=lte.${fim}&var=eq.${k.v}&select=dia,pontos,jogadores(nome)&order=pontos.desc,quando.asc&limit=2000`)
      .then(r=>{ (r||[]).forEach(x=>{ if(!(x.dia in venc)) venc[x.dia]=((x.jogadores&&x.jogadores.nome)||'').toLowerCase(); }); if(box.isConnected) cal(); }).catch(()=>{}); };
  const tabs=()=>box.querySelectorAll('.rktabs button').forEach(x=>x.classList.toggle('sel',x.dataset.m===st.modo));
  const load=()=>{
    const dia=st.modo==='dia'; cal(); vencMes();
    box.querySelector('.rkdia').textContent=dia?`🏆 ${nomeDia(st.dia)}`:`🥇 Quem mais ficou em 1º em ${RK_MES[+st.mes.split('-')[1]-1]}`;
    list.innerHTML='<p class="muted">Carregando…</p>';
    const q=dia?rkFetch(`diario?dia=eq.${st.dia}&var=eq.${k.v}&select=pontos,linhas,jogadores(nome)&order=pontos.desc,quando.asc&limit=10`).then(r=>r.map(x=>({nome:(x.jogadores&&x.jogadores.nome)||'?',txt:`${fmtN(x.pontos)} pts`})))
      :rkFetch('rpc/vitorias_mes',{body:{p_mes:st.mes,p_var:k.v}}).then(r=>(r||[]).map(x=>({nome:x.nome,txt:`${x.vitorias} ${x.vitorias==1?'vitória':'vitórias'}`})));
    const qd=st.dia, qm=st.modo;
    q.then(rows=>{ if(!box.isConnected||qd!==st.dia||qm!==st.modo) return;
      if(!rows.length){ list.innerHTML=`<p class="muted">${dia?(st.dia===hoje?'Ninguém jogou ainda hoje. Seja o primeiro!':'Ninguém jogou nesse dia.'):'Ninguém venceu um dia neste mês ainda.'}</p>`; return; }
      list.innerHTML=rkPodium(rows,r=>r.txt)+(dia?'':'<p class="muted" style="font-size:12px">Conta quem terminou o dia em 1º. O dia de hoje entra quando acabar.</p>');
      /* você jogou esse dia mas ficou fora do top 10: mostra sua posição embaixo */
      const mine=dl[st.dia+'|R'];
      if(dia&&me&&mine&&rows.length>=10&&!rows.some(r=>r.nome.toLowerCase()===me))
        rkFetch(`diario?dia=eq.${st.dia}&var=eq.${k.v}&pontos=gt.${mine.score}&select=pontos&limit=1000`).then(r=>{ if(!box.isConnected||qd!==st.dia) return;
          list.insertAdjacentHTML('beforeend',`<div class="rank rkme"><div class="kv me"><span>${r.length+1}º ${esc(myNick())} (você)</span><b>${fmtN(mine.score)} pts</b></div></div>`); }).catch(()=>{});
    }).catch(()=>{ if(box.isConnected) list.innerHTML='<p class="muted">Ranking indisponível sem internet.</p>'; });
  };
  box.querySelectorAll('.rktabs button').forEach(b=>b.addEventListener('click',()=>{ st.modo=b.dataset.m; tabs(); load(); }));
  box.querySelectorAll('.rkmes button').forEach(b=>b.addEventListener('click',()=>{ st.mes=rkMonth(st.mes,+b.dataset.d); load(); }));
  setTimeout(load,store.get('ddb_rkq',[]).length?1500:0);
}
/* os 3 primeiros num pódio (2º, 1º, 3º) e o resto em lista */
function rkPodium(list,fmt){
  const me=myNick().toLowerCase(), top=list.slice(0,3), ord=[1,0,2].filter(i=>top[i]);
  return `<div class="podio">${ord.map(i=>`<div class="pd p${i+1}${top[i].nome.toLowerCase()===me?' me':''}"><span class="md">${['🥇','🥈','🥉'][i]}</span><b>${esc(top[i].nome)}</b><small>${fmt(top[i])}</small><i>${i+1}º</i></div>`).join('')}</div>`
    +(list.length>3?`<div class="rank">${list.slice(3).map((r,i)=>`<div class="kv${r.nome.toLowerCase()===me?' me':''}"><span>${i+4}º ${esc(r.nome)}</span><b>${fmt(r)}</b></div>`).join('')}</div>`:'');
}
function rkRows(list,fmt){
  const me=myNick().toLowerCase();
  return `<div class="rank">${list.map((r,i)=>`<div class="kv${r.nome.toLowerCase()===me?' me':''}"><span>${['🥇','🥈','🥉'][i]||(i+1)+'º'} ${esc(r.nome)}</span><b>${fmt(r)}</b></div>`).join('')}</div>`;
}
function rkNoNick(){ return myNick()?'':'<p class="muted">Coloque seu nome no Perfil para aparecer no ranking.</p>'; }
/* top 5 de uma fase, na caixa #rkPhase (fim da fase e apresentação da fase) */
function rkPhaseBox(w,ph){
  const box=$('#rkPhase'); if(!box) return; if(!rkOn()){ box.hidden=true; return; }
  const def=CWD(w).phases[ph-1], menor=def.st.by!=='lines';
  box.innerHTML='<p class="muted">🏆 Carregando ranking…</p>';
  /* se acabou de mandar um recorde, espera um pouco para ele já aparecer na lista */
  setTimeout(()=>rkFetch(`recordes?fase=eq.${w}-${ph}&select=estrelas,valor,jogadores(nome)&order=estrelas.desc,valor.${menor?'asc':'desc'},quando.asc&limit=5`)
    .then(rows=>{ if(!box.isConnected) return; const list=rows.map(r=>({nome:(r.jogadores&&r.jogadores.nome)||'?',estrelas:r.estrelas,valor:+r.valor}));
      box.innerHTML='<p class="muted" style="margin-top:10px">🏆 Ranking da fase</p>'+(list.length?rkRows(list,r=>'★'.repeat(r.estrelas)+' · '+rkFmt(def,r.valor)):'<p class="muted">Ninguém completou ainda. Seja o primeiro!</p>')+rkNoNick(); })
    .catch(()=>{ if(box.isConnected) box.innerHTML='<p class="muted">🏆 Ranking indisponível sem internet.</p>'; }),store.get('ddb_rkq',[]).length?1500:0);
}
/* ranking geral: estrelas da campanha e recorde do Sozinho */
function rkOpenGeneral(){
  rkSyncMe();
  openEnd('<h2>🏆 Ranking</h2><div class="tabs" id="rkTabs"><button type="button" class="sel" data-k="estrelas">⭐ Campanha</button><button type="button" data-k="solo">🎯 Sozinho</button></div><div id="rkGen"></div>'+rkNoNick(),[{t:'Fechar',cls:'ghost',on:closeEnd}]);
  const load=k=>{ const box=$('#rkGen'); box.innerHTML='<p class="muted">Carregando…</p>';
    rkFetch(`jogadores?select=nome,estrelas,solo&${k}=gt.0&order=${k}.desc,atualizado.asc&limit=20`)
      .then(rows=>{ if(!box.isConnected) return; box.innerHTML=rows.length?rkRows(rows,r=>k==='estrelas'?r.estrelas+' ⭐':fmtN(r.solo)+' pts'):'<p class="muted">Ninguém ainda.</p>'; })
      .catch(()=>{ if(box.isConnected) box.innerHTML='<p class="muted">Ranking indisponível sem internet.</p>'; }); };
  $$('#rkTabs button').forEach(b=>b.addEventListener('click',()=>{ $$('#rkTabs button').forEach(x=>x.classList.toggle('sel',x===b)); load(b.dataset.k); }));
  load('estrelas');
}
if(rkOn()){ const b=$('#campRank'); if(b){ b.hidden=false; b.addEventListener('click',rkOpenGeneral); } setTimeout(rkSyncMe,3000); }
