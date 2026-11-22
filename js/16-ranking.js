'use strict';
/* RANKING online (Supabase): recorde de cada fase da campanha, total de estrelas e recorde do Sozinho. Sem internet, guarda e envia depois. */
/* Endereço e chave pública do projeto no Supabase (Project Settings → API Keys: "Publishable key" ou, na aba Legacy, "anon public"). A chave "anon" é pública de propósito: quem protege os dados são as regras de supabase/ranking.sql. */
const SUPA_URL='https://udduiuoausbswczewcng.supabase.co';
const SUPA_KEY='sb_publishable_mSdw3fWJ7a6qJGC7XW2slg_HrE8anNh';
const rkOn=()=>!!(SUPA_URL&&SUPA_KEY)&&!SIM;
function rkFetch(path,opt){
  opt=opt||{}; const h={apikey:SUPA_KEY,'Content-Type':'application/json'}; if(/^eyJ/.test(SUPA_KEY)) h.Authorization='Bearer '+SUPA_KEY; /* chave antiga (anon) também vai no Authorization; a nova (sb_publishable_) só no apikey */
  return fetch(SUPA_URL.replace(/\/$/,'')+'/rest/v1/'+path,{method:opt.body?'POST':'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined})
    .then(r=>{ if(!r.ok) throw new Error('ranking '+r.status); return r.text().then(t=>t?JSON.parse(t):null); });
}
/* fila de envios: fica no aparelho até conseguir mandar (jogou sem internet, manda quando voltar) */
let rkBusy=false;
function rkQueue(fn,args){ const q=store.get('ddb_rkq',[]); q.push({fn,args}); store.set('ddb_rkq',q.slice(-200)); rkFlush(); }
function rkShift(){ const q=store.get('ddb_rkq',[]); q.shift(); store.set('ddb_rkq',q); }
function rkFlush(){
  if(!rkOn()||rkBusy||!navigator.onLine) return; const q=store.get('ddb_rkq',[]); if(!q.length) return;
  rkBusy=true;
  rkFetch('rpc/'+q[0].fn,{body:q[0].args}).then(()=>{ rkShift(); rkBusy=false; rkFlush(); })
    /* recusado pelo servidor (nome ou valor inválido): descarta para não travar a fila; falha de rede: tenta depois */
    .catch(e=>{ rkBusy=false; if(/ranking 4/.test(e.message)){ rkShift(); rkFlush(); } });
}
window.addEventListener('online',rkFlush);
/* o valor que conta em cada fase é o mesmo das estrelas: peças, tempo, linhas ou tentativas */
function rkMetric(def,cp,att){ const by=def.st.by; return by==='pieces'?{v:cp.placed,menor:true}:by==='time'?{v:Math.round(cp.el/100)/10,menor:true}:by==='lines'?{v:cp.lines,menor:false}:{v:att||1,menor:true}; }
function rkFmt(def,v){ const by=def.st.by; return by==='pieces'?`${v} peças`:by==='time'?fmtT(v*1000):by==='lines'?`${v} linhas`:`${v} ${v==1?'tentativa':'tentativas'}`; }
/* total de estrelas e recorde do Sozinho; manda só quando muda */
function rkSyncMe(){
  if(!rkOn()) return; const nome=myNick(); if(!nome) return;
  const bs=store.get('ddb_bests',{}), solo=Math.max(soloStats().bestScore||0,...Object.keys(bs).filter(k=>k.startsWith('sozinho|')).map(k=>bs[k]||0),0);
  const est=campTotal(campLoad('solo')), key=[nome.toLowerCase(),est,solo].join('|');
  if(store.get('ddb_rksync','')!==key){ store.set('ddb_rksync',key); rkQueue('salvar_jogador',{p_nome:nome,p_estrelas:est,p_solo:solo}); } else rkFlush();
  rkDailySync();
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
    const k=w+'-'+ph, mine=store.get('ddb_rkbest',{}), old=mine[k], s=info.stars||1;
    if(!old||s>old.s||(s===old.s&&(m.menor?m.v<old.v:m.v>old.v))){ mine[k]={s,v:m.v}; store.set('ddb_rkbest',mine); rkQueue('enviar_recorde',{p_nome:nome,p_fase:k,p_estrelas:s,p_valor:m.v,p_menor:m.menor}); } }
  rkSyncMe();
}
/* Desafio do dia: a chave do jogo é "AAAA-MM-DD" (com tempo) ou "AAAA-MM-DD|S" (sem tempo) */
const rkDayOf=key=>{ const [dia,s]=String(key).split('|'); return {dia,v:s?'s':'t'}; };
/* manda o resultado do dia guardado no aparelho (de hoje e de ontem), uma vez só por partida */
function rkDailySync(){ if(!rkOn()||!myNick()) return; const dl=store.get('ddb_daily',{}), sent=store.get('ddb_rkdia',{}), ok=[todayKey(),todayKey(new Date(Date.now()-864e5))];
  Object.keys(dl).forEach(key=>{ const k=rkDayOf(key); if(sent[key]||!ok.includes(k.dia)) return; sent[key]=1;
    rkQueue('enviar_diario',{p_nome:myNick(),p_dia:k.dia,p_var:k.v,p_pontos:dl[key].score||0,p_linhas:dl[key].lines||0}); });
  store.set('ddb_rkdia',sent); }
function rkDailyEnd(){ rkDailySync(); }
/* top 10 do dia, na caixa sel (tela do desafio do dia e fim da partida) */
function rkDailyBox(sel,key){
  const box=$(sel); if(!box) return; if(!rkOn()){ box.hidden=true; return; }
  const k=rkDayOf(key); box.innerHTML='<p class="muted">🏆 Carregando o ranking de hoje…</p>';
  setTimeout(()=>rkFetch(`diario?dia=eq.${k.dia}&var=eq.${k.v}&select=pontos,linhas,jogadores(nome)&order=pontos.desc,quando.asc&limit=10`)
    .then(rows=>{ if(!box.isConnected) return; const list=rows.map(r=>({nome:(r.jogadores&&r.jogadores.nome)||'?',pontos:r.pontos,linhas:r.linhas}));
      box.innerHTML=`<p class="muted" style="margin-top:12px">🏆 Ranking de hoje${k.v==='s'?' (sem tempo)':''}</p>`+(list.length?rkRows(list,r=>`${fmtN(r.pontos)} pts`):'<p class="muted">Ninguém jogou ainda hoje. Seja o primeiro!</p>')+rkNoNick(); })
    .catch(()=>{ if(box.isConnected) box.innerHTML='<p class="muted">🏆 Ranking indisponível sem internet.</p>'; }),store.get('ddb_rkq',[]).length?1500:0);
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
