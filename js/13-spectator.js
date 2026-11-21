'use strict';
/* MODO ESPECTADOR (TV) */
/* ===================== MODO ESPECTADOR (TV) =====================
   Só assiste: recebe tudo que a sala manda e desenha na tela grande. */
const SP={mode:'lobby',cfg:null,pl:{},view:null,start:0,leader:null,raf:0,over:null,annT:0,paused:false};
function specEnter(){ SP.mode='lobby'; SP.cfg=null; show('spec'); specRender(); }
$('#spLeave').addEventListener('click',()=>{ closeNet(); show('home'); });
function specMsg(m){
  const f=m.from;
  switch(m.t){
    case 'roster': NET.players=m.players; NET.names=m.names||{}; NET.daily=m.daily||{}; specRender(); break;
    case 'lobbyCfg': NET.lobby={type:m.type,opts:Object.assign(defOpts(),m.opts)}; if(SP.mode==='lobby') specRender(); break;
    case 'room': NET.room=m.room||{matches:[]}; if(SP.mode==='lobby') specRender(); break;
    case 'prof': storeProf(m); specRender(); break;
    case 'cfg': specBegin(m); break;
    case 'lobby': SP.mode='lobby'; SP.cfg=null; specAnn(null); specRender(); break;
    case 'st': { const p=SP.pl[f]; if(!p||(m.seed&&SP.cfg&&m.seed!==SP.cfg.seed)) break;
      const had=hasBlocks(p.b), jump=m.s-p.score; p.score=m.s; if(m.b) p.b=m.b;
      if(had&&m.b&&!hasBlocks(m.b)&&jump>=300) specAnn(`✨ PERFECT de ${nm(f)}!`,f);
      specLeader(); SP.dirty=true; break; }
    case 'end': { const p=SP.pl[f]; if(!p||(m.seed&&SP.cfg&&m.seed!==SP.cfg.seed)) break; p.info=m.info; p.score=m.info.score;
      if(m.info.reason==='goal') specAnn(`🎯 ${nm(f)} bateu a meta!`,f);
      SP.dirty=true; specCheckLiveEnd(); break; }
    case 'sync': specSync(m); break;
    case 'blk': specAnn(`🛡️ ${nm(f)} bloqueou o ataque de ${nm(m.to)}!`,f); break;
    case 'atk': specAnn(m.pw?`🧱 ${nm(f)} jogou uma pedra em ${nm(m.to)}!`:`💥 ${nm(f)} atacou ${nm(m.to)}! +${m.n} blindados`,f); { const p=profOf(f); if(p.atk) playClip(p.atk,1.8); } break;
    case 'pw': specAnn(m.k==='freeze'?`❄️ ${nm(f)} congelou ${nm(m.to)}!`:m.k==='fog'?`🌫️ ${nm(f)} jogou névoa em ${nm(m.to)}!`:m.k==='tbomb'?`💣 ${nm(f)} jogou uma bomba-relógio em ${nm(m.to)}!`:`⚡ ${nm(f)} usou um poder em ${nm(m.to)}!`,f); { const p=profOf(f); if(p.atk) playClip(p.atk,1.8); } break;
    case 'cmb': specAnn(`🔥 Combo x${m.c} de ${nm(f)}!`,f); { const p=profOf(f); if(p.combo) playClip(p.combo,1.8); } break;
    case 'emo': bigEmoji(m.e); break;
    case 'gold': specAnn('⭐ Bloco dourado! Quem limpar primeiro leva +150'); break;
    case 'goldWon': specAnn(`⭐ ${nm(f)} pegou o bloco dourado!`,f); break;
    case 'pause': SP.paused=true; specAnn(`⏸ ${nm(f)} pausou`,f); break;
    case 'resume': SP.paused=false; specAnn('▶ Continuando!'); break;
  }
}
/* aviso grande no meio da TV */
function specAnn(txt,id){
  const el=$('#spAnn'); clearTimeout(SP.annT);
  if(!txt){ el.className=''; el.innerHTML=''; return; }
  el.innerHTML=(id?avatarHTML(id,72,'big'):'')+`<span>${esc(txt)}</span>`; el.className='show'; void el.offsetWidth; el.className='show pop';
  SP.annT=setTimeout(()=>{ el.className=''; },2600);
}
function specBegin(cfg){
  SP.cfg=cfg; setForceSkin(cfg.type==='camp'?campSkin(cfg):null); setWorldLook(cfg.type==='camp'?(cfg.camp.w||1):null); SP.over=null; SP.view=null; SP.leader=null; SP.paused=false; SP.mode=(cfg.type==='live'||cfg.type==='tlive')?'live':'shared';
  SP.pl={}; cfg.players.forEach(id=>SP.pl[id]={score:0,b:'',info:null});
  SP.start=performance.now()+(cfg.late?0:3200);
  specAnn(null); specRender(); specAnn(`${TYPES[cfg.type]} · Rodada ${cfg.round}`);
  if(!SP.raf) SP.raf=requestAnimationFrame(specTick);
}
function specLeader(){
  if(SP.mode!=='live') return; const pl=Object.keys(SP.pl).filter(id=>!SP.pl[id].info);
  if(!pl.length) return; const top=pl.sort((a,b)=>SP.pl[b].score-SP.pl[a].score)[0];
  if(SP.pl[top].score>0&&top!==SP.leader&&(!SP.leader||SP.pl[top].score>(SP.pl[SP.leader]?SP.pl[SP.leader].score:0))){ if(SP.leader) specAnn(`👑 ${nm(top)} assumiu a liderança!`,top); SP.leader=top; }
}
function specCheckLiveEnd(){
  const ids=Object.keys(SP.pl); if(!ids.length||ids.some(id=>!SP.pl[id].info)) return;
  const infos={}; ids.forEach(id=>infos[id]=SP.pl[id].info);
  if(SP.cfg&&SP.cfg.teams){ const tr=teamResult(infos,SP.cfg.teams); SP.over={tr}; specPodium(null,tr.winner?`${TEAM[tr.winner].e} ${TEAM[tr.winner].n} venceu!`:'Empate!',`${TEAM.az.n} ${fmtN(tr.sum.az)} × ${fmtN(tr.sum.la)} ${TEAM.la.n}`); return; }
  SP.over={rows:liveRank(infos).map(r=>({id:r.id,score:r.info.score,place:r.place,sub:r.info.reason==='quit'?'saiu':''}))};
  specPodium(SP.over.rows);
}
function specSync(m){
  if(!SP.cfg) return; const n=SP.cfg.size||8;
  const des=a=>{ const b=Array.from({length:n},()=>Array(n).fill(null)); (a||[]).forEach((v,i)=>{ if(v) b[(i/n)|0][i%n]={c:v[0],s:v[1]||null,cr:v[3]}; }); return b; };
  const prev=SP.view, bds={}; for(const k in (m.bds||{})){ const q=m.bds[k]; bds[k]={b:des(q.b),sc:q.sc,combo:q.combo,marks:q.marks}; }
  const my=bds.all||bds.az||{b:des([]),sc:0};
  SP.view={bds,b:my.b,sc:my.sc,scs:m.scs||{},turn:m.turn,ph:m.ph,stuck:m.stuck||{},out:m.out||{},combo:my.combo,marks:my.marks,rem:m.rem,at:performance.now(),paused:m.paused,cp:m.cp||null};
  if(m.ev&&(!prev||!prev.ev||prev.ev!==m.ev.id)){ SP.view.ev=m.ev.id; const e=m.ev;
    if(e.res.perfect) specAnn(`✨ PERFECT de ${nm(e.who)}!`,e.who); else if(e.pwf&&e.pwf.length){ const q=e.pwf[0]; specAnn(`${PWI[q.k]} ${PWN[q.k]}${q.blocked?' bloqueado pelo escudo':''} · ${nm(e.who)}`,e.who); } else if(e.atk) specAnn(`💥 ${nm(e.who)} atacou o ${TEAM[e.atk.to].n}! +${e.atk.n} blindados`,e.who); else if(e.res.n>=3) specAnn(`🧹 ${nm(e.who)} limpou ${e.res.n} linhas!`,e.who); }
  else if(prev) SP.view.ev=prev.ev;
  if(m.over&&!SP.over){ SP.over=m.over; const vs=SP.cfg.type==='versus';
    if(SP.cfg.type==='tsplit'){ const w=m.over.winner, sc=m.over.scT||{az:0,la:0}; specPodium(null,w?`${TEAM[w].e} ${TEAM[w].n} venceu!`:'Empate!',`${TEAM.az.n} ${fmtN(sc.az)} × ${fmtN(sc.la)} ${TEAM.la.n}`); }
    else if(SP.cfg.type==='camp'){ specPodium(null,m.over.win?'Fase concluída! '+'⭐'.repeat(m.over.stars||1):'Não foi dessa vez',m.over.msg||''); }
    else if(vs) specPodium(versusRows({...m.over,ids:m.over.ids||SP.cfg.players}));
    else specPodium(null,`${fmtN(m.over.sc)} pontos da equipe`,sharedReason(m.over)); }
  SP.dirty=true;
}
function specPodium(rows,big,sub){
  const el=$('#spAnn'); clearTimeout(SP.annT);
  let h='<div class="podium"><h2>Fim de jogo!</h2>';
  if(rows){ h+=rows.map(r=>`<div class="prow p${r.place}">${r.place===1?'🏆':r.place+'º'} ${avatarHTML(r.id,r.place===1?80:52)}<b>${esc(nm(r.id))}</b><span>${fmtN(r.score)}${r.sub?' · '+r.sub:''}</span></div>`).join(''); }
  else h+=`<div class="pbig">${esc(big)}</div><p>${esc(sub||'')}</p>`;
  el.innerHTML=h+'</div>'; el.className='show podiumon';
}
/* desenha um tabuleiro num canvas, usando as mesmas imagens de bloco do jogo */
function specDraw(cv,b,n,o={}){
  const dpr=Math.min(2,window.devicePixelRatio||1), W=Math.round(cv.clientWidth*dpr); if(!W) return;
  if(cv.width!==W){ cv.width=cv.height=W; }
  const x=cv.getContext('2d'), cs=W/n; x.clearRect(0,0,W,W);
  const slot=getComputedStyle(root).getPropertyValue('--slot').trim()||'#dbe1e9';
  for(let r=0;r<n;r++) for(let c=0;c<n;c++){
    const px=c*cs, py=r*cs, shade=o.region&&!inReg(o.region,r,c);
    x.fillStyle=slot; x.globalAlpha=shade?.45:1; x.beginPath(); const p=cs*.07, w=cs-2*p, rr=w*.2;
    x.moveTo(px+p+rr,py+p); x.arcTo(px+p+w,py+p,px+p+w,py+p+w,rr); x.arcTo(px+p+w,py+p+w,px+p,py+p+w,rr); x.arcTo(px+p,py+p+w,px+p,py+p,rr); x.arcTo(px+p,py+p,px+p+w,py+p,rr); x.fill(); x.globalAlpha=1;
    const v=b[r]&&b[r][c]; if(!v) continue;
    const key=v.c===-1||v.c===-4?'s':v.c===-2?'g':v.c===-5?'u':v.c===-6?'m':v.c===-7?'f':v.c===-8?'r':v.c===-9?'k':v.c===-10?'p':v.c===-11?'c':v.c===-12?'n':v.s==='wild'?'w':String(v.c), img=SPR.cv&&SPR.cv[key];
    if(img) x.drawImage(img,px+cs*.03,py+cs*.03,cs*.94,cs*.94); else { x.fillStyle=v.c===-1?STONE:v.c===-2?GOLD:(PALETTE[v.c]||'#999'); x.fillRect(px+cs*.06,py+cs*.06,cs*.88,cs*.88); }
    const ov=SPR.ov||{}; if(v.s==='ice'&&ov.i) x.drawImage(ov.i,px+cs*.03,py+cs*.03,cs*.94,cs*.94); if(v.s==='bomb'&&ov.b) x.drawImage(ov.b,px+cs*.03,py+cs*.03,cs*.94,cs*.94); if(v.cr&&ov.c) x.drawImage(ov.c,px+cs*.03,py+cs*.03,cs*.94,cs*.94);
  }
  if(o.marks){ const M=o.marks, lw=Math.max(2,cs*.07); x.save(); x.lineWidth=lw; x.setLineDash([cs*.18,cs*.12]); x.strokeStyle='rgba(58,209,255,.95)'; x.fillStyle='rgba(58,209,255,.13)';
    (M.r||[]).forEach(y=>{ x.fillRect(0,y*cs,W,cs); x.strokeRect(lw/2,y*cs+lw/2,W-lw,cs-lw); }); (M.k||[]).forEach(k=>{ x.fillRect(k*cs,0,cs,W); x.strokeRect(k*cs+lw/2,lw/2,cs-lw,W-lw); });
    (M.c||[]).forEach(i=>{ x.strokeRect((i%n)*cs+cs*.12,((i/n)|0)*cs+cs*.12,cs*.76,cs*.76); }); x.restore(); }
}
function specRender(){
  if(!$('#spec').classList.contains('active')) return;
  const body=$('#spBody'), n=NET.players.length;
  $('#spTitle').textContent=SP.mode==='lobby'?'Sala conectada':`${TYPES[SP.cfg.type]} · R${SP.cfg.round}`;
  $('#spSub').textContent=`${n} jogador${n>1?'es':''} · espectador`;
  if(SP.mode==='lobby'){
    $('#spTimer').textContent='';
    const L=NET.lobby, ms=NET.room.matches;
    let h=`<div class="splobby"><div class="spcol"><h2>Jogadores</h2><div class="spplayers">${NET.players.map(id=>`<div>${avatarHTML(id,64,'big')}<b>${esc(nm(id))}</b>${id==='A'?'<small>👑 líder</small>':''}</div>`).join('')}</div>
      <h2 style="margin-top:22px">Próxima partida</h2><div class="spmode"><b>${esc(TYPES[L.type])}</b><div class="chips">${summary(L.opts,L.type).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
      <p class="muted">Esperando o líder começar…</p></div>`;
    if(ms.length){ const {list}=roomStats(); h+=`<div class="spcol"><h2>Resultados da sala · ${ms.length} partida${ms.length>1?'s':''}</h2>${list.map((p,i)=>`<div class="kv big"><span>${['🥇','🥈','🥉'][i]||(i+1)+'º'} ${esc(p.n)}</span><b>${p.w} V · ${fmtN(p.pts)}</b></div>`).join('')}</div>`; }
    body.innerHTML=h+'</div>'; return;
  }
  if(SP.mode==='live'){
    const ids=SP.cfg.players;
    const T=SP.cfg.teams;
    body.innerHTML=`<div class="splive"><div class="spgrid" id="spGrid">${ids.map(id=>`<div class="spcard" data-id="${id}"${T?` style="outline:4px solid ${TEAM[T[id]].c};outline-offset:-2px"`:''}><div class="sptop">${avatarHTML(id,34)}<b>${esc(nm(id))}</b><span class="spsc">0</span></div><canvas></canvas><div class="spst">jogando</div></div>`).join('')}</div><div class="sprank" id="spRank"></div></div>`;
  } else if(SP.cfg.type==='tsplit'){
    body.innerHTML=`<div class="splive"><div class="sptwo">${['az','la'].map(k=>`<div class="spcard" style="outline:4px solid ${TEAM[k].c};outline-offset:-2px"><div class="sptop"><b>${TEAM[k].e} ${TEAM[k].n}</b><span class="spsc" id="spSc_${k}">0</span></div><canvas id="spB_${k}"></canvas><div class="spst" id="spSt_${k}"></div></div>`).join('')}</div><div class="sprank" id="spRank"></div></div>`;
  } else {
    body.innerHTML=`<div class="splive"><div class="spbig"><canvas id="spBoard"></canvas></div><div class="sprank" id="spRank"></div></div>`;
  }
  SP.dirty=true; specLayout();
}
function specLayout(){
  if(SP.mode==='live'){
    const g=$('#spGrid'); if(!g) return; const cards=[...g.children], k=cards.length, W=g.clientWidth, H=g.clientHeight;
    let best=0, bc=1; for(let cols=1;cols<=k;cols++){ const rows=Math.ceil(k/cols), s=Math.min((W-(cols-1)*14)/cols-16,(H-(rows-1)*14)/rows-70); if(s>best){ best=s; bc=cols; } }
    g.style.gridTemplateColumns=`repeat(${bc},auto)`; cards.forEach(c=>{ c.querySelector('canvas').style.width=Math.max(80,Math.floor(best))+'px'; });
  } else if(SP.cfg&&SP.cfg.type==='tsplit'){ const w=$('.sptwo'); if(!w) return; const sz=Math.max(120,Math.floor(Math.min((w.clientWidth-40)/2-16,w.clientHeight-80))); ['az','la'].forEach(k=>{ const c=$('#spB_'+k); if(c) c.style.width=sz+'px'; });
  } else { const w=$('.spbig'), cv=$('#spBoard'); if(!w||!cv) return; cv.style.width=Math.max(120,Math.floor(Math.min(w.clientWidth,w.clientHeight)-8))+'px'; }
  SP.dirty=true;
}
window.addEventListener('resize',()=>{ if($('#spec').classList.contains('active')) specLayout(); });
function specTick(t){
  SP.raf=0; if(!$('#spec').classList.contains('active')) return;
  const cfg=SP.cfg;
  if(cfg){ const tot=TIMES[cfg.opts.time]*1000;
    if(tot){ let rem; if(SP.mode==='shared'&&SP.view&&SP.view.rem!=null) rem=SP.view.rem-(SP.view.paused?0:t-SP.view.at); else rem=tot-Math.max(0,t-SP.start); if(SP.over) rem=Math.max(0,rem); $('#spTimer').textContent=fmtT(Math.max(0,rem)); }
    else $('#spTimer').textContent=''; }
  if(SP.dirty){ SP.dirty=false; specPaint(); }
  SP.raf=requestAnimationFrame(specTick);
}
function specPaint(){
  if(!SP.cfg) return; const rank=$('#spRank');
  if(SP.mode==='live'){
    const ids=SP.cfg.players.slice();
    ids.forEach(id=>{ const c=document.querySelector(`.spcard[data-id="${id}"]`); if(!c) return; const p=SP.pl[id];
      specDraw(c.querySelector('canvas'),strBoard(p.b),8); c.querySelector('.spsc').textContent=fmtN(p.score);
      c.querySelector('.spst').textContent=p.info?(p.info.reason==='quit'?'saiu':'terminou'):(id===SP.leader?'👑 na liderança':'jogando'); c.classList.toggle('done',!!p.info); c.classList.toggle('lead',id===SP.leader&&!p.info); });
    if(rank&&SP.cfg.teams){ const T=SP.cfg.teams, sum={az:0,la:0}; ids.forEach(id=>sum[T[id]]+=SP.pl[id].score);
      rank.innerHTML=`<h2>Times</h2>${['az','la'].map(k=>`<div class="kv big"><span style="color:${TEAM[k].c};font-weight:700">${TEAM[k].e} ${TEAM[k].n}</span><b>${fmtN(sum[k])}</b></div>`).join('')}<h2 style="margin-top:16px">Jogadores</h2>`+ids.slice().sort((a,b)=>SP.pl[b].score-SP.pl[a].score).map(id=>`<div class="kv"><span>${TEAM[T[id]].e} ${avatarHTML(id,24)}${esc(nm(id))}</span><b>${fmtN(SP.pl[id].score)}</b></div>`).join(''); }
    else if(rank) rank.innerHTML='<h2>Ranking</h2>'+ids.sort((a,b)=>SP.pl[b].score-SP.pl[a].score).map((id,i)=>`<div class="kv big"><span>${i+1}º ${avatarHTML(id,28)}${esc(nm(id))}</span><b>${fmtN(SP.pl[id].score)}</b></div>`).join('');
  } else if(SP.view&&SP.cfg.type==='tsplit'){
    const v=SP.view, T=SP.cfg.teams, ids=SP.cfg.players;
    ['az','la'].forEach(k=>{ const B=v.bds[k]; if(!B) return; specDraw($('#spB_'+k),B.b,SP.cfg.size||8,{marks:B.marks}); $('#spSc_'+k).textContent=fmtN(B.sc||0); $('#spSt_'+k).textContent=v.out&&v.out[k]?'sem jogadas':(B.combo>=2?'🔥 combo x'+B.combo:''); });
    if(rank) rank.innerHTML='<h2>Jogadores</h2>'+ids.map(id=>`<div class="kv"><span>${TEAM[T[id]].e} ${avatarHTML(id,24)}${esc(nm(id))}</span><b>${v.stuck&&v.stuck[id]?'<small class="muted">sem jogada</small>':''}</b></div>`).join('');
  } else if(SP.view){
    const v=SP.view, cfg=SP.cfg, vs=cfg.type==='versus', ids=cfg.players;
    let reg=null; if(cfg.type==='halves'){ /* mostra as divisões sem escurecer nenhuma */ }
    specDraw($('#spBoard'),v.b,cfg.size||8,{region:reg,marks:v.marks});
    if(rank){ let h=vs?'<h2>Placar</h2>':cfg.type==='camp'&&v.cp?`<h2>${CWD(v.cp.w).phases[v.cp.ph-1].icon} Mundo ${v.cp.w||1} · Fase ${v.cp.ph} · ${esc(CWD(v.cp.w).phases[v.cp.ph-1].name)}</h2><p class="spobj">${esc(v.cp.txt)}</p>`:`<h2>Pontos da equipe</h2><div class="spteam">${fmtN(v.sc||0)}</div>`;
      h+=ids.map((id,k)=>`<div class="kv big${v.turn===id&&isTurnType(cfg.type)?' turn':''}"><span>${avatarHTML(id,28)}${esc(nm(id))}${(cfg.type==='halves'||cfg.type==='camp')&&ids.length>2?` <small class="muted">${['↖','↗','↙','↘'][k]}</small>`:''}${v.stuck&&v.stuck[id]?' <small class="muted">sem jogada</small>':''}</span><b>${vs?fmtN(v.scs[id]||0):v.turn===id&&isTurnType(cfg.type)?'vez':''}</b></div>`).join('');
      if(v.combo>=2) h+=`<p class="spcombo">🔥 Combo x${v.combo}</p>`;
      rank.innerHTML=h; }
  }
}
